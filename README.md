# Gotcha-AI-Python 🍀 // Multi-Level AI Mind Explainer

Aplikasi web edukasi cerdas berbasis **Python Flask** dan **Google Gemini API** yang mampu mendekonstruksi materi pelajaran, rumus pelik, jurnal ilmiah, dan teori membosankan menjadi penjelasan yang mudah dipahami sesuai jenjang pendidikan.

---

## 📁 Struktur Folder Proyek

```text
Gotcha-AI-Python/
├── .env                  # File rahasia (API Key & Flask Config)
├── .env.example          # Template contoh .env buat di-push ke Git
├── .gitignore            # Biar .env, venv, dll nggak ikut ter-push
├── app.py                # Main backend Flask & routing Gemini API
├── requirements.txt      # List pustaka Python (Flask, google-genai, dll)
├── static/               # Tempat aset statis
│   ├── css/
│   │   ├── input.css     # File CSS utama (tempat @tailwind directives)
│   │   └── output.css    # CSS hasil kompilasi Tailwind (dipanggil di HTML)
│   └── js/
│       └── main.js       # Script JS vanila buat fetch API & manipulasi DOM
└── templates/            # Tempat file UI HTML
    └── index.html        # Halaman utama aplikasi
```

---

## ✨ Fitur-Fitur Utama

1. **Multi-Level Mind Explainer**:
   - 🧒 **Anak SD**: Bahasa polos, analogi seru, dongeng perumpamaan.
   - 🧑‍🎓 **Anak SMP**: Logika dasar, poin esensial, tanpa jargon rumit.
   - 🛠️ **SMA / SMK**: Rumus praktis, taktik *cheat sheet*, contoh dunia nyata.
   - 🎓 **Mahasiswa**: Analisis kritis, landasan akademik, pembedahan mendalam.
2. **Dekonstruksi Materi Multi-Segmen**:
   - 💡 **Rangkuman & Analogi Utama**: Penjelasan inti konsep.
   - 🗺️ **Roadmap Belajar Terstruktur**: Tahapan pemahaman langkah demi langkah.
   - 📝 **Ujian Kuis Interaktif (Timer 3 Menit)**: Soal pilihan ganda otomatis, penilaian skor, dan ulasan jawaban benar/salah.
   - ⚡ **Pilihan Refine Cepat**: Opsi *"Gampang"*, *"Singkat"*, *"Analogi"*, dan *"Detail"*.
3. **Multimodal Input (Teks, Audio, Dokumen)**:
   - 🎙️ **Voice Note (VN)**: Rekam suara langsung via mic browser dengan visualizer gelombang suara dan transkripsi cerdas.
   - 📎 **Upload Dokumen hingga 15MB**: Dukungan parsing file PDF (`.pdf`), Word (`.docx`), PowerPoint (`.pptx`), gambar (`.jpg`, `.png`), dan audio (`.mp3`, `.wav`).
4. **Desain & Pengalaman Pengguna (UI/UX)**:
   - 🌗 **Toggle Tema Gelap & Terang**: Dilengkapi animasi pop-up ikon dan efek suara (*chime synthesis* via Web Audio API).
   - 📜 **Riwayat Belajar (History)**: Tersimpan rapi di browser (*localStorage*) dengan fitur pencarian dan *New Chat*.
   - 📋 **Aksi Cepat**: Tombol *Salin*, *Ubah Teks*, dan *Contoh Materi Cepat*.

---

## 🚀 Panduan Menjalankan Proyek (Python Flask)

### 1. Buat & Aktifkan Virtual Environment (Disarankan)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependensi
```bash
pip install -r requirements.txt
```

### 3. Konfigurasi API Key
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan masukkan API Key Gemini Anda:
```env
GEMINI_API_KEY="AIzaSy..."
PORT=3000
```
> Kunci API Gemini bisa didapatkan secara gratis di [Google AI Studio](https://aistudio.google.com/).

### 4. Jalankan Aplikasi Flask
```bash
python app.py
```
Aplikasi akan aktif di **http://localhost:3000** atau **http://127.0.0.1:3000**.
Buka URL tersebut di browser favorit Anda!
