import os
import io
import json
import base64
import urllib.request
import urllib.error
from flask import Flask, render_template, request, jsonify, send_from_directory
from dotenv import load_dotenv

# Muat variabel lingkungan dari file .env
load_dotenv()

app = Flask(
    __name__,
    static_folder="static",
    template_folder="templates"
)

# Konfigurasi batas upload request body (mendukung dokumen/audio hingga 15MB)
app.config['MAX_CONTENT_LENGTH'] = 35 * 1024 * 1024  # 35 MB (cukup untuk file 15MB base64)

# Middleware untuk logging setiap request masuk
@app.before_request
def log_request_info():
    if request.path.startswith('/api/'):
        app.logger.info(f"[HTTP] {request.method} {request.path}")

def get_api_key(req):
    """Mendapatkan API Key dari request header atau environment variables."""
    auth_header = req.headers.get("x-gemini-api-key") or req.headers.get("authorization")
    if auth_header and isinstance(auth_header, str):
        if auth_header.startswith("Bearer "):
            return auth_header[7:].strip()
        return auth_header.strip()
    return os.environ.get("GEMINI_API_KEY", "").strip()

# =================================================================
# ROUTE UTAMA (FRONTEND UI)
# =================================================================
@app.route("/")
def index():
    """Halaman utama aplikasi Gotcha.ai."""
    return render_template("index.html")

# =================================================================
# ROUTE API: GEMINI MULTIMODAL (TEXT, IMAGE, AUDIO/VOICE NOTE)
# =================================================================
@app.route("/api/gemini", methods=["POST"])
def gemini_proxy():
    """
    API Proxy aman di sisi server untuk integrasi Google Gemini AI.
    Mendukung teks, gambar, dan rekaman Voice Note (VN).
    """
    api_key = get_api_key(request)
    data = request.get_json(silent=True) or {}
    
    system_prompt = data.get("systemPrompt") or "Kamu adalah asisten edukasi Gotcha.ai yang ramah dan pintar."
    user_query = data.get("userQuery") or ""
    image = data.get("image")
    audio = data.get("audio")

    if not user_query and not image and not audio:
        return jsonify({"error": "Konten materi kosong."}), 400

    if not api_key:
        return jsonify({
            "fallback": True,
            "message": "API Key belum diset pada panel Settings > Secrets. Menjalankan Mode Cepat."
        }), 200

    # Coba gunakan SDK resmi google-genai jika terinstall, atau fallback ke REST API Gemini
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        contents = []

        if image and isinstance(image, dict) and image.get("data") and image.get("mimeType"):
            img_bytes = base64.b64decode(image["data"])
            contents.append(types.Part.from_bytes(data=img_bytes, mime_type=image["mimeType"]))

        if audio and isinstance(audio, dict) and audio.get("data") and audio.get("mimeType"):
            audio_bytes = base64.b64decode(audio["data"])
            contents.append(types.Part.from_bytes(data=audio_bytes, mime_type=audio["mimeType"]))

        if user_query:
            contents.append(user_query)
        elif audio:
            contents.append("Tolong dengarkan pesan suara (Voice Note) ini dengan seksama dan bedah materi yang disampaikan secara komprehensif!")

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7
            )
        )

        return jsonify({"text": response.text or ""}), 200

    except Exception as sdk_err:
        app.logger.warning(f"[INFO] Mencoba REST API Gemini sebagai fallback: {sdk_err}")
        
        # Fallback ke Google AI Studio REST API
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            
            parts = []
            if image and isinstance(image, dict) and image.get("data") and image.get("mimeType"):
                parts.append({
                    "inline_data": {
                        "mime_type": image["mimeType"],
                        "data": image["data"]
                    }
                })
            if audio and isinstance(audio, dict) and audio.get("data") and audio.get("mimeType"):
                parts.append({
                    "inline_data": {
                        "mime_type": audio["mimeType"],
                        "data": audio["data"]
                    }
                })
            if user_query:
                parts.append({"text": user_query})
            elif audio:
                parts.append({"text": "Tolong dengarkan pesan suara (Voice Note) ini dan bedah materinya secara komprehensif!"})

            payload = {
                "contents": [{"parts": parts}],
                "system_instruction": {"parts": [{"text": system_prompt}]},
                "generation_config": {"temperature": 0.7}
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )

            with urllib.request.urlopen(req, timeout=60) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                
                # Ekstrak teks dari respons Gemini
                candidates = resp_data.get("candidates", [])
                if candidates:
                    parts_resp = candidates[0].get("content", {}).get("parts", [])
                    if parts_resp and "text" in parts_resp[0]:
                        return jsonify({"text": parts_resp[0]["text"]}), 200

                return jsonify(resp_data), 200

        except urllib.error.HTTPError as http_err:
            err_body = http_err.read().decode("utf-8", errors="ignore")
            app.logger.error(f"[GEMINI HTTP ERROR] {http_err.code}: {err_body}")
            return jsonify({
                "fallback": True,
                "message": f"Koneksi Gemini API: {http_err.reason}. Mode Cepat diaktifkan."
            }), 200
        except Exception as rest_err:
            app.logger.error(f"[GEMINI REST ERROR] {rest_err}")
            return jsonify({
                "fallback": True,
                "message": str(rest_err) or "Mode Cepat aktif."
            }), 200

# =================================================================
# ROUTE API: TRANSKRIPSI VOICE NOTE (VN)
# =================================================================
@app.route("/api/transcribe-audio", methods=["POST"])
def transcribe_audio():
    """
    Mentranskripsikan audio pesan suara (Voice Note) ke dalam teks bahasa Indonesia.
    """
    api_key = get_api_key(request)
    data = request.get_json(silent=True) or {}
    audio_data = data.get("audioData")
    mime_type = data.get("mimeType") or "audio/webm"

    if not audio_data:
        return jsonify({"error": "Data audio VN kosong."}), 400

    if not api_key:
        return jsonify({"fallback": True, "text": ""}), 200

    prompt_text = "Dengarkan audio pesan suara (voice note) berikut dan transkripsikan perkataannya ke dalam teks Bahasa Indonesia yang rapi. Tuliskan HANYA teks isi ucapan yang terdengar, tanpa tanda kutip, tanpa kata pembuka atau penjelas."

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        audio_bytes = base64.b64decode(audio_data)

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                prompt_text
            ],
            config=types.GenerateContentConfig(temperature=0.2)
        )
        return jsonify({"text": (response.text or "").strip()}), 200

    except Exception:
        # Fallback ke REST API
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": audio_data
                            }
                        },
                        {"text": prompt_text}
                    ]
                }],
                "generation_config": {"temperature": 0.2}
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                candidates = resp_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return jsonify({"text": parts[0]["text"].strip()}), 200
        except Exception as e:
            app.logger.error(f"[TRANSCRIBE ERROR] {e}")

        return jsonify({"fallback": True, "text": ""}), 200

# =================================================================
# ROUTE API: PARSE DOKUMEN (.PDF, .DOCX, .PPTX, .TXT)
# =================================================================
@app.route("/api/parse-document", methods=["POST"])
def parse_document():
    """
    Mengekstrak teks materi dari dokumen yang diunggah (.pdf, .docx, .pptx, .txt).
    Mendukung upload hingga 50MB.
    """
    data = request.get_json(silent=True) or {}
    base64_data = data.get("base64Data")
    mime_type = data.get("mimeType", "")
    filename = data.get("filename", "")
    filename_lower = filename.lower()

    if not base64_data:
        return jsonify({"error": "Data file kosong."}), 400

    try:
        file_bytes = base64.b64decode(base64_data)
        extracted_text = ""

        # Parsing PDF
        if mime_type == "application/pdf" or filename_lower.endswith(".pdf"):
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                pages_text = []
                for idx, page in enumerate(reader.pages):
                    t = page.extract_text()
                    if t:
                        pages_text.append(t)
                extracted_text = "\n\n".join(pages_text)
            except ImportError:
                # Fallback sederhana jika pustaka pypdf belum terpasang
                extracted_text = file_bytes.decode("utf-8", errors="ignore")

        # Parsing Word (.docx)
        elif filename_lower.endswith(".docx") or mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            try:
                import docx
                doc = docx.Document(io.BytesIO(file_bytes))
                paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                extracted_text = "\n".join(paragraphs)
            except ImportError:
                extracted_text = file_bytes.decode("utf-8", errors="ignore")

        # Parsing PowerPoint (.pptx)
        elif filename_lower.endswith(".pptx") or mime_type == "application/vnd.openxmlformats-officedocument.presentationml.presentation":
            try:
                import pptx
                prs = pptx.Presentation(io.BytesIO(file_bytes))
                slides_text = []
                for slide in prs.slides:
                    slide_parts = []
                    for shape in slide.shapes:
                        if shape.has_text_frame:
                            for paragraph in shape.text_frame.paragraphs:
                                if paragraph.text.strip():
                                    slide_parts.append(paragraph.text)
                    if slide_parts:
                        slides_text.append("\n".join(slide_parts))
                extracted_text = "\n\n--- Slide ---\n\n".join(slides_text)
            except ImportError:
                extracted_text = file_bytes.decode("utf-8", errors="ignore")

        # Parsing Plain Text & Markdown
        elif filename_lower.endswith((".txt", ".md")) or mime_type.startswith("text/"):
            extracted_text = file_bytes.decode("utf-8", errors="ignore")

        else:
            # Fallback untuk file teks umum
            extracted_text = file_bytes.decode("utf-8", errors="ignore")

        extracted_text = extracted_text.replace("\r\n", "\n").strip()

        if not extracted_text:
            return jsonify({
                "error": "Sistem tidak mendeteksi teks dalam file ini. Pastikan file bukan berupa scan gambar kosong."
            }), 400

        return jsonify({"text": extracted_text}), 200

    except Exception as parse_err:
        app.logger.error(f"[PARSER ERROR] {parse_err}")
        return jsonify({"error": f"Gagal memproses file dokumen: {str(parse_err)}"}), 500

# =================================================================
# ENTRYPOINT SERVER FLASK
# =================================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    host = os.environ.get("HOST", "0.0.0.0")
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    print(f"🚀 Gotcha.ai Python Flask server berjalan di http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)
