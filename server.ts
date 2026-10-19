import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON request body with 100mb limit to support large document/image/audio uploads up to 50MB
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));

  // Log incoming API calls
  app.use((req, res, next) => {
    if (req.url.startsWith("/api/")) {
      console.log(`[HTTP] ${req.method} ${req.url}`);
    }
    next();
  });

  // Serve static files from static directory
  const staticPath = path.join(process.cwd(), "static");
  app.use("/static", express.static(staticPath));
  // Backward compatibility alias for assets/
  app.use("/assets", express.static(staticPath));
  app.use("/Gotcha-AI-Python/static", express.static(staticPath));

  // Secure Server-side API Proxy for Gemini Studio Integration (Multimodal: Text, Images, Voice Note / Audio)
  app.post("/api/gemini", async (req, res) => {
    let apiKey = req.headers["x-gemini-api-key"] || req.headers["authorization"];
    if (typeof apiKey === "string" && apiKey.startsWith("Bearer ")) {
      apiKey = apiKey.substring(7);
    }
    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY;
    }

    const { systemPrompt, userQuery, image, audio } = req.body;

    if (!userQuery && !image && !audio) {
      return res.status(400).json({ error: "Konten materi kosong." });
    }

    if (!apiKey) {
      return res.status(200).json({
        fallback: true,
        message: "API Key belum diset pada panel Settings > Secrets. Menjalankan Mode Cepat."
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey as string,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const contentsParts: any[] = [];
      if (image && image.data && image.mimeType) {
        contentsParts.push({
          inlineData: {
            mimeType: image.mimeType,
            data: image.data
          }
        });
      }
      if (audio && audio.data && audio.mimeType) {
        contentsParts.push({
          inlineData: {
            mimeType: audio.mimeType,
            data: audio.data
          }
        });
      }
      if (userQuery) {
        contentsParts.push({ text: userQuery });
      } else if (audio) {
        contentsParts.push({ text: "Tolong dengarkan pesan suara (Voice Note) ini dengan seksama dan bedah materi yang disampaikan secara komprehensif!" });
      }

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contentsParts.length === 1 && contentsParts[0].text
          ? contentsParts[0].text
          : { parts: contentsParts },
        config: {
          systemInstruction: systemPrompt || "Kamu adalah asisten edukasi Gotcha.ai yang ramah dan pintar.",
          temperature: 0.7
        }
      });

      const text = aiResponse.text || "";
      return res.status(200).json({ text });
    } catch (error: any) {
      console.error(`[GEMINI API ERROR]`, error?.message, error);
      return res.status(200).json({
        fallback: true,
        message: error?.message || "Layanan Gemini API sedang sibuk. Mode Cepat diaktifkan."
      });
    }
  });

  // API Endpoint to transcribe Voice Note audio using Gemini
  app.post("/api/transcribe-audio", async (req, res) => {
    let apiKey = req.headers["x-gemini-api-key"] || req.headers["authorization"];
    if (typeof apiKey === "string" && apiKey.startsWith("Bearer ")) {
      apiKey = apiKey.substring(7);
    }
    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY;
    }

    const { audioData, mimeType } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: "Data audio VN kosong." });
    }

    if (!apiKey) {
      return res.status(200).json({ fallback: true, text: "" });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey as string,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: audioData
            }
          },
          {
            text: "Dengarkan audio pesan suara (voice note) berikut dan transkripsikan perkataannya ke dalam teks Bahasa Indonesia yang rapi. Tuliskan HANYA teks isi ucapan yang terdengar, tanpa tanda kutip, tanpa kata pembuka atau penjelas."
          }
        ],
        config: {
          temperature: 0.2
        }
      });

      const text = response.text?.trim() || "";
      return res.status(200).json({ text });
    } catch (error: any) {
      console.log(`[AUDIO TRANSCRIBE ERROR] ${error?.message}`);
      return res.status(200).json({ fallback: true, text: "" });
    }
  });

  // API Endpoint to parse document files (.pdf, .docx, .pptx)
  app.post("/api/parse-document", async (req, res) => {
    const { base64Data, mimeType, filename } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: "Data file kosong." });
    }

    try {
      const buffer = Buffer.from(base64Data, "base64");
      let extractedText = "";

      const filenameLower = filename?.toLowerCase() || "";

      if (mimeType === "application/pdf" || filenameLower.endsWith(".pdf")) {
        console.log(`[PARSER] Parsing PDF file: ${filename || "unnamed.pdf"}`);
        // @ts-ignore
        const pdfModule: any = await import("pdf-parse");
        let pdfParser = pdfModule.default || pdfModule;
        if (typeof pdfParser !== "function" && pdfParser.default) {
          pdfParser = pdfParser.default;
        }
        const parsedPdf = await pdfParser(buffer);
        extractedText = parsedPdf.text || "";
      } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // .docx
        mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || // .pptx
        mimeType === "application/msword" ||
        mimeType === "application/vnd.ms-powerpoint" ||
        filenameLower.endsWith(".docx") ||
        filenameLower.endsWith(".doc") ||
        filenameLower.endsWith(".pptx") ||
        filenameLower.endsWith(".ppt")
      ) {
        console.log(`[PARSER] Parsing Office document: ${filename || "unnamed.office"}`);
        // @ts-ignore
        const officeParserModule: any = await import("officeparser");
        const officeParser = officeParserModule.default || officeParserModule;
        
        let parseOfficeFn = officeParser.parseOffice;
        if (!parseOfficeFn && officeParser.default) {
          parseOfficeFn = officeParser.default.parseOffice;
        }
        if (!parseOfficeFn) {
          parseOfficeFn = officeParser;
        }

        extractedText = await new Promise<string>((resolve, reject) => {
          parseOfficeFn(buffer, (data: any, err: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(data || "");
            }
          });
        });
      } else if (filenameLower.endsWith(".txt") || filenameLower.endsWith(".md") || mimeType?.startsWith("text/")) {
        extractedText = buffer.toString("utf-8");
      } else {
        return res.status(400).json({ error: "Format file tidak didukung oleh pendeteksi server." });
      }

      // Clean up extractedText slightly (remove excessive newlines)
      extractedText = extractedText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

      if (!extractedText) {
        return res.status(400).json({ error: "Sistem tidak mendeteksi teks apa pun dalam file ini. Pastikan file bukan berupa scan gambar kosong." });
      }

      return res.status(200).json({ text: extractedText });
    } catch (error: any) {
      console.error("[PARSER ERROR]", error);
      return res.status(500).json({ error: `Gagal memproses file dokumen: ${error.message || error}` });
    }
  });

  // Serve the index.html page
  app.get("/", (req, res) => {
    const indexPath = path.join(process.cwd(), "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      const templatePath = path.join(process.cwd(), "templates", "index.html");
      let content = fs.readFileSync(templatePath, "utf-8");
      content = content.replace(/\{\{\s*url_for\('static',\s*filename='([^']+)'\)\s*\}\}/g, "/static/$1");
      res.setHeader("Content-Type", "text/html");
      res.send(content);
    }
  });

  // Serve static assets or configure Vite middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Starting in DEVELOPMENT mode with Vite Middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SERVER] Starting in PRODUCTION mode with static file delivery");
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
