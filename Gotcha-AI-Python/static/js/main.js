// =================================================================
// GOTCHA.AI INTERAKTIF ENGINE - CORE LOGIC V4 (FINAL REVOLUTION KUIS)
// =================================================================

// State Management Global untuk Fitur Baru (Roadmap, Kuis, History)
let currentMateri = "";
let examTimer = null;
let examSeconds = 180; 
let examQuestions = [];
let userAnswers = [];

// State Management Global untuk Fitur Unggah File & Media (Hingga 15MB)
let uploadedFileBase64 = null;
let uploadedFileMimeType = null;
let uploadedFileName = null;
let uploadedFileType = null; // 'image', 'document', 'audio', 'text'
let uploadedDocumentText = null;
let uploadedImagePreviewUrl = null;

// State Management Global untuk Fitur Voice Note (VN) & Audio
let mediaRecorder = null;
let audioStream = null;
let audioChunks = [];
let isRecordingVN = false;
let vnTimerInterval = null;
let vnRecordingSeconds = 0;
let vnSpeechRecognition = null;
let transcribedVNText = "";
let uploadedAudioBase64 = null;
let uploadedAudioMimeType = null;
let vnAudioPlayer = null;
let vnAudioBlobUrl = null;
let isPlayingVN = false;

// =================================================================
// THEME SWITCH ENGINE (DARK <-> LIGHT DENGAN ANIMASI POP & SOUND CHIME)
// =================================================================
window.currentTheme = localStorage.getItem('gotcha_theme') || 'dark';

window.playThemeSwitchSound = function(isToLight) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isToLight ? 2600 : 1800, ctx.currentTime);
        
        osc.type = 'sine';
        if (isToLight) {
            // Nada lembut naik yang ceria untuk tema siang (matahari)
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5
        } else {
            // Nada tenang menyejukkan yang turun untuk tema malam (bulan)
            osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
            osc.frequency.exponentialRampToValueAtTime(440.00, ctx.currentTime + 0.14); // A4
        }
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
        // Safe audio fallback
    }
};

window.applyTheme = function(theme, animate = false) {
    window.currentTheme = theme;
    localStorage.setItem('gotcha_theme', theme);
    
    const isLight = (theme === 'light');
    if (isLight) {
        document.body.classList.add('theme-light');
        document.documentElement.classList.add('theme-light');
    } else {
        document.body.classList.remove('theme-light');
        document.documentElement.classList.remove('theme-light');
    }
    
    const themeIconContainer = document.getElementById('theme-icon-container');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const welcomeIconContainers = document.querySelectorAll('.welcome-theme-icon-container');
    const welcomeToggleBtns = document.querySelectorAll('.welcome-theme-toggle-btn');
    
    const sunSvg = `
        <svg class="w-[19px] h-[19px] sun-icon-aduhai text-amber-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="4.3" fill="#f59e0b" stroke="#d97706" stroke-width="0.8"/>
            <line x1="12" y1="1.8" x2="12" y2="4.8" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="12" y1="19.2" x2="12" y2="22.2" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="4.79" y1="4.79" x2="6.91" y2="6.91" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="17.09" y1="17.09" x2="19.21" y2="19.21" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="1.8" y1="12" x2="4.8" y2="12" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="19.2" y1="12" x2="22.2" y2="12" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="4.79" y1="19.21" x2="6.91" y2="17.09" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="17.09" y1="6.91" x2="19.21" y2="4.79" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
    `;
    const moonHtml = `
        <i class="fa-solid fa-moon text-amber-400 text-[14px] moon-icon-aduhai"></i>
    `;
    
    if (themeIconContainer) {
        themeIconContainer.innerHTML = isLight ? sunSvg : moonHtml;
    }
    
    welcomeIconContainers.forEach(container => {
        container.innerHTML = isLight ? sunSvg : moonHtml;
    });
    
    if (themeToggleBtn) {
        if (isLight) {
            themeToggleBtn.setAttribute('title', 'Ganti ke Tema Gelap (Malam)');
            themeToggleBtn.classList.remove('text-amber-400');
            themeToggleBtn.classList.add('text-amber-500');
        } else {
            themeToggleBtn.setAttribute('title', 'Ganti ke Tema Terang (Siang)');
            themeToggleBtn.classList.remove('text-amber-500');
            themeToggleBtn.classList.add('text-amber-400');
        }
    }

    welcomeToggleBtns.forEach(btn => {
        if (isLight) {
            btn.setAttribute('title', 'Ganti ke Tema Gelap (Malam)');
            btn.classList.remove('text-amber-400');
            btn.classList.add('text-amber-500');
        } else {
            btn.setAttribute('title', 'Ganti ke Tema Terang (Siang)');
            btn.classList.remove('text-amber-500');
            btn.classList.add('text-amber-400');
        }
    });
    
    if (animate) {
        if (themeIconContainer) {
            themeIconContainer.classList.remove('animate-theme-pop');
            void themeIconContainer.offsetWidth; // Trigger reflow
            themeIconContainer.classList.add('animate-theme-pop');
        }
        welcomeIconContainers.forEach(c => {
            c.classList.remove('animate-theme-pop');
            void c.offsetWidth;
            c.classList.add('animate-theme-pop');
        });
    }
};

window.toggleTheme = function() {
    const nextTheme = (window.currentTheme === 'dark') ? 'light' : 'dark';
    window.applyTheme(nextTheme, true);
    window.playThemeSwitchSound(nextTheme === 'light');
    showToast(nextTheme === 'light' ? 'Mode Terang Aktif ☀️ (Cerah & Adem)' : 'Mode Gelap Aktif 🌙 (Midnight)', 'info');
};

// Fungsi otomatis jalan pas halaman pertama kali dibuka browser
document.addEventListener('DOMContentLoaded', () => {
    window.applyTheme(window.currentTheme, false);
    initHistory();
    setupEventListeners();
    initWelcomeOnboarding();
});

// Intro Onboarding / Welcome Slide Initializer
function initWelcomeOnboarding() {
    const welcomeOverlay = document.getElementById('welcomeOverlay');
    const welcomeCard = document.getElementById('welcomeCard');
    if (welcomeOverlay && welcomeCard) {
        // Hapus penanda dismiss sementara agar selalu tampil pas user muat halaman (aman & asyik buat dicoba)
        setTimeout(() => {
            welcomeCard.classList.remove('opacity-0', 'translate-x-[150px]');
            welcomeCard.classList.add('animate-slide-in-left');
        }, 150);
    }
}

// Fungsi dismiss welcome dengan animasi geser ke kiri (slide-out to the left)
window.dismissWelcome = function() {
    const welcomeOverlay = document.getElementById('welcomeOverlay');
    const welcomeCard = document.getElementById('welcomeCard');
    
    // Play ultra-aesthetic, warm echoing starry chime sequence
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            
            // Main mix node to control global audio volume safely
            const mainGain = ctx.createGain();
            mainGain.gain.setValueAtTime(0.8, ctx.currentTime);
            
            // Lowpass filter to keep the high-frequency bells pleasant and cozy (soft on ears)
            const lowpass = ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.setValueAtTime(2000, ctx.currentTime);
            lowpass.Q.setValueAtTime(0.8, ctx.currentTime);

            // Reverb / Echo / Delay line for a beautiful cathedral-like cosmic resonance
            const delayNode = ctx.createDelay(1.0);
            delayNode.delayTime.setValueAtTime(0.35, ctx.currentTime); // 350ms delay intervals

            const delayFeedback = ctx.createGain();
            delayFeedback.gain.setValueAtTime(0.42, ctx.currentTime); // 42% feedback for organic echoing trails

            // Connect Echo loop
            delayNode.connect(delayFeedback);
            delayFeedback.connect(delayNode);

            // Route audio logic: All notes -> lowpass -> mainGain -> Output + Delay paths
            mainGain.connect(lowpass);
            lowpass.connect(ctx.destination); // Direct path to speakers

            // Send to delay block to generate the echoes
            lowpass.connect(delayNode);
            delayNode.connect(ctx.destination); // Echo path to speakers
            
            // Helper function to create gorgeous star chimes with quick attack & slow release
            const triggerStarChime = (frequency, delayTime, duration) => {
                const oscChime = ctx.createOscillator();
                const gainChime = ctx.createGain();
                
                // Triangle wave yields a bell-like, woodwind premium synthesizer tone
                oscChime.type = 'triangle';
                oscChime.frequency.setValueAtTime(frequency, ctx.currentTime + delayTime);
                
                // Custom starry vibrato slide
                oscChime.frequency.exponentialRampToValueAtTime(frequency * 1.004, ctx.currentTime + delayTime + duration);
                
                // Gorgeous fast attack and long soft release matching the echoing aesthetic
                gainChime.gain.setValueAtTime(0, ctx.currentTime + delayTime);
                gainChime.gain.linearRampToValueAtTime(0.22, ctx.currentTime + delayTime + 0.04);
                gainChime.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delayTime + duration);
                
                oscChime.connect(gainChime);
                gainChime.connect(mainGain);
                
                oscChime.start(ctx.currentTime + delayTime);
                oscChime.stop(ctx.currentTime + delayTime + duration + 0.1);
            };

            // Deep cosmic background pad to glue everything together
            const padOsc = ctx.createOscillator();
            const padGain = ctx.createGain();
            padOsc.type = 'sine';
            padOsc.frequency.setValueAtTime(130.81, ctx.currentTime); // Root C3
            padOsc.frequency.linearRampToValueAtTime(196.00, ctx.currentTime + 1.2); // Smoothly glides up to G3 (Perfect Fifth)
            
            padGain.gain.setValueAtTime(0, ctx.currentTime);
            padGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.4); // Slow swelling attack
            padGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.8); // Matches the whole transition overlay duration
            
            padOsc.connect(padGain);
            padGain.connect(mainGain);
            padOsc.start(ctx.currentTime);
            padOsc.stop(ctx.currentTime + 2.9);

            // Execute the high starry melody arpeggio sequence (Ascending pentatonic notes)
            triggerStarChime(523.25,  0.00, 1.4); // C5 - Clear spark
            triggerStarChime(659.25,  0.14, 1.4); // E5 - Warm tone
            triggerStarChime(783.99,  0.28, 1.5); // G5 - Harmonic fifth
            triggerStarChime(1046.50, 0.42, 1.6); // C6 - Peak celestial chime
            triggerStarChime(1318.51, 0.56, 1.8); // E6 - Lingering starry dust
        }
    } catch (soundErr) {
        console.warn("Audio feedback skipped:", soundErr);
    }

    if (welcomeOverlay && welcomeCard) {
        // Ultra-smooth, slow aesthetic sliding & fade out
        welcomeCard.style.transition = 'all 2800ms cubic-bezier(0.25, 1, 0.5, 1)';
        welcomeCard.style.transform = 'translateY(30px) scale(0.95)';
        welcomeCard.style.opacity = '0';
        welcomeCard.style.filter = 'blur(15px)';

        // Gracefully fade out the background overlay and slowly melt away the backdrop blur
        welcomeOverlay.style.transition = 'all 2800ms cubic-bezier(0.25, 1, 0.5, 1)';
        welcomeOverlay.style.opacity = '0';
        welcomeOverlay.style.backdropFilter = 'blur(0px)';
        welcomeOverlay.style.webkitBackdropFilter = 'blur(0px)';
        
        // Completely hide the component once this luxurious long animation finishes
        setTimeout(() => {
            welcomeOverlay.classList.add('hidden');
        }, 2850);
    }
}

// Database materi contoh premium terdistribusi per jenjang pendidikan
const contohMateriPerLevel = {
    sd: [
        { id: 'kupu_kupu', emoji: '🦋', label: 'Liputan Kupu-Kupu', text: 'Metamorfosis kupu-kupu dimulai dari telur yang menetas menjadi ulat atau larva. Ulat makan daun banyak-banyak sampai gendut, lalu diam menjadi kepompong yang keras (pupa). Di dalam kepompong, ulat berubah menjadi kupu-kupu yang cantik dan akhirnya terbang keluar mencari madu bunga.' },
        { id: 'hujan', emoji: '🌧️', label: 'Proses Hujan Rintik', text: 'Air laut, sungai, dan danau menguap ke udara karena panas matahari. Uap air yang naik ke langit berubah jadi awan kecil, makin lama awannya makin besar dan berat berisi air. Karena udaranya dingin, air di dalam awan jatuh kembali ke bumi sebagai rintik-rintik air hujan.' },
        { id: 'pelangi', emoji: '🌈', label: 'Asal-Usul Pelangi', text: 'Pelangi terbentuk ketika sinar matahari bersinar melewati tetesan air hujan di udara. Tetesan air hujan itu membelokkan cahaya matahari seperti prisma kaca, lalu menguraikannya menjadi warna-warni indah mulai dari merah, jingga, kuning, hijau, biru, nila, hingga ungu di langit.' }
    ],
    smp: [
        { id: 'pencernaan', emoji: '🍔', label: 'Sistem Pencernaan', text: 'Makanan masuk ke mulut dikunyah gigi dan dicampur air liur. Makanan melewati kerongkongan menuju lambung untuk dihancurkan asam klorida dan enzim pepsin. Di usus halus, sari-sari makanan diserap masuk ke darah. Di usus besar terjadi penyerapan air sisa makanan sebelum dikeluarkan.' },
        { id: 'newton', emoji: '⚛️', label: 'Hukum Newton II', text: 'Hukum II Newton menyatakan bahwa percepatan sebuah benda berbanding lurus dengan gaya total yang bekerja padanya dan berbanding terbalik dengan massanya. Arah percepatan tersebut sama dengan arah gaya total benda. Dituliskan dalam rumus matematis yaitu F = m * a, di mana F adalah gaya (Newton), m adalah massa benda (kg), dan a adalah percepatan (m/s²).' },
        { id: 'fotosintesis', emoji: '🍃', label: 'Proses Fotosintesis', text: 'Fotosintesis adalah proses tumbuhan hijau membuat makanan menggunakan energi cahaya matahari. Daun menyerap karbon dioksida dari udara dan air dari tanah. Klorofil menangkap cahaya matahari untuk mengubah air dan karbon dioksida menjadi glukosa (sumber energi tumbuhan) dan menghasilkan oksigen ke udara.' }
    ],
    'sma-smk': [
        { id: 'mitosis', emoji: '🧬', label: 'Proses Mitosis Sel', text: 'Pembelahan mitosis adalah proses pembelahan sel yang menghasilkan dua sel anakan yang identik secara genetik dengan sel induknya. Mitosis terdiri dari empat tahap utama: Profase (kromatin memadat menjadi kromosom), Metafase (kromosom berbaris di bidang ekuator), Anafase (kromatid saudara terpisah ke kutub berlawanan), dan Telofase (membran inti terbentuk kembali dan diikuti sitokinesis).' },
        { id: 'gunung', emoji: '🌋', label: 'Metode Gunung Berapi', text: 'Gunung berapi terbentuk dari aktivitas magmatik di dalam perut bumi akibat pergerakan lempeng tektonik. Ketika lempeng tektonik bertabrakan atau menjauh, celah terbentuk sehingga magma yang bersuhu sangat tinggi, cair, dan kaya gas naik ke permukaan bumi karena density yang lebih rendah dari batuan sekitarnya. Akumulasi muntahan lava dan tefra dari waktu ke waktu membentuk kerucut gunung berapi.' },
        { id: 'sel_volta', emoji: '🔋', label: 'Prinsip Sel Volta', text: 'Sel Volta adalah sel elektrokimia di mana reaksi redoks spontan digunakan untuk menghasilkan energi listrik. Sel ini terdiri dari dua setengah sel yang dihubungkan dengan jembatan garam. Anoda bermuatan negatif mengalami oksidasi melepas elektron ke sirkuit luar, sementara Katoda bermuatan positif menerima elektron mengalami reduksi.' }
    ],
    mahasiswa: [
        { id: 'relativitas', emoji: '🌌', label: 'Relativitas Einstein', text: 'Teori Relativitas Khusus Einstein didasarkan pada dua postulat: hukum-hukum fisika adalah sama di semua kerangka acuan inersia, dan laju cahaya di ruang hampa adalah konstan bagi semua pengamat terlepas dari gerak sumber cahaya. Implikasi teori ini meliputi dilasi waktu (waktu berjalan lebih lambat bagi pengamat yang bergerak cepat) dan kontraksi panjang.' },
        { id: 'dna', emoji: '🧬', label: 'Heliks Ganda DNA', text: 'Deoxyribonucleic acid (DNA) merupakan asam nukleat pembawa materi genetik berstruktur heliks ganda antiparalel. Struktur ini tersusun atas gugus fosfat, gula deoksiribosa, dan basa nitrogen yang berpasangan secara spesifik: adenin dengan timin (dua ikatan hidrogen), serta guanin dengan sitosin (tiga ikatan hidrogen), membentuk tangga spiral raksasa pembawa kode herediter.' },
        { id: 'makro', emoji: '📈', label: 'Ekonomi Makro', text: 'Ekonomi makro Keynesian mengusulkan bahwa output ekonomi sangat dipengaruhi oleh permintaan agregat, terutama selama masa resesi. Teori ini berargumen bahwa pasar bebas tidak memiliki mekanisme penyeimbang otomatis untuk mencapai kesempatan kerja penuh (full employment), sehingga intervensi pemerintah yang aktif melalui kebijakan fiskal ekspansif sangat diperlukan.' }
    ]
};

// Fungsi untuk me-refresh daftar saran contoh materi secara dinamis sesuai jenjang pendidikan
window.updateQuickExamples = function(level) {
    const container = document.getElementById('examples-container');
    if (!container) return;
    
    const items = contohMateriPerLevel[level] || contohMateriPerLevel['sd'];
    container.innerHTML = '';
    
    items.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bg-white/[0.02] hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/25 text-slate-300 hover:text-amber-300 text-[9px] xs:text-[10px] sm:text-xs font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl transition-warm cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap opacity-0';
        
        // Staggered animate using fadeInUp keyframe
        btn.style.animation = `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 60}ms forwards`;
        
        btn.onclick = () => {
            window.isiContohMateri(item.text);
        };
        
        btn.innerHTML = `<span>${item.emoji} ${item.label}</span>`;
        container.appendChild(btn);
    });
};

// =================================================================
// ENGINE VOICE NOTE (VN) REKAMAN SUARA & TRANSKRIPSI CERDAS
// =================================================================

window.toggleVoiceNoteRecording = function() {
    if (isRecordingVN) {
        window.stopVoiceNoteRecording(true);
    } else {
        window.startVoiceNoteRecording();
    }
};

window.startVoiceNoteRecording = async function() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast("Browser tidak mendukung akses mikrofon secara langsung.", "error");
        return;
    }

    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
        console.error("Microphone permission error:", err);
        showToast("Akses mikrofon tidak diizinkan. Mohon izinkan mikrofon untuk merekam VN.", "error");
        return;
    }

    try {
        audioChunks = [];
        transcribedVNText = "";
        vnRecordingSeconds = 0;

        // Tentukan format rekaman yang didukung browser
        let options = {};
        if (typeof MediaRecorder !== 'undefined') {
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = { mimeType: 'audio/webm;codecs=opus' };
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/webm' };
            } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                options = { mimeType: 'audio/ogg;codecs=opus' };
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options = { mimeType: 'audio/mp4' };
            }
        }

        mediaRecorder = new MediaRecorder(audioStream, options);

        mediaRecorder.ondataavailable = function(e) {
            if (e.data && e.data.size > 0) {
                audioChunks.push(e.data);
            }
        };

        mediaRecorder.onstop = async function() {
            if (audioChunks.length > 0) {
                const mime = mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunks, { type: mime });
                await handleRecordedAudioBlob(audioBlob, mime);
            }
        };

        // Jalankan Web Speech API secara paralel untuk transkripsi live instan Bahasa Indonesia
        try {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRec) {
                vnSpeechRecognition = new SpeechRec();
                vnSpeechRecognition.lang = 'id-ID';
                vnSpeechRecognition.continuous = true;
                vnSpeechRecognition.interimResults = true;
                
                vnSpeechRecognition.onresult = function(event) {
                    let currentTranscript = "";
                    for (let i = 0; i < event.results.length; ++i) {
                        currentTranscript += event.results[i][0].transcript;
                    }
                    transcribedVNText = currentTranscript;
                    const transcribeTextElem = document.getElementById('vn-transcribe-text');
                    if (transcribeTextElem && currentTranscript) {
                        transcribeTextElem.innerText = `"${currentTranscript.slice(0, 32)}..."`;
                    }
                };

                vnSpeechRecognition.onerror = function(ev) {
                    console.log("Speech recognition notice:", ev.error);
                };

                vnSpeechRecognition.start();
            }
        } catch (speechErr) {
            console.log("Web Speech API tidak aktif, mengandalkan Gemini AI:", speechErr);
        }

        mediaRecorder.start(250);
        isRecordingVN = true;

        // Tampilkan antarmuka rekaman aktif
        const recordingPanel = document.getElementById('vn-recording-panel');
        const previewContainer = document.getElementById('vn-preview-container');
        const vnBtnText = document.getElementById('vn-btn-text');
        const vnPing = document.getElementById('vn-ping');
        const timerElem = document.getElementById('vn-timer');

        if (recordingPanel) recordingPanel.classList.remove('hidden');
        if (previewContainer) previewContainer.classList.add('hidden');
        if (vnBtnText) vnBtnText.innerText = "Merekam...";
        if (vnPing) vnPing.classList.remove('hidden');
        if (timerElem) timerElem.innerText = "00:00";

        clearInterval(vnTimerInterval);
        vnTimerInterval = setInterval(() => {
            vnRecordingSeconds++;
            const mins = Math.floor(vnRecordingSeconds / 60).toString().padStart(2, '0');
            const secs = (vnRecordingSeconds % 60).toString().padStart(2, '0');
            if (timerElem) timerElem.innerText = `${mins}:${secs}`;

            // Batas aman rekaman 5 menit
            if (vnRecordingSeconds >= 300) {
                window.stopVoiceNoteRecording(true);
            }
        }, 1000);

        showToast("Merekam Voice Note... Silakan bicarakan materi pelajaranmu!", "info");
    } catch (startErr) {
        console.error("Gagal memulai perekam audio:", startErr);
        showToast(`Gagal memulai rekaman: ${startErr.message}`, "error");
    }
};

window.stopVoiceNoteRecording = function(save = true) {
    if (!isRecordingVN) return;

    clearInterval(vnTimerInterval);

    if (vnSpeechRecognition) {
        try { vnSpeechRecognition.stop(); } catch (e) {}
    }

    if (!save) {
        isRecordingVN = false;
        audioChunks = [];
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        if (audioStream) {
            audioStream.getTracks().forEach(t => t.stop());
        }
        resetVNRecordingUI();
        showToast("Rekaman Voice Note dibatalkan.", "info");
        return;
    }

    isRecordingVN = false;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    if (audioStream) {
        audioStream.getTracks().forEach(t => t.stop());
    }

    resetVNRecordingUI();
};

window.cancelVoiceNoteRecording = function() {
    window.stopVoiceNoteRecording(false);
};

function resetVNRecordingUI() {
    isRecordingVN = false;
    const recordingPanel = document.getElementById('vn-recording-panel');
    const vnBtnText = document.getElementById('vn-btn-text');
    const vnPing = document.getElementById('vn-ping');

    if (recordingPanel) recordingPanel.classList.add('hidden');
    if (vnBtnText) vnBtnText.innerText = "Rekam VN";
    if (vnPing) vnPing.classList.add('hidden');
}

async function handleRecordedAudioBlob(blob, mime) {
    if (!blob || blob.size === 0) {
        showToast("Rekaman suara terlalu singkat atau kosong.", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(evt) {
        const base64Data = evt.target.result.split(',')[1];
        uploadedAudioBase64 = base64Data;
        uploadedAudioMimeType = mime;

        setupVoiceNoteFromBlobOrBase64(evt.target.result, blob.size, "Rekaman VN Anda", mime);
        
        const textInput = document.getElementById('text-input');
        if (transcribedVNText && transcribedVNText.trim().length > 0) {
            if (textInput && textInput.value.trim() === '') {
                textInput.value = transcribedVNText.trim();
                textInput.dispatchEvent(new Event('input'));
            }
            showToast("Voice Note berhasil direkam & ditranskripsikan!", "success");
        } else {
            // Lakukan transkripsi latar belakang via backend AI
            fetchServerAudioTranscription(base64Data, mime);
            showToast("Voice Note berhasil disimpan!", "success");
        }
    };
    reader.readAsDataURL(blob);
}

async function fetchServerAudioTranscription(audioBase64, mimeType) {
    const transcribeTextElem = document.getElementById('vn-transcribe-text');
    if (transcribeTextElem) transcribeTextElem.innerText = "Mentranskripsi teks...";

    try {
        const res = await fetch('/api/transcribe-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioData: audioBase64, mimeType: mimeType })
        });
        if (res.ok) {
            const data = await res.json();
            if (data.text && data.text.trim().length > 0) {
                transcribedVNText = data.text.trim();
                const textInput = document.getElementById('text-input');
                if (textInput && textInput.value.trim() === '') {
                    textInput.value = transcribedVNText;
                    textInput.dispatchEvent(new Event('input'));
                }
                if (transcribeTextElem) {
                    transcribeTextElem.innerText = `"${transcribedVNText.slice(0, 32)}..."`;
                }
            } else if (transcribeTextElem) {
                transcribeTextElem.innerText = "Audio siap dibedah AI";
            }
        }
    } catch (e) {
        if (transcribeTextElem) transcribeTextElem.innerText = "Audio siap dibedah AI";
    }
}

function setupVoiceNoteFromBlobOrBase64(audioSrc, sizeInBytes, title, mime) {
    if (vnAudioBlobUrl) {
        try { URL.revokeObjectURL(vnAudioBlobUrl); } catch (e) {}
    }
    vnAudioBlobUrl = audioSrc;

    if (vnAudioPlayer) {
        vnAudioPlayer.pause();
        vnAudioPlayer = null;
    }

    vnAudioPlayer = new Audio(audioSrc);
    isPlayingVN = false;

    const previewContainer = document.getElementById('vn-preview-container');
    const titleElem = document.getElementById('vn-player-title');
    const sizeElem = document.getElementById('vn-size-badge');
    const durationElem = document.getElementById('vn-duration-badge');
    const playIcon = document.getElementById('vn-play-icon');
    const progressBar = document.getElementById('vn-progress-bar');

    if (previewContainer) previewContainer.classList.remove('hidden');
    if (titleElem) titleElem.innerText = title || "Voice Note Siap Dibedah";
    if (sizeElem) {
        const kb = (sizeInBytes / 1024).toFixed(1);
        const mb = (sizeInBytes / (1024 * 1024)).toFixed(2);
        sizeElem.innerText = sizeInBytes > 1024 * 1024 ? `${mb} MB` : `${kb} KB`;
    }
    if (progressBar) progressBar.style.width = '0%';
    if (playIcon) playIcon.className = "fa-solid fa-play ml-0.5";

    vnAudioPlayer.onloadedmetadata = function() {
        if (durationElem && vnAudioPlayer.duration && !isNaN(vnAudioPlayer.duration)) {
            const mins = Math.floor(vnAudioPlayer.duration / 60);
            const secs = Math.floor(vnAudioPlayer.duration % 60).toString().padStart(2, '0');
            durationElem.innerText = `${mins}:${secs}`;
        }
    };

    vnAudioPlayer.ontimeupdate = function() {
        if (!vnAudioPlayer || isNaN(vnAudioPlayer.duration) || vnAudioPlayer.duration === 0) return;
        const pct = (vnAudioPlayer.currentTime / vnAudioPlayer.duration) * 100;
        if (progressBar) progressBar.style.width = `${pct}%`;
        
        if (durationElem) {
            const currentMins = Math.floor(vnAudioPlayer.currentTime / 60);
            const currentSecs = Math.floor(vnAudioPlayer.currentTime % 60).toString().padStart(2, '0');
            const totalMins = Math.floor(vnAudioPlayer.duration / 60);
            const totalSecs = Math.floor(vnAudioPlayer.duration % 60).toString().padStart(2, '0');
            durationElem.innerText = `${currentMins}:${currentSecs} / ${totalMins}:${totalSecs}`;
        }
    };

    vnAudioPlayer.onended = function() {
        isPlayingVN = false;
        if (playIcon) playIcon.className = "fa-solid fa-play ml-0.5";
        if (progressBar) progressBar.style.width = '0%';
        if (durationElem && vnAudioPlayer.duration) {
            const mins = Math.floor(vnAudioPlayer.duration / 60);
            const secs = Math.floor(vnAudioPlayer.duration % 60).toString().padStart(2, '0');
            durationElem.innerText = `${mins}:${secs}`;
        }
    };
}

window.togglePlayVoiceNote = function() {
    if (!vnAudioPlayer) return;
    const playIcon = document.getElementById('vn-play-icon');

    if (isPlayingVN) {
        vnAudioPlayer.pause();
        isPlayingVN = false;
        if (playIcon) playIcon.className = "fa-solid fa-play ml-0.5";
    } else {
        vnAudioPlayer.play().then(() => {
            isPlayingVN = true;
            if (playIcon) playIcon.className = "fa-solid fa-pause";
        }).catch(err => {
            console.error("Audio playback error:", err);
            showToast("Gagal memutar rekaman suara.", "error");
        });
    }
};

window.seekVoiceNote = function(event) {
    if (!vnAudioPlayer || !vnAudioPlayer.duration) return;
    const scrubber = event.currentTarget;
    const rect = scrubber.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    vnAudioPlayer.currentTime = pct * vnAudioPlayer.duration;
};

window.hapusVoiceNote = function() {
    if (vnAudioPlayer) {
        vnAudioPlayer.pause();
        vnAudioPlayer = null;
    }
    if (vnAudioBlobUrl) {
        try { URL.revokeObjectURL(vnAudioBlobUrl); } catch (e) {}
        vnAudioBlobUrl = null;
    }
    uploadedAudioBase64 = null;
    uploadedAudioMimeType = null;
    isPlayingVN = false;
    transcribedVNText = "";

    const previewContainer = document.getElementById('vn-preview-container');
    if (previewContainer) previewContainer.classList.add('hidden');
    showToast("Voice Note berhasil dihapus.", "info");
};

// Event Listener Utama untuk Form Submit Pencarian
function setupEventListeners() {
    document.getElementById('main-form').addEventListener('submit', async function(event) {
        event.preventDefault();
        await dekonstruksiMateri();
    });

    // Perata Live Character Counter & Show/Hide Clear button dynamically
    const textInput = document.getElementById('text-input');
    if (textInput) {
        const updateInputState = () => {
            const valLength = textInput.value.length;
            const counter = document.getElementById('char-counter');
            if (counter) {
                counter.innerText = `${valLength} Karakter`;
            }
            const clearBtn = document.getElementById('btn-clear-text');
            if (clearBtn) {
                if (valLength > 0) {
                    clearBtn.classList.remove('hidden', 'opacity-0');
                    clearBtn.classList.add('flex');
                } else {
                    clearBtn.classList.add('hidden', 'opacity-0');
                    clearBtn.classList.remove('flex');
                }
            }
        };

        textInput.addEventListener('input', updateInputState);
        textInput.addEventListener('change', updateInputState);
    }

    // Dynamic quick example list listeners
    const levelInputs = document.querySelectorAll('input[name="education-level"]');
    levelInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (input.checked) {
                window.updateQuickExamples(input.value);
            }
        });
    });

    // Robust Unified File Processor (Supports both file changes and Drag and Drop)
    function processUploadedFile(file) {
        if (!file) return;

        // Friendly size limit check (Hingga 15 MB)
        const max_size = 15 * 1024 * 1024; 
        if (file.size > max_size) {
            showToast("Ukuran file terlalu besar! Maksimal 15MB ya.", "error");
            return;
        }

        // Folder/Directory detection: standard directories often have size that is a multiple of 4096 (but not always)
        // or empty type and no simple extension. A cleaner way is capturing FileReader error or checking if type is empty and size is 0 or 4096.
        // We will also rely on reader.onerror.
        const fileName = file.name;
        const fileType = file.type || '';
        const fileNameLower = fileName.toLowerCase();
        uploadedFileName = fileName;

        const reader = new FileReader();
        
        reader.onerror = function() {
            showToast("Gagal membaca file. Jika berupa folder, silakan kompres atau unggah file di dalamnya secara individu.", "error");
        };

        const isImage = fileType.startsWith('image/') || 
                        fileNameLower.endsWith('.png') || 
                        fileNameLower.endsWith('.jpg') || 
                        fileNameLower.endsWith('.jpeg') || 
                        fileNameLower.endsWith('.gif') || 
                        fileNameLower.endsWith('.webp') || 
                        fileNameLower.endsWith('.svg');

        const isText = fileType === 'text/plain' || 
                       fileNameLower.endsWith('.txt') || 
                       fileNameLower.endsWith('.md');

        const isOfficeDoc = fileType === 'application/pdf' || 
                            fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                            fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
                            fileType === 'application/msword' || 
                            fileType === 'application/vnd.ms-powerpoint' || 
                            fileNameLower.endsWith('.pdf') || 
                            fileNameLower.endsWith('.docx') || 
                            fileNameLower.endsWith('.doc') || 
                            fileNameLower.endsWith('.pptx') || 
                            fileNameLower.endsWith('.ppt');

        const isAudio = fileType.startsWith('audio/') || 
                        fileNameLower.endsWith('.mp3') || 
                        fileNameLower.endsWith('.wav') || 
                        fileNameLower.endsWith('.ogg') || 
                        fileNameLower.endsWith('.m4a') || 
                        fileNameLower.endsWith('.webm') || 
                        fileNameLower.endsWith('.aac');

        const formatSize = (bytes) => {
            if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
            return `${(bytes / 1024).toFixed(1)} KB`;
        };

        if (isImage) {
            reader.onload = function(evt) {
                uploadedFileBase64 = evt.target.result.split(',')[1];
                let mime = fileType;
                if (!mime || mime === 'application/octet-stream') {
                    if (fileNameLower.endsWith('.png')) mime = 'image/png';
                    else if (fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg')) mime = 'image/jpeg';
                    else if (fileNameLower.endsWith('.webp')) mime = 'image/webp';
                    else if (fileNameLower.endsWith('.gif')) mime = 'image/gif';
                    else mime = 'image/jpeg';
                }
                uploadedFileMimeType = mime;
                uploadedFileName = fileName;
                uploadedFileType = 'image';
                uploadedImagePreviewUrl = evt.target.result;
                uploadedDocumentText = null;

                const previewContainer = document.getElementById('file-preview-container');
                const previewName = document.getElementById('file-preview-name');
                const previewSize = document.getElementById('file-preview-size');
                const previewIcon = document.getElementById('file-preview-icon');

                if (previewContainer && previewName && previewSize) {
                    previewName.innerText = fileName;
                    previewSize.innerText = `${formatSize(file.size)} (Foto Terlampir - Siap Dikirim Bersama Chat)`;
                    if (previewIcon) {
                        previewIcon.innerHTML = `<img src="${evt.target.result}" referrerPolicy="no-referrer" class="w-8 h-8 rounded-lg object-cover border border-amber-500/40 shadow">`;
                    }
                    previewContainer.classList.remove('hidden');
                }
                
                const textInput = document.getElementById('text-input');
                if (textInput) {
                    textInput.placeholder = `Foto "${fileName}" terlampir! Ketik pertanyaan/soalmu atau klik 'Bedah Materi Sekarang'...`;
                }

                showToast(`Foto ${fileName} berhasil dilampirkan!`, "success");
            };
            reader.readAsDataURL(file);
        }
        else if (isText) {
            reader.onload = function(evt) {
                const textContent = evt.target.result;
                uploadedDocumentText = textContent;
                uploadedFileName = fileName;
                uploadedFileType = 'document';
                uploadedFileBase64 = null;
                uploadedFileMimeType = 'text/plain';

                const previewContainer = document.getElementById('file-preview-container');
                const previewName = document.getElementById('file-preview-name');
                const previewSize = document.getElementById('file-preview-size');
                const previewIcon = document.getElementById('file-preview-icon');

                if (previewContainer && previewName && previewSize) {
                    previewName.innerText = fileName;
                    previewSize.innerText = `${formatSize(file.size)} (Dokumen Teks Siap Dibedah)`;
                    if (previewIcon) {
                        previewIcon.innerHTML = `<i class="fa-solid fa-file-lines text-amber-400 text-lg"></i>`;
                    }
                    previewContainer.classList.remove('hidden');
                }

                const textInput = document.getElementById('text-input');
                if (textInput) {
                    textInput.placeholder = `Berkas "${fileName}" terlampir! Tulis pertanyaanmu atau langsung klik 'Bedah Materi'...`;
                }

                showToast(`File teks ${fileName} berhasil dilampirkan!`, "success");
            };
            reader.readAsText(file);
        }
        else if (isAudio) {
            showToast(`Membuka file audio ${fileName}...`, "info");
            reader.onload = async function(evt) {
                const base64Content = evt.target.result.split(',')[1];
                let mime = fileType || 'audio/mp3';
                if (!mime || mime === 'application/octet-stream') {
                    if (fileNameLower.endsWith('.mp3')) mime = 'audio/mp3';
                    else if (fileNameLower.endsWith('.wav')) mime = 'audio/wav';
                    else if (fileNameLower.endsWith('.ogg')) mime = 'audio/ogg';
                    else if (fileNameLower.endsWith('.m4a')) mime = 'audio/m4a';
                    else if (fileNameLower.endsWith('.webm')) mime = 'audio/webm';
                }
                uploadedAudioBase64 = base64Content;
                uploadedAudioMimeType = mime;
                uploadedFileName = fileName;
                uploadedFileType = 'audio';

                setupVoiceNoteFromBlobOrBase64(evt.target.result, file.size, fileName, mime);
                fetchServerAudioTranscription(base64Content, mime);

                const textInput = document.getElementById('text-input');
                if (textInput) {
                    textInput.placeholder = `Audio "${fileName}" terlampir! Ketik pertanyaanmu atau langsung klik 'Bedah Materi'...`;
                }

                showToast(`File audio ${fileName} (hingga 15MB) berhasil dimuat!`, "success");
            };
            reader.readAsDataURL(file);
        }
        else if (isOfficeDoc) {
            showToast("Membuka & mengekstrak isi dokumen... Mohon tunggu", "info");
            
            const previewContainer = document.getElementById('file-preview-container');
            const previewName = document.getElementById('file-preview-name');
            const previewSize = document.getElementById('file-preview-size');
            const previewIcon = document.getElementById('file-preview-icon');

            if (previewContainer && previewName && previewSize) {
                previewName.innerText = fileName;
                previewSize.innerText = "Sedang mengekstrak isi dokumen...";
                if (previewIcon) {
                    previewIcon.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin text-amber-400 text-lg"></i>`;
                }
                previewContainer.classList.remove('hidden');
            }

            reader.onload = async function(evt) {
                try {
                    const base64Content = evt.target.result.split(',')[1];
                    let processedMime = fileType;
                    if (!processedMime) {
                        if (fileNameLower.endsWith('.pdf')) processedMime = 'application/pdf';
                        else if (fileNameLower.endsWith('.docx')) processedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                        else if (fileNameLower.endsWith('.pptx')) processedMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                        else processedMime = 'application/octet-stream';
                    }
                    
                    const parseRes = await fetch('/api/parse-document', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            base64Data: base64Content,
                            mimeType: processedMime,
                            filename: fileName
                        })
                    });

                    if (!parseRes.ok) {
                        const errData = await parseRes.json();
                        throw new Error(errData.error || "Gagal memproses file dokumen");
                    }

                    const parseResult = await parseRes.json();
                    const extractedText = parseResult.text;

                    uploadedDocumentText = extractedText;
                    uploadedDocumentName = fileName;
                    uploadedDocumentMime = processedMime;
                    uploadedFileBase64 = base64Content;
                    uploadedFileMimeType = processedMime;
                    uploadedFileName = fileName;
                    uploadedFileType = 'document';

                    const textInput = document.getElementById('text-input');
                    if (textInput) {
                        textInput.placeholder = `Berkas "${fileName}" terlampir (${extractedText.length} karakter)! Ketik pertanyaanmu atau langsung klik 'Bedah Materi'...`;
                    }

                    if (previewContainer && previewSize && previewIcon) {
                        previewSize.innerText = `${formatSize(file.size)} (Berkas Terlampir - Teks Siap Dianalisis)`;
                        
                        let iconHtml = '<i class="fa-solid fa-file-invoice text-amber-400 text-lg"></i>';
                        if (fileNameLower.endsWith('.pdf')) {
                            iconHtml = '<i class="fa-solid fa-file-pdf text-rose-500 text-lg"></i>';
                        } else if (fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc')) {
                            iconHtml = '<i class="fa-solid fa-file-word text-blue-500 text-lg"></i>';
                        } else if (fileNameLower.endsWith('.pptx') || fileNameLower.endsWith('.ppt')) {
                            iconHtml = '<i class="fa-solid fa-file-powerpoint text-orange-500 text-lg"></i>';
                        }
                        previewIcon.innerHTML = iconHtml;
                    }

                    showToast(`Dokumen ${fileName} berhasil dilampirkan & disinkronkan!`, "success");
                } catch (err) {
                    console.error(err);
                    showToast(`Gagal memuat dokumen: ${err.message}`, "error");
                    if (previewContainer) {
                        previewContainer.classList.add('hidden');
                    }
                }
            };
            reader.readAsDataURL(file);
        } else {
            showToast("Format tidak didukung. Silakan gunakan Dokumen (PDF, Word, PPT), Teks (.txt), Gambar (.jpg, .png), atau Audio (.mp3, .wav) hingga 15MB.", "error");
        }
    }

    // File Uploader handling logic
    const fileUploader = document.getElementById('file-uploader');
    if (fileUploader) {
        fileUploader.addEventListener('change', function(e) {
            const file = e.target.files[0];
            processUploadedFile(file);
            fileUploader.value = '';
        });
    }

    // Drag-and-drop event listener on input area for ultimate user convenience
    if (textInput) {
        ['dragenter', 'dragover'].forEach(eventName => {
            textInput.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                textInput.classList.add('border-indigo-500/80', 'ring-4', 'ring-indigo-500/15', 'bg-slate-900/80');
            }, false);
        });

        ['dragleave', 'dragend'].forEach(eventName => {
            textInput.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                textInput.classList.remove('border-indigo-500/80', 'ring-4', 'ring-indigo-500/15', 'bg-slate-900/80');
            }, false);
        });

        textInput.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            textInput.classList.remove('border-indigo-500/80', 'ring-4', 'ring-indigo-500/15', 'bg-slate-900/80');

            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                
                // Catch folder dropping: directories usually have no type & either size 0/4096 or cannot be loaded
                // Checking for type === '' and (size === 0 || size % 4096 === 0) handles most folders
                if (file.type === "" && (file.size === 0 || file.size % 4096 === 0)) {
                    showToast("Folder tidak bisa diunggah secara langsung. Silakan buka folder tersebut dan seret/unggah file di dalamnya.", "error");
                } else {
                    processUploadedFile(file);
                }
            }
        }, false);
    }

    // Register hapus file handler on window
    window.hapusFileUnggahan = function() {
        uploadedFileBase64 = null;
        uploadedFileMimeType = null;
        uploadedFileName = null;
        uploadedFileType = null;
        uploadedDocumentText = null;
        uploadedImagePreviewUrl = null;
        const previewContainer = document.getElementById('file-preview-container');
        if (previewContainer) {
            previewContainer.classList.add('hidden');
        }
        const uploaderInput = document.getElementById('file-uploader');
        if (uploaderInput) {
            uploaderInput.value = '';
        }
        const textInput = document.getElementById('text-input');
        if (textInput) {
            textInput.placeholder = "Contoh: Salin paragraf buku paket tentang metamorfosis amfibi, cara kerja mesin bubut, atau teori ekonomi yang membingungkan...";
        }
        showToast("Lampiran berkas berhasil dihapus.", "info");
    };

    // Populate initial examples on load matching selected level
    const checkedInput = document.querySelector('input[name="education-level"]:checked');
    if (checkedInput) {
        window.updateQuickExamples(checkedInput.value);
    } else {
        window.updateQuickExamples('sd');
    }
}

// Fungsi untuk mempopulerkan kolom input dengan template contoh materi pelajaran yang siap diuji
window.isiContohMateri = function(tipeAtauText) {
    const textInput = document.getElementById('text-input');
    if (!textInput) return;
    
    let text = "";
    if (tipeAtauText === 'newton') {
        text = "Hukum II Newton menyatakan bahwa percepatan sebuah benda berbanding lurus dengan gaya total yang bekerja padanya dan berbanding terbalik dengan massanya. Arah percepatan tersebut sama dengan arah gaya total benda. Dituliskan dalam rumus matematis yaitu F = m * a, di mana F adalah gaya (Newton), m adalah massa benda (kg), dan a adalah percepatan (m/s²).";
    } else if (tipeAtauText === 'mitosis') {
        text = "Pembelahan mitosis adalah proses pembelahan sel yang menghasilkan dua sel anakan yang identik secara genetik dengan sel induknya. Mitosis terdiri dari empat tahap utama: Profase (kromatin memadat menjadi kromosom), Metafase (kromosom berbaris di bidang ekuator), Anafase (kromatid saudara terpisah ke kutub berlawanan), dan Telofase (membran inti terbentuk kembali dan diikuti sitokinesis).";
    } else if (tipeAtauText === 'gunung') {
        text = "Gunung berapi terbentuk dari aktivitas magmatik di dalam perut bumi akibat pergerakan lempeng tektonik. Ketika lempeng tektonik bertabrakan atau menjauh, celah terbentuk sehingga magma yang bersuhu sangat tinggi, cair, dan kaya gas naik ke permukaan bumi karena density yang lebih rendah dari batuan sekitarnya. Akumulasi muntahan lava dan tefra dari waktu ke waktu membentuk kerucut gunung berapi.";
    } else {
        // Mendukung penulisan mentah / raw text langsung secara instan dari dynamic pills
        text = tipeAtauText;
    }
    
    textInput.value = text;
    
    // Trigger State Sync
    const valLength = text.length;
    const counter = document.getElementById('char-counter');
    if (counter) {
        counter.innerText = `${valLength} Karakter`;
    }
    
    const clearBtn = document.getElementById('btn-clear-text');
    if (clearBtn) {
        if (valLength > 0) {
            clearBtn.classList.remove('hidden', 'opacity-0');
            clearBtn.classList.add('flex');
        } else {
            clearBtn.classList.add('hidden', 'opacity-0');
            clearBtn.classList.remove('flex');
        }
    }
    
    // Berikan efek highlight/glow lembut pada textarea agar pengguna tahu teks masuk
    textInput.focus();
    textInput.style.transform = 'scale(1.005)';
    textInput.classList.add('ring-2', 'ring-amber-500/30', 'border-amber-500/40');
    setTimeout(() => {
        textInput.style.transform = '';
        textInput.classList.remove('ring-2', 'ring-amber-500/30', 'border-amber-500/40');
    }, 450);
}

// Fungsi untuk mengosongkan kolom input secara instan dengan transisi halus
window.bersihkanInputMateri = function() {
    const textInput = document.getElementById('text-input');
    if (textInput) {
        textInput.value = "";
        textInput.focus();
    }
    const counter = document.getElementById('char-counter');
    if (counter) {
        counter.innerText = "0 Karakter";
    }
    const clearBtn = document.getElementById('btn-clear-text');
    if (clearBtn) {
        clearBtn.classList.add('hidden', 'opacity-0');
        clearBtn.classList.remove('flex');
    }
}

// Fungsi Sliding Panel untuk Membuka / Menutup Sidebar History
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebarHistory');
    sidebar.classList.toggle('-translate-x-full');
}

// FUNGSI CHAT BARU (BUAT LAYOUT KEMBALI SEPERTI AWAL & BERSIHKAN PANEL)
window.mulaiChatBaru = function() {
    const textInput = document.getElementById('text-input');
    if (textInput) {
        textInput.value = "";
    }
    const counter = document.getElementById('char-counter');
    if (counter) {
        counter.innerText = "0 Karakter";
    }
    currentMateri = "";
    currentHistoryIndex = -1;

    // Bersihkan file unggahan jika ada
    if (typeof window.hapusFileUnggahan === 'function') {
        window.hapusFileUnggahan();
    }
    // Bersihkan Voice Note jika ada
    if (typeof window.hapusVoiceNote === 'function') {
        window.hapusVoiceNote();
    }

    // Sembunyikan Hasil Terjemahan
    const resultSection = document.getElementById('result-section');
    if (resultSection) {
        resultSection.classList.add('hidden');
        resultSection.style.removeProperty('display');
    }

    // Tampilkan Kembali Menu Form Input Jenjang & Kolom Teks
    const inputContainer = document.getElementById('input-container');
    if (inputContainer) {
        inputContainer.classList.remove('hidden');
        inputContainer.style.removeProperty('display');
    }

    const eduSection = document.getElementById('education-level-section');
    if (eduSection) {
        eduSection.classList.remove('hidden');
        eduSection.style.removeProperty('display');
    }

    // Set level default ke SD
    const firstRadio = document.querySelector('input[name="education-level"][value="sd"]');
    if (firstRadio) {
        firstRadio.checked = true;
    }
    window.updateQuickExamples('sd');

    showToast("Memulai sesi obrolan baru!", "success");

    // Otomatis tutup sidebar panel agar pembaca fokus penuh
    const sidebar = document.getElementById('sidebarHistory');
    if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.add('-translate-x-full');
    }
}

// FUNGSI EDIT / KEMBALI KE FORM MATERIAL INPUT
window.kembaliKeInput = function() {
    const resultSection = document.getElementById('result-section');
    if (resultSection) {
        resultSection.classList.add('hidden');
        resultSection.style.removeProperty('display');
    }

    const inputContainer = document.getElementById('input-container');
    if (inputContainer) {
        inputContainer.classList.remove('hidden');
        inputContainer.style.removeProperty('display');
    }

    const eduSection = document.getElementById('education-level-section');
    if (eduSection) {
        eduSection.classList.remove('hidden');
        eduSection.style.removeProperty('display');
    }

    showToast("Mengedit teks materi...", "info");
}

// Custom Toast Notification System Bawaan Lu yang Mewah
function showToast(message, type = "info") {
    const toast = document.getElementById('custom-toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastMessage || !toastIcon) return;

    toastMessage.innerText = message;
    
    if (type === "success") {
        toast.style.borderColor = "rgba(16, 185, 129, 0.3)";
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-500 text-lg"></i>';
    } else if (type === "error") {
        toast.style.borderColor = "rgba(239, 68, 68, 0.3)";
        toastIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-rose-500 text-lg"></i>';
    } else {
        toast.style.borderColor = "rgba(245, 158, 11, 0.3)";
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-info text-amber-500 text-lg"></i>';
    }

    toast.style.transform = "translateY(0px)";
    toast.style.opacity = "1";

    setTimeout(() => {
        toast.style.transform = "translateY(-120px)";
        toast.style.opacity = "0";
    }, 3500);
}

// Custom Markdown Parser Bawaan Lu agar Text Bintang-bintang Jadi Bold Cantik
function parseSimpleMarkdown(text) {
    if (!text) return "";
    let parsed = text;

    // Helper to clean mathematical formulas (LaTeX)
    const cleanFormula = (formula) => {
        let clean = formula;
        
        // Remove \text{...} and \mathrm{...}
        while (clean.includes('\\text{') || clean.includes('\\mathrm{')) {
            let prev = clean;
            clean = clean.replace(/\\text\{(.*?)\}/g, '$1');
            clean = clean.replace(/\\mathrm\{(.*?)\}/g, '$1');
            if (prev === clean) break;
        }

        clean = clean.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
        clean = clean.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
        clean = clean.replace(/\\left\\\{/g, '{').replace(/\\right\\\}/g, '}');
        
        // Clean fractions
        while (clean.includes('\\frac')) {
            let prev = clean;
            clean = clean.replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '($1 / $2)');
            if (prev === clean) break;
        }

        // Clean square roots
        while (clean.includes('\\sqrt')) {
            let prev = clean;
            clean = clean.replace(/\\sqrt\{(.*?)\}/g, '√($1)');
            clean = clean.replace(/\\sqrt([a-zA-Z0-9])/g, '√$1');
            if (prev === clean) break;
        }

        // Standard operators
        clean = clean.replace(/\\times/g, ' × ');
        clean = clean.replace(/\\cdot/g, ' · ');
        clean = clean.replace(/\\div/g, ' ÷ ');
        clean = clean.replace(/\\pm/g, ' ± ');
        clean = clean.replace(/\\approx/g, ' ≈ ');
        clean = clean.replace(/\\neq/g, ' ≠ ');
        clean = clean.replace(/\\le/g, ' ≤ ').replace(/\\leq/g, ' ≤ ');
        clean = clean.replace(/\\ge/g, ' ≥ ').replace(/\\geq/g, ' ≥ ');
        clean = clean.replace(/\\infty/g, ' ∞ ');

        // Superscript ^{...} or ^2
        while (clean.match(/\^\{(.*?)\}/)) {
            let prev = clean;
            clean = clean.replace(/\^\{(.*?)\}/g, '<sup>$1</sup>');
            if (prev === clean) break;
        }
        clean = clean.replace(/\^([0-9a-zA-Z+-]+)/g, '<sup>$1</sup>');

        // Subscript _{...} or _1
        while (clean.match(/_\{(.*?)\}/)) {
            let prev = clean;
            clean = clean.replace(/_\{(.*?)\}/g, '<sub>$1</sub>');
            if (prev === clean) break;
        }
        clean = clean.replace(/_([0-9a-zA-Z+-]+)/g, '<sub>$1</sub>');

        // Greek letters
        clean = clean.replace(/\\alpha/g, 'α');
        clean = clean.replace(/\\beta/g, 'β');
        clean = clean.replace(/\\gamma/g, 'γ');
        clean = clean.replace(/\\delta/g, 'δ');
        clean = clean.replace(/\\theta/g, 'θ');
        clean = clean.replace(/\\lambda/g, 'λ');
        clean = clean.replace(/\\mu/g, 'μ');
        clean = clean.replace(/\\pi/g, 'π');
        clean = clean.replace(/\\sigma/g, 'σ');
        clean = clean.replace(/\\phi/g, 'φ');
        clean = clean.replace(/\\omega/g, 'ω');
        clean = clean.replace(/\\Delta/g, 'Δ');
        clean = clean.replace(/\\Sigma/g, 'Σ');

        // General remaining backslashes
        clean = clean.replace(/\\/g, '');

        return clean.trim();
    };

    // 1. Bersihkan rumus matematika LaTeX agar cantik dan terbaca di web browser
    // Ganti $$ ... $$ dengan box mewah bertema sains/glassmorphism
    parsed = parsed.replace(/\$\$(.*?)\$\$/gs, (match, formula) => {
        let clean = cleanFormula(formula);
        return `<div class="bg-slate-950/65 border border-amber-500/20 px-4 py-3 rounded-xl font-mono text-center text-amber-400 text-xs sm:text-sm my-3 shadow-inner overflow-x-auto select-all">${clean}</div>`;
    });

    // Jalankan pembersihan untuk inline math $ ... $
    parsed = parsed.replace(/\$(.*?)\$/g, (match, formula) => {
        let clean = cleanFormula(formula);
        return `<code class="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono text-amber-300 text-xs">${clean}</code>`;
    });

    // 2. Headings (Hashes #)
    // #### (text)
    parsed = parsed.replace(/^####\s+(.*?)$/gm, '<h4 class="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-indigo-300 mt-5 mb-2 hover:text-indigo-200 transition-warm flex items-center gap-1.5"><i class="fa-solid fa-star text-amber-400 text-[10px]"></i> $1</h4>');
    // ### (text)
    parsed = parsed.replace(/^###\s+(.*?)$/gm, '<h3 class="text-sm sm:text-base font-extrabold text-amber-400 mt-6 mb-2.5 flex items-center gap-2"><i class="fa-solid fa-chevron-right text-indigo-400 text-[11px]"></i> $1</h3>');
    // ## (text)
    parsed = parsed.replace(/^##\s+(.*?)$/gm, '<h2 class="text-base sm:text-lg font-extrabold text-white mt-7 mb-3 border-b border-white/5 pb-1 flex items-center gap-2"><i class="fa-solid fa-compass text-amber-400"></i> $1</h2>');
    // # (text)
    parsed = parsed.replace(/^#\s+(.*?)$/gm, '<h1 class="text-lg sm:text-xl font-extrabold text-white mt-8 mb-4 border-b-2 border-amber-500/30 pb-2 bg-gradient-to-r from-amber-500/20 to-transparent p-2 rounded-r-lg">$1</h1>');

    // 3. Bold & Italic (bintang-bintang)
    parsed = parsed.replace(/\*\*(.*?)\*\//g, '<strong class="text-amber-400 font-bold">$1</strong>');
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-400 font-bold">$1</strong>');
    
    // 4. Bullet lists
    parsed = parsed.replace(/^\s*[-*]\s+(.*?)$/gm, '<li class="ml-5 list-disc text-slate-300 my-1.5">$1</li>');

    // 5. Linebreaks
    parsed = parsed.replace(/\n/g, "<br>");

    return parsed;
}

// Fetch Engine Pintar (Menghubungi Server-side Gemini API dengan Fallback Mulus ke Mode Cepat)
async function fetchGeminiWithRetry(systemPrompt, userQuery, image = null, audio = null) {
    const url = `/api/gemini`; 
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt, userQuery, image, audio })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.fallback) {
                return null;
            }
            if (result.text) {
                return result.text;
            }
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            }
        }
    } catch (e) {
        // Fallback otomatis jika koneksi jaringan atau server terkendala
    }
    return null;
}

// Alur Fungsi Utama saat Tombol "Bedah Materi Sekarang" Di-submit
async function dekonstruksiMateri() {
    const textInput = document.getElementById('text-input');
    const btnSubmit = document.getElementById('btn-submit');
    const resultSection = document.getElementById('result-section');
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const displayResult = document.getElementById('display-result');
    const resultMetaLevel = document.getElementById('result-meta-level');

    const userTypedText = (textInput ? textInput.value : '').trim();
    const selectedLevel = document.querySelector('input[name="education-level"]:checked')?.value;

    if (!selectedLevel) {
        showToast("Pilih jenjang pendidikan kalian dulu ya!", "error");
        return;
    }

    const hasImage = Boolean(uploadedFileBase64 && (uploadedFileType === 'image' || (!uploadedFileType && uploadedFileMimeType && uploadedFileMimeType.startsWith('image/'))));
    const hasDoc = Boolean(uploadedDocumentText || (uploadedFileBase64 && uploadedFileType === 'document'));
    const hasAudio = Boolean(uploadedAudioBase64);
    const hasText = Boolean(userTypedText);

    if (!hasText && !hasImage && !hasDoc && !hasAudio) {
        showToast("Tulis materi/pertanyaan, lampirkan foto/dokumen, atau rekam Voice Note dulu ya!", "error");
        return;
    }

    // Persiapkan imageObj & audioObj dan salin data sebelum state dibersihkan
    let imageObj = null;
    let audioObj = null;
    let attachedBadgeHtml = "";
    let finalUserQuery = "";

    // 1. Lampiran FOTO / GAMBAR (.jpg, .jpeg, .png, .webp, .gif)
    if (hasImage) {
        imageObj = {
            mimeType: uploadedFileMimeType || 'image/jpeg',
            data: uploadedFileBase64
        };
        const fileNameDisp = uploadedFileName || 'Foto Materi';
        const imgPreview = uploadedImagePreviewUrl || `data:${imageObj.mimeType};base64,${imageObj.data}`;

        attachedBadgeHtml = `
            <div class="mb-4 p-3 sm:p-3.5 bg-white/[0.03] border border-amber-500/30 rounded-2xl flex items-center gap-3 shadow-md animate-fade-in">
                <img src="${imgPreview}" referrerPolicy="no-referrer" class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-amber-500/40 shadow shrink-0">
                <div class="min-w-0 flex-1">
                    <span class="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <i class="fa-solid fa-camera"></i> Foto / Gambar Terlampir
                    </span>
                    <span class="text-xs sm:text-sm font-bold text-white block truncate mt-0.5">${fileNameDisp}</span>
                    <p class="text-[11px] text-slate-300 italic truncate mt-0.5">${userTypedText ? '"' + userTypedText + '"' : 'Menganalisis isi foto materi'}</p>
                </div>
            </div>
        `;

        if (userTypedText) {
            finalUserQuery = `[Pertanyaan / Perintah Pengguna Mengenai Foto Terlampir]:\n${userTypedText}\n\nTolong amati dan periksa foto materi yang saya lampirkan dengan seksama. Bedah konsep, teks, rumus, atau soal yang ada di foto tersebut, lalu jelaskan dan berikan jawaban secara tuntas!`;
        } else {
            finalUserQuery = "Tolong periksa dan analisis foto materi pelajaran terlampir dengan sangat teliti. Jelaskan konsep, teks, rumus, diagram, atau soal yang ada di dalamnya secara menyeluruh dan mudah dipahami!";
        }
    }
    // 2. Lampiran BERKAS DOKUMEN (PDF, Word .docx, PPT .pptx, Teks .txt)
    else if (hasDoc) {
        const docNameDisp = uploadedDocumentName || uploadedFileName || 'Dokumen Pelajaran';
        const docText = uploadedDocumentText || "";

        attachedBadgeHtml = `
            <div class="mb-4 p-3 sm:p-3.5 bg-white/[0.03] border border-indigo-500/30 rounded-2xl flex items-center gap-3 shadow-md animate-fade-in">
                <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg sm:text-xl shrink-0">
                    <i class="fa-solid fa-file-lines"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <span class="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <i class="fa-solid fa-paperclip"></i> Dokumen / Berkas Terlampir
                    </span>
                    <span class="text-xs sm:text-sm font-bold text-white block truncate mt-0.5">${docNameDisp}</span>
                    <p class="text-[11px] text-slate-300 italic truncate mt-0.5">${userTypedText ? '"' + userTypedText + '"' : 'Menganalisis intisari seluruh isi berkas'}</p>
                </div>
            </div>
        `;

        if (userTypedText) {
            finalUserQuery = `[Pertanyaan / Perintah Pengguna Mengenai Berkas "${docNameDisp}"]:\n${userTypedText}\n\n[Isi Teks Berkas Dokumen]:\n${docText}`;
        } else {
            finalUserQuery = `Tolong bedah dan jelaskan materi utama dari berkas dokumen "${docNameDisp}" berikut ini secara terstruktur, jelas, dan asyik:\n\n${docText}`;
        }
    }
    // 3. Lampiran REKAMAN SUARA / VOICE NOTE (VN)
    else if (hasAudio) {
        audioObj = {
            mimeType: uploadedAudioMimeType || 'audio/webm',
            data: uploadedAudioBase64
        };
        const audioNameDisp = uploadedFileName || 'Voice Note Suara';

        attachedBadgeHtml = `
            <div class="mb-4 p-3 sm:p-3.5 bg-white/[0.03] border border-rose-500/30 rounded-2xl flex items-center gap-3 shadow-md animate-fade-in">
                <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 text-lg sm:text-xl shrink-0">
                    <i class="fa-solid fa-microphone-lines"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <span class="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <i class="fa-solid fa-waveform-lines"></i> Rekaman Voice Note (VN)
                    </span>
                    <span class="text-xs sm:text-sm font-bold text-white block truncate mt-0.5">${audioNameDisp}</span>
                    <p class="text-[11px] text-slate-300 italic truncate mt-0.5">${userTypedText ? '"' + userTypedText + '"' : (transcribedVNText ? `"${transcribedVNText}"` : 'Mendengarkan rekaman suara')}</p>
                </div>
            </div>
        `;

        if (userTypedText) {
            finalUserQuery = `[Catatan / Pertanyaan Pengguna]:\n${userTypedText}\n\nTolong dengarkan rekaman audio yang saya sertakan dengan seksama dan bedah materinya sesuai catatan pertanyaan di atas!`;
        } else {
            finalUserQuery = "Tolong dengarkan pesan suara (Voice Note) ini dengan seksama dan bedah materi yang disampaikan secara komprehensif!";
        }
    }
    // 4. Input Teks Murni
    else {
        finalUserQuery = userTypedText;
    }

    currentMateri = finalUserQuery;
    currentHistoryIndex = -1;
    saveToHistory(userTypedText || (uploadedFileName ? `Berkas: ${uploadedFileName}` : finalUserQuery));

    // Reset input teks dan file setelah data tersimpan
    if (textInput) {
        textInput.value = '';
        textInput.placeholder = "Contoh: Salin paragraf buku paket tentang metamorfosis amfibi, cara kerja mesin bubut, atau teori ekonomi yang membingungkan...";
        textInput.dispatchEvent(new Event('input'));
    }

    uploadedFileBase64 = null;
    uploadedFileMimeType = null;
    uploadedFileName = null;
    uploadedFileType = null;
    uploadedDocumentText = null;
    uploadedImagePreviewUrl = null;

    const previewContainer = document.getElementById('file-preview-container');
    if (previewContainer) {
        previewContainer.classList.add('hidden');
    }
    const uploaderInput = document.getElementById('file-uploader');
    if (uploaderInput) {
        uploaderInput.value = '';
    }

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span>Membongkar Otak AI...</span> <i class="fa-solid fa-brain animate-bounce"></i>`;
    
    displayResult.innerHTML = ""; 
    resultSection.classList.remove('hidden');
    resultSection.style.setProperty('display', 'block', 'important');
    loadingSkeleton.classList.remove('hidden'); 

    document.getElementById('quickRefineContainer').classList.add('hidden');
    document.getElementById('roadmapOptionBox').classList.add('hidden');

    const levelNames = {
        "sd": "Anak Sekolah Dasar (SD)",
        "smp": "Pelajar Sekolah Menengah Pertama (SMP)",
        "sma-smk": "Pelajar SMA / SMK (Cheat Sheet)",
        "mahasiswa": "Analisis Berbobot Tingkat Mahasiswa"
    };
    resultMetaLevel.innerText = `Level Penjelasan: ${levelNames[selectedLevel]}`;
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

    let systemPrompt = `Kamu adalah Gotcha.ai, asisten edukasi pintar yang mampu mendekonstruksi materi apapun menjadi penjelasan yang sangat asyik, runtut, dan mudah dipahami.
Tingkat pemahaman target: ${levelNames[selectedLevel]}.
`;

    if (selectedLevel === "sd") {
        systemPrompt += "Gunakan gaya bahasa anak SD (umur 7-10 tahun): gunakan analogi cerita seru, kartun, atau benda nyata di sekitar kita. Gunakan bahasa yang ramah, asyik, ceria, dan hindari istilah ilmiah yang rumit.";
    } else if (selectedLevel === "smp") {
        systemPrompt += "Gunakan gaya bahasa anak SMP: bahasa yang jelas, mudah dipahami, fokus pada poin-poin esensial, definisi dasar yang kuat, serta contoh nyata yang relevan.";
    } else if (selectedLevel === "sma-smk") {
        systemPrompt += "Gunakan gaya bahasa anak SMA/SMK (Cheat Sheet): ringkasan taktik belajar yang praktis, rumus kilat jika ada, langkah-langkah kerja aplikatif, dan logika dasarnya agar cepat paham dan siap ujian.";
    } else if (selectedLevel === "mahasiswa") {
        systemPrompt += "Gunakan gaya bahasa tingkat Mahasiswa: analisis kritis, bedah metodologinya, korelasi teoritisnya, dan sajikan poin pertanyaan tajam yang mendalam.";
    }

    systemPrompt += `

PANDUAN KHUSUS BERKAS / FOTO:
1. Jika pengguna melampirkan FOTO atau BERKAS, amati dan periksa SELURUH isi konten (gambar, teks, rumus, grafik, soal) secara teliti.
2. Jawab pertanyaan pengguna terkait foto/berkas tersebut secara tuntas.
3. Di baris paling awal jawabanmu, WAJIB tampilkan 3 baris list materi dasar bertuliskan judul 'Prasyarat Belajar / Roadmap Singkat' sebelum menjelaskan materi intinya.`;

    try {
        const eduSection = document.getElementById('education-level-section');
        if (eduSection) {
            eduSection.classList.add('hidden');
            eduSection.style.display = 'none';
        }

        const aiResult = await fetchGeminiWithRetry(systemPrompt, finalUserQuery, imageObj, audioObj);
        loadingSkeleton.classList.add('hidden');

        if (aiResult) {
            displayResult.innerHTML = attachedBadgeHtml + parseSimpleMarkdown(aiResult);
            showToast("Materi sukses didekonstruksi!", "success");
            
            document.getElementById('quickRefineContainer').classList.remove('hidden');
            document.getElementById('roadmapOptionBox').classList.remove('hidden');
        } else {
            // Jalankan local smart deconstructor secara instan & mulus
            const localResult = generateLocalMateriDeconstruction(finalUserQuery, selectedLevel);
            displayResult.innerHTML = attachedBadgeHtml + parseSimpleMarkdown(localResult);
            showToast("Materi sukses dirangkum!", "success");
            
            document.getElementById('quickRefineContainer').classList.remove('hidden');
            document.getElementById('roadmapOptionBox').classList.remove('hidden');
        }
    } catch (error) {
        const localResult = generateLocalMateriDeconstruction(finalUserQuery, selectedLevel);
        loadingSkeleton.classList.add('hidden');
        displayResult.innerHTML = attachedBadgeHtml + parseSimpleMarkdown(localResult);
        showToast("Materi sukses dirangkum!", "success");
        
        document.getElementById('quickRefineContainer').classList.remove('hidden');
        document.getElementById('roadmapOptionBox').classList.remove('hidden');
        
        const eduSection = document.getElementById('education-level-section');
        if (eduSection) {
            eduSection.classList.add('hidden');
            eduSection.style.display = 'none';
        }
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span>Bedah Materi Sekarang</span> <i class="fa-solid fa-wand-magic-sparkles text-xs sm:text-sm"></i>`;
    }
}

// FITUR QUICK REFINE MODE (MODIFIKASI INSTAN)
window.refineMateri = async function(mode) {
    const displayResult = document.getElementById('display-result');
    if (!currentMateri) return showToast("Belum ada materi untuk diubah!", "error");
    showToast(`Merombak penjelasan ke mode ${mode}...`, "info");
    
    let promptTambahan = "";
    if (mode === 'gampang') promptTambahan = `Jelaskan kembali materi "${currentMateri}" dengan kosakata yang SANGAT MUDAH dimengerti anak kecil.`;
    if (mode === 'singkat') promptTambahan = `Rangkum materi "${currentMateri}" secara SUPER SINGKAT, padat, langsung to the point berupa poin esensial saja.`;
    if (mode === 'analogi') promptTambahan = `Gubah materi "${currentMateri}" sepenuhnya menggunakan cerita analogi imajinatif atau perumpamaan konkret.`;
    if (mode === 'detail') promptTambahan = `Bedah materi "${currentMateri}" secara mendalam, rinci, lengkap dengan komponen teoritisnya secara detail.`;

    try {
        const aiResult = await fetchGeminiWithRetry("Kamu adalah asisten pengubah gaya bahasa.", promptTambahan);
        if (aiResult) {
            displayResult.innerHTML = parseSimpleMarkdown(aiResult);
            showToast("Sukses mengubah gaya materi!", "success");
            return;
        }
    } catch (e) {
        // Lanjut ke generator lokal
    }
    const localRefined = generateLocalRefine(currentMateri, mode);
    displayResult.innerHTML = parseSimpleMarkdown(localRefined);
    showToast("Berhasil disesuaikan via Mode Cepat!", "success");
}

// FITUR ROADMAP GENERATOR DETAIL MINGGUAN
window.mintaRoadmapDetail = async function() {
    const displayResult = document.getElementById('display-result');
    document.getElementById('roadmapOptionBox').classList.add('hidden');
    showToast("Meracik peta kurikulum roadmap belajarmu...", "info");
    
    try {
        const aiResult = await fetchGeminiWithRetry("Kamu adalah pakar penyusun roadmap belajar terstruktur.", `Buatkan susunan roadmap panduan belajar mingguan (Week 1 sampai Week 4) yang sangat jelas, terstruktur, dan gampang diikuti untuk menguasai materi: ${currentMateri}`);
        if (aiResult) {
            displayResult.innerHTML = parseSimpleMarkdown(aiResult);
            showToast("Roadmap sukses dibuat!", "success");
            return;
        }
    } catch (e) {
        // Lanjut ke generator lokal
    }
    const localRoadmap = generateLocalWeeklyRoadmap(currentMateri);
    displayResult.innerHTML = parseSimpleMarkdown(localRoadmap);
    showToast("Roadmap Belajar Lokal berhasil dirancang!", "success");
}

// FITUR ENGINE UJIAN 3 MENIT INTERAKTIF
window.mulaiUjian = async function() {
    if (!currentMateri) return showToast("Cari materi dulu baru bisa ujian!", "error");
    showToast("Gemini sedang memformulasikan soal ujian...", "info");

    const promptKuis = `Buatkan 5 soal kuis pilihan ganda mengenai materi "${currentMateri}". Anda WAJIB menjawab HANYA dengan format teks JSON murni mengikuti struktur persis seperti ini: {"questions": [{"q": "Teks pertanyaan?", "options": ["opsi 0", "opsi 1", "opsi 2", "opsi 3"], "answer": 0}]}. Isikan field 'answer' dengan angka indeks 0 sampai 3 yang menjadi jawaban benar. Jangan berikan teks pembuka atau penutup markdown!`;

    try {
        let resultsArray = [];
        try {
            const aiResult = await fetchGeminiWithRetry("Kamu adalah mesin pembuat kuis berformat JSON murni.", promptKuis);
            if (aiResult) {
                const cleanJson = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();
                resultsArray = JSON.parse(cleanJson).questions;
            } else {
                resultsArray = generateLocalQuiz(currentMateri);
                showToast("Ujian 3 Menit siap (Kemampuan Lokal)!", "success");
            }
        } catch (apiErr) {
            resultsArray = generateLocalQuiz(currentMateri);
            showToast("Ujian 3 Menit siap (Kemampuan Lokal)!", "success");
        }
        
        examQuestions = resultsArray;
        userAnswers = new Array(examQuestions.length).fill(null);
        examSeconds = 180; 
        
        // Reset tampilan modal ke kondisi aktif kuis
        const examTimerContainer = document.getElementById('examTimerContainer');
        if (examTimerContainer) examTimerContainer.classList.remove('hidden');
        
        const quizFooterActive = document.getElementById('quizFooterActive');
        if (quizFooterActive) quizFooterActive.classList.remove('hidden');
        
        const quizFooterResult = document.getElementById('quizFooterResult');
        if (quizFooterResult) quizFooterResult.classList.add('hidden');

        document.getElementById('examModal').classList.remove('hidden');

        // JALUR PENYELAMAT: Daftarkan fungsi penangkap klik kuis ke ranah Global Window
        window.simpanJawabanKuis = function(soalIdx, opsiIdx) {
            userAnswers[soalIdx] = opsiIdx;
            console.log(`Jawaban soal ke-${soalIdx + 1} terekam: opsi indeks ${opsiIdx}`);
        };
        
        let htmlContent = "";
        examQuestions.forEach((q, qIdx) => {
            htmlContent += `
                <div class="mb-4 bg-white/[0.02] p-4 rounded-xl border border-white/5 text-left space-y-2">
                    <p class="text-xs sm:text-sm font-bold text-white">${qIdx + 1}. ${q.q}</p>
                    <div class="flex flex-col gap-2 text-xs text-slate-300">
                        ${q.options.map((opt, oIdx) => `
                            <label class="flex items-center gap-2.5 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-warm border border-transparent hover:border-white/5">
                                <input type="radio" name="soal_${qIdx}" value="${oIdx}" onchange="window.simpanJawabanKuis(${qIdx}, ${oIdx})" class="accent-amber-400">
                                <span>${opt}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        document.getElementById('quizQuestionsContainer').innerHTML = htmlContent;

        clearInterval(examTimer);
        examTimer = setInterval(() => {
            examSeconds--;
            let m = Math.floor(examSeconds / 60);
            let s = examSeconds % 60;
            const timerDisplay = document.getElementById('examTimerDisplay');
            if (timerDisplay) {
                timerDisplay.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
            }
            
            if (examSeconds <= 0) {
                clearInterval(examTimer);
                selesaiUjian(); // Jika waktu habis, otomatis hitung jawaban seadanya
                showToast("Waktu kuis habis! Jawaban otomatis terkirim.", "info");
            }
        }, 1000);

    } catch (e) {
        showToast("Gagal merelasikan kuis, klik tombol ujian sekali lagi lee!", "error");
    }
}

// FUNGSI TUTUP/BATAL UJIAN (KEMBALI KE PENCARIAN)
window.tutupUjian = function() {
    clearInterval(examTimer);
    const examModal = document.getElementById('examModal');
    if (examModal) {
        examModal.classList.add('hidden');
    }
    // Sembunyikan/kembalikan tombol & info kuis
    const timerContainer = document.getElementById('examTimerContainer');
    if (timerContainer) timerContainer.classList.remove('hidden');
    
    const footerActive = document.getElementById('quizFooterActive');
    if (footerActive) footerActive.classList.remove('hidden');
    
    const footerResult = document.getElementById('quizFooterResult');
    if (footerResult) footerResult.classList.add('hidden');
}

// FUNGSI HITUNG SKOR KUIS (FIX ANTIPELURU SKOR 0 & KONDISI WAKTU HABIS)
window.selesaiUjian = function() {
    clearInterval(examTimer);
    let skor = 0;
    
    examQuestions.forEach((q, idx) => {
        // Deteksi kecocokan menggunakan konversi angka murni Number()
        if (userAnswers[idx] !== null && Number(userAnswers[idx]) == q.answer) { 
            skor += 20; // 1 soal betul = 20 poin
        } 
    });
    
    // Matikan timer dan ubah footer
    const timerContainer = document.getElementById('examTimerContainer');
    if (timerContainer) timerContainer.classList.add('hidden');
    
    const footerActive = document.getElementById('quizFooterActive');
    if (footerActive) footerActive.classList.add('hidden');
    
    const footerResult = document.getElementById('quizFooterResult');
    if (footerResult) footerResult.classList.remove('hidden');

    // Siapkan teks apresiasi
    let pesanApresiasi = "";
    if (skor === 100) {
        pesanApresiasi = "Luar biasa sempurna! Kamu telah menguasai materi ini sepenuhnya tanpa celah! 🏆🔥";
    } else if (skor >= 80) {
        pesanApresiasi = "Sangat bagus! Pemahamanmu sangat tajam dan melampaui rata-rata! 🌟🚀";
    } else if (skor >= 60) {
        pesanApresiasi = "Hebat! Kamu sudah memahami poin-poin utama materi dengan baik! 👍✨";
    } else {
        pesanApresiasi = "Ayo belajar lagi! Gotcha.ai siap membantumu membongkar ulang materi agar lebih mudah nempel di otak! 🎒🧒";
    }

    let reviewHtml = `
        <div class="text-center py-6 px-4 bg-gradient-to-b from-amber-500/10 to-transparent rounded-2xl border border-amber-500/20 mb-6 animate-fade-in">
            <div class="text-5xl mb-2">${skor >= 80 ? '🏆' : (skor >= 60 ? '🌟' : '🎒')}</div>
            <h4 class="text-xs sm:text-sm font-extrabold text-slate-400 uppercase tracking-widest">Hasil Evaluasi Belajar</h4>
            <div class="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 my-2">${skor} <span class="text-base sm:text-lg text-slate-500 font-normal">/ 100</span></div>
            <p class="text-xs sm:text-sm text-slate-200 font-bold max-w-sm mx-auto leading-relaxed">${pesanApresiasi}</p>
        </div>
        
        <div class="space-y-4 text-left">
            <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
                <i class="fa-solid fa-file-signature text-amber-500"></i> Review Soal & Jawaban:
            </h5>
    `;

    examQuestions.forEach((q, qIdx) => {
        const userAnsIdx = userAnswers[qIdx];
        const isCorrect = userAnsIdx !== null && Number(userAnsIdx) == q.answer;
        
        reviewHtml += `
            <div class="p-3.5 rounded-xl border ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'} space-y-2.5">
                <div class="flex items-start gap-2">
                    <span class="flex h-5 w-5 items-center justify-center rounded-full ${isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} text-[10px] font-bold flex-shrink-0 mt-0.5">
                        ${isCorrect ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-xmark"></i>'}
                    </span>
                    <p class="text-xs sm:text-sm font-bold text-white">${qIdx + 1}. ${q.q}</p>
                </div>
                <div class="space-y-1.5 pl-7">
                    ${q.options.map((opt, oIdx) => {
                        let optClass = "text-slate-400 border-white/5 bg-white/[0.01]";
                        let iconHtml = "";
                        
                        if (oIdx == q.answer) {
                            optClass = "text-emerald-300 border-emerald-500/35 bg-emerald-500/10 font-semibold";
                            iconHtml = '<i class="fa-solid fa-circle-check text-emerald-400 text-xs mr-1.5"></i>';
                        } else if (userAnsIdx !== null && oIdx == Number(userAnsIdx)) {
                            optClass = "text-rose-300 border-rose-500/35 bg-rose-500/10 font-semibold";
                            iconHtml = '<i class="fa-solid fa-circle-xmark text-rose-400 text-xs mr-1.5"></i>';
                        }
                        
                        return `
                            <div class="flex items-center text-xs p-2 rounded-lg border ${optClass}">
                                ${iconHtml}
                                <span>${opt}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    reviewHtml += `</div>`;
    document.getElementById('quizQuestionsContainer').innerHTML = reviewHtml;
    showToast(`Ujian Selesai! Skor kamu: ${skor}`, "success");
}

// FITUR ENGINE RIWAYAT (LOCAL STORAGE)
function saveToHistory(query) {
    let history = JSON.parse(localStorage.getItem('gotcha_history_v2')) || [];
    if (!history.includes(query)) {
        history.unshift(query);
        if (history.length > 10) history.pop(); 
        localStorage.setItem('gotcha_history_v2', JSON.stringify(history));
        initHistory();
    }
}

function initHistory() {
    let history = JSON.parse(localStorage.getItem('gotcha_history_v2')) || [];
    const container = document.getElementById('historyList');
    
    if (history.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-600 italic text-center mt-4">Belum ada riwayat.</p>`;
        return;
    }
    
    container.innerHTML = history.map((item, index) => `
        <div class="flex items-center justify-between gap-1 w-full bg-white/[0.02] hover:bg-amber-500/10 rounded-xl border border-white/5 px-3 py-2 text-slate-400 group transition-warm select-none">
            <button type="button" onclick="loadFromHistory('${item.replace(/'/g, "\\'")}')" 
                class="flex-1 text-left hover:text-amber-400 text-xs truncate cursor-pointer py-0.5">
                🔍 ${item}
            </button>
            <button type="button" onclick="window.deleteHistory(${index}, event)" 
                class="text-slate-600 hover:text-rose-400 transition-warm cursor-pointer p-0.5" title="Hapus Riwayat">
                <i class="fa-solid fa-xmark text-xs"></i>
            </button>
        </div>
    `).join('');
}

window.deleteHistory = function(index, event) {
    if (event) {
        event.stopPropagation();
    }
    let history = JSON.parse(localStorage.getItem('gotcha_history_v2')) || [];
    history.splice(index, 1);
    localStorage.setItem('gotcha_history_v2', JSON.stringify(history));
    initHistory();
    showToast("Riwayat pencarian dihapus!", "success");
}

window.loadFromHistory = function(query) {
    const textInput = document.getElementById('text-input');
    textInput.value = query;
    document.getElementById('char-counter').innerText = `${query.length} Karakter`;
    toggleSidebar(); 
    dekonstruksiMateri();
}

// FITUR PREMIUM COPY TO CLIPBOARD
document.getElementById('btn-copy').addEventListener('click', () => {
    const displayResult = document.getElementById('display-result');
    const btnCopy = document.getElementById('btn-copy');
    const rawText = displayResult.innerText;
    if (!rawText) return;

    const textareaDummy = document.createElement("textarea");
    textareaDummy.value = rawText;
    document.body.appendChild(textareaDummy);
    textareaDummy.select();
    document.execCommand("copy");
    document.body.removeChild(textareaDummy);

    const icon = btnCopy.querySelector('i');
    const textSpan = btnCopy.querySelector('span');
    
    icon.className = "fa-solid fa-circle-check text-emerald-400";
    textSpan.innerText = "Tersalin!";
    btnCopy.classList.add('border-emerald-500/30', 'bg-emerald-500/5');

    showToast("Hasil penjelasan berhasil disalin ke clipboard!", "success");

    setTimeout(() => {
        icon.className = "fa-regular fa-copy";
        textSpan.innerText = "Salin";
        btnCopy.classList.remove('border-emerald-500/30', 'bg-emerald-500/5');
    }, 2500);
});

// =================================================================
// SYSTEM NAVIGATION BUTTON CONTROLS (<- BACKGROUND SEBELUMNYA & DAN ->)
// =================================================================
let currentHistoryIndex = -1;

window.navBack = function() {
    let history = JSON.parse(localStorage.getItem('gotcha_history_v2')) || [];
    if (history.length === 0) {
        showToast("Belum ada riwayat aktivitas!", "info");
        return;
    }
    
    // Cari index dari query saat ini jika ada
    if (currentHistoryIndex === -1 && currentMateri) {
        currentHistoryIndex = history.indexOf(currentMateri);
    }
    
    // Jika masih tidak ditemukan, mulai dari index 0. Jika sudah di akhir riwayat, ingatkan user.
    if (currentHistoryIndex === -1) {
        currentHistoryIndex = 0;
    } else if (currentHistoryIndex < history.length - 1) {
        currentHistoryIndex++;
    } else {
        showToast("Sudah di batas riwayat paling awal!", "info");
        return;
    }
    
    const query = history[currentHistoryIndex];
    if (query) {
        loadHistorySilence(query);
        showToast("Memuat riwayat sebelumnya...", "info");
    }
}

window.navForward = function() {
    let history = JSON.parse(localStorage.getItem('gotcha_history_v2')) || [];
    if (history.length === 0) {
        showToast("Belum ada riwayat aktivitas!", "info");
        return;
    }
    
    // Cari index dari query saat ini jika ada
    if (currentHistoryIndex === -1 && currentMateri) {
        currentHistoryIndex = history.indexOf(currentMateri);
    }
    
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        const query = history[currentHistoryIndex];
        if (query) {
            loadHistorySilence(query);
            showToast("Memuat riwayat berikutnya...", "info");
        }
    } else {
        showToast("Sudah mencakup riwayat paling baru!", "info");
    }
}

function loadHistorySilence(query) {
    const textInput = document.getElementById('text-input');
    if (textInput) {
        textInput.value = query;
        document.getElementById('char-counter').innerText = `${query.length} Karakter`;
    }
    dekonstruksiMateriSilence();
}

async function dekonstruksiMateriSilence() {
    const textInput = document.getElementById('text-input');
    const btnSubmit = document.getElementById('btn-submit');
    const resultSection = document.getElementById('result-section');
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const displayResult = document.getElementById('display-result');
    const resultMetaLevel = document.getElementById('result-meta-level');

    const promptText = textInput.value.trim();
    const selectedLevel = document.querySelector('input[name="education-level"]:checked')?.value;

    if (!promptText || !selectedLevel) {
        showToast("Pilih level dan isi teks materinya dulu ya!", "error");
        return;
    }

    currentMateri = promptText;

    // Bersihkan kolom pencarian input teks agar tidak ada bekas chat pajang
    textInput.value = '';
    textInput.dispatchEvent(new Event('input'));

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span>Membongkar Otak AI...</span> <i class="fa-solid fa-brain animate-bounce"></i>`;
    
    displayResult.innerHTML = ""; 
    resultSection.classList.remove('hidden');
    resultSection.style.setProperty('display', 'block', 'important');
    loadingSkeleton.classList.remove('hidden'); 

    document.getElementById('quickRefineContainer').classList.add('hidden');
    document.getElementById('roadmapOptionBox').classList.add('hidden');

    const levelNames = {
        "sd": "Anak Sekolah Dasar (SD)",
        "smp": "Pelajar Sekolah Menengah Pertama (SMP)",
        "sma-smk": "Pelajar SMA / SMK (Cheat Sheet)",
        "mahasiswa": "Analisis Berbobot Tingkat Mahasiswa"
    };
    resultMetaLevel.innerText = `Level Penjelasan: ${levelNames[selectedLevel]}`;
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

    let systemPrompt = "";
    if (selectedLevel === "sd") {
        systemPrompt = "Ubah materi berikut menjadi penjelasan yang SANGAT MUDAH untuk anak SD umur 7-10 tahun. Gunakan analogi cerita seru atau benda konkrit di sekitar kita. Gunakan bahasa yang ramah, asyik, ceria, dan hindari istilah ilmiah yang rumit.";
    } else if (selectedLevel === "smp") {
        systemPrompt = "Ubah materi berikut menjadi penjelasan yang jelas dan mudah dipahami anak SMP. Fokus pada poin-poin esensial, definisi dasar yang kuat, serta contoh nyata yang relevan dengan pelajaran sekolah mereka.";
    } else if (selectedLevel === "sma-smk") {
        systemPrompt = "Ubah materi berikut menjadi ringkasan taktik belajar (Cheat Sheet) yang praktis buat anak SMA/SMK. Berikan rumus kilat jika ada, langkah-langkah kerja yang aplikatif, dan logika dasarnya agar gampang lulus ujian.";
    } else if (selectedLevel === "mahasiswa") {
        systemPrompt = "Ubah materi berikut menjadi Analisis Kritis berbobot untuk tingkat Mahasiswa Kuliah. Bedah metodologinya, korelasi teoritisnya, dan sajikan 3 poin pertanyaan tajam yang bisa dipakai sebagai bahan diskusi kritis di kelas.";
    }

    systemPrompt += " Di baris paling awal jawabanmu, WAJIB tampilkan 3 baris list materi dasar bertuliskan judul 'Prasyarat Belajar / Roadmap Singkat' sebelum menjelaskan materi intinya.";

    try {
        const eduSection = document.getElementById('education-level-section');
        if (eduSection) {
            eduSection.classList.add('hidden');
            eduSection.style.display = 'none';
        }

        const aiResult = await fetchGeminiWithRetry(systemPrompt, promptText);
        loadingSkeleton.classList.add('hidden');

        if (aiResult) {
            displayResult.innerHTML = parseSimpleMarkdown(aiResult);
            showToast("Materi sukses didekonstruksi!", "success");
            
            document.getElementById('quickRefineContainer').classList.remove('hidden');
            document.getElementById('roadmapOptionBox').classList.remove('hidden');
        } else {
            const localResult = generateLocalMateriDeconstruction(promptText, selectedLevel);
            displayResult.innerHTML = parseSimpleMarkdown(localResult);
            showToast("Materi sukses dirangkum!", "success");
            
            document.getElementById('quickRefineContainer').classList.remove('hidden');
            document.getElementById('roadmapOptionBox').classList.remove('hidden');
        }
    } catch (error) {
        const localResult = generateLocalMateriDeconstruction(promptText, selectedLevel);
        loadingSkeleton.classList.add('hidden');
        displayResult.innerHTML = parseSimpleMarkdown(localResult);
        showToast("Materi sukses dirangkum!", "success");
        
        document.getElementById('quickRefineContainer').classList.remove('hidden');
        document.getElementById('roadmapOptionBox').classList.remove('hidden');
        
        const eduSection = document.getElementById('education-level-section');
        if (eduSection) {
            eduSection.classList.add('hidden');
            eduSection.style.display = 'none';
        }
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span>Terjemahkan Materi Sekarang</span> <i class="fa-solid fa-wand-magic-sparkles text-xs sm:text-sm"></i>`;
    }
}

// =================================================================
// LOCAL SMART DECONSTRUCTOR FALLBACK SYSTEM (OFFLINE MODE)
// =================================================================
function generateLocalMateriDeconstruction(promptText, selectedLevel) {
    const cleanText = promptText.trim().replace(/[\r\n]+/g, " ");
    
    // Ambil judul pemicu belajar (ambil 3-6 kata pertama)
    let titleWords = promptText.trim().split(/\s+/).slice(0, 5);
    let title = titleWords.join(" ");
    if (title.length > 40) title = title.substring(0, 40) + "...";
    
    // Cari term-term penting
    let keywords = [];
    const possibleKeywords = promptText.toLowerCase().match(/[a-zA-Z]{4,}/g) || [];
    const stopWords = ["yang", "untuk", "dengan", "adalah", "dalam", "pada", "dari", "atau", "bisa", "akan", "kamu", "kita", "saya", "telah", "oleh", "secara", "karena", "sebagai", "bahwa", "adapun", "yaitu", "melalui", "maka"];
    for (let word of possibleKeywords) {
        if (!stopWords.includes(word) && !keywords.includes(word) && keywords.length < 5) {
            keywords.push(word);
        }
    }
    
    // Cek topik khusus untuk membuat roadmap yang mantap
    let roadmapData = [];
    const textLower = promptText.toLowerCase();
    
    if (textLower.includes("foto") || textLower.includes("tumbuh") || textLower.includes("daun")) {
        roadmapData = ["Proses Klorofil & Struktur Daun", "Reaksi Terang (Energi Matahari)", "Manfaat Glukosa & Oksigen Bagi Makhluk Hidup"];
    } else if (textLower.includes("gravitasi") || textLower.includes("gaya") || textLower.includes("fisika")) {
        roadmapData = ["Konsep Gaya & Massa di Alam Semesta", "Hukum Tarik Menarik Gravitasi Newton", "Hubungan Gravitasi dengan Orbit Planet & Satelit"];
    } else if (textLower.includes("sel") || textLower.includes("organel") || textLower.includes("tubuh")) {
        roadmapData = ["Struktur Dinding & Membran Sel", "Fungsi Mitokondria & Inti Sel (Nukleus)", "Siklus Pembelahan Sel"];
    } else if (textLower.includes("sejarah") || textLower.includes("perang") || textLower.includes("merdeka")) {
        roadmapData = ["Latar Belakang Konflik & Tokoh Kunci", "Kronologi Peristiwa Penting", "Dampak Sosial-Politik bagi Era Modern"];
    } else if (textLower.includes("matematika") || textLower.includes("itung") || textLower.includes("rumus") || textLower.includes("pecah")) {
        roadmapData = ["Aritmatika/Logika Dasar Variabel", "Langkah Penyelesaian Persamaan", "Penerapan Studi Kasus Soal"];
    } else if (textLower.includes("belajar") || textLower.includes("buku") || textLower.includes("makna") || textLower.includes("paham")) {
        roadmapData = ["Metode Membaca Aktif & Catatan Kecil", "Teknik Asosiasi Visual & Jembatan Keledai", "Review Berulang (Spaced Repetition)"];
    } else {
        const kw1 = keywords[0] ? keywords[0].toUpperCase() : "KONSEP DASAR";
        const kw2 = keywords[1] ? keywords[1].toUpperCase() : "STRUKTUR UTAMA";
        const kw3 = keywords[2] ? keywords[2].toUpperCase() : "APLIKASI PRAKTIS";
        roadmapData = [
            `Mengenal esensi fundamental dari ${kw1}`,
            `Memahami struktur pendukung dan cara kerja ${kw2}`,
            `Mengeksplorasi hubungan nyata tentang ${kw3} di kehidupan`
        ];
    }
    
    let result = "";
    
    // Wajib tampilkan 3 baris list materi dasar bertuliskan judul 'Prasyarat Belajar / Roadmap Singkat' di awal
    result += "### Prasyarat Belajar / Roadmap Singkat\n";
    result += `- **Langkah 1**: ${roadmapData[0]}\n`;
    result += `- **Langkah 2**: ${roadmapData[1]}\n`;
    result += `- **Langkah 3**: ${roadmapData[2]}\n\n`;
    result += "---\n\n";
    
    result += "> 🚀 *Berjalan dalam **Mode Cepat (Analisis Lokal Otomatis)**. Tanpa batasan kuota & 100% instan.*\n\n";

    if (selectedLevel === "sd") {
        result += `## 🌟 Eksplorasi Seru: ${title.toUpperCase()} 🌟\n\n`;
        result += `Halo Adik-Adik hebat! 👋 Dino si Dinosaurus Pintar disini siap nemenin kamu buat petualangan seru membedah pelajaran! Yuk kita bayangin bersama-sama!\n\n`;
        
        result += "### 🦒 Analogi Lucu & Seru\n";
        result += "Bayangkan materi ini seperti **pesta ulang tahun yang penuh balon warna-warni**! \n";
        result += `Ketika kita membicarakan **${keywords[0] || "materi ini"}**, itu mirip seperti balon utama yang paling besar. Supaya balon itu bisa terbang tinggi, ada gas balon dan tali kencang yang memegangnya (yaitu **${keywords[1] || "bagian pentingnya"}**).\n\n`;
        
        result += "### 💡 Penjelasan Ramah Anak\n";
        result += "- **Apa sih intinya?** Intinya adalah cara alam atau sekitar kita bekerja secara ajaib tapi nyata!\n";
        if (keywords[2]) {
            result += `- **Jangan lupa tentang ${keywords[2]}**: Bagian ini seperti bumbu rahasia di dalam es krim coklat kesukaanmu, bikin semuanya jadi menyatu manis!\n`;
        }
        result += "- **Mengapa ini penting?** Bikin kamu jadi anak paling cerdas di kelas yang tahu rahasia menarik ini terlebih dahulu! \n\n";
        
        result += "### 🎮 Mini Kuis Cepat (Ayo Tebak!)\n";
        result += `1. Apakah **${keywords[0] || "benda ini"}** bisa dilihat atau dirasakan sehari-hari? *(Jawabannya: Tentu saja bisa! Cobalah perhatikan sekelilingmu!)*\n`;
        result += `2. Coba tebak, apa yang terjadi jika tidak ada **${keywords[1] || "daya dukung ini"}**? *(Jawabannya: Wah, balon petualangan kita bisa kempes dong!)*\n`;
        
    } else if (selectedLevel === "smp") {
        result += `## 📚 Bedah Materi: ${title.toUpperCase()} (Tingkat SMP)\n\n`;
        result += "Selamat datang! Di tingkat Sekolah Menengah Pertama, mari kita pecah materi ini menjadi kerangka konsep yang padat, jelas, dan gampang masuk otak untuk persiapan ujian.\n\n";
        
        result += "### 🎯 Jembatan Keledai & Definisi Inti\n";
        result += `1. **Definisi Utama**: Konsep ini berputar pada tema utama **${keywords[0] || "esensi materi"}**, yaitu suatu proses terstruktur di mana fenomena ini terjadi.\n`;
        if (keywords[1]) {
            result += `2. **Aspek Pendukung (${keywords[1].toUpperCase()})**: Ini berperan sebagai motor penggerak atau fondasi utama agar sistem ini berjalan dengan stabil.\n`;
        }
        result += "\n";
        
        result += "### 📝 Rangkuman Poin Ujian (Sering Keluar!)\n";
        result += `- **Poin A**: Mengapa fenomena ini terjadi? Karena ada interaksi timbal balik di lingkungan sekitar.\n`;
        result += `- **Poin B**: Apa dampaknya jika proses ini macet? Keseimbangan sistem akan terganggu, mirip seperti rantai sepeda yang lepas.\n`;
        if (keywords[2]) {
            result += `- **Poin C**: Peran krusial dari **${keywords[2]}** yang selalu ditanyakan guru saat ulangan harian. Catat ini ya!\n`;
        }
        result += "\n";
        
        result += "### 🔍 Contoh Nyata Sekitar Kita\n";
        result += `Ketika kamu melihat kejadian sehari-hari, ingatlah bahwa konsep **${keywords[0] || "ini"}** sedang bekerja di depan matamu sendiri secara konkrit dan logis!\n`;
        
    } else if (selectedLevel === "sma-smk") {
        result += `## ⚡ CHEAT SHEET: ${title.toUpperCase()} (SMA/SMK Mode)\n\n`;
        result += "Butuh belajar kilat 5 menit sebelum bel masuk kelas berbunyi? Ini rangkuman taktik super ringkas bebas teori bertele-tele!\n\n";
        
        result += "### 📐 Logika Kerja & Skenario Cepat\n";
        result += "| Variabel / Istilah | Peran & Logika Praktis |\n";
        result += "| :--- | :--- |\n";
        result += `| **${(keywords[0] || "Konsep Utama").toUpperCase()}**| Inti masalah. Naik nilainya = sistem berjalan lebih cepat. |\n`;
        result += `| **${(keywords[1] || "Variabel Kedua").toUpperCase()}**| Katalisator. Berfungsi mempercepat reaksi tanpa mengubah hasil akhir. |\n`;
        if (keywords[2]) {
            result += `| **${keywords[2].toUpperCase()}** | Output krusial yang ditargetkan dalam soal-soal hitungan/logika. |\n`;
        }
        result += "\n";
        
        result += "### 🚀 Rumus Kilat & Langkah Solusi\n";
        result += "Jika kamu menghadapi soal analisis atau perhitungan tentang materi ini:\n";
        result += `1. **Langkah 1**: Cari tahu dulu apa nilai atau kondisi awal dari **${keywords[0] || "pemicu"}**.\n`;
        result += `2. **Langkah 2**: Hubungkan dengan hukum sebab-akibat dari ketersediaan komponen pendukung.\n`;
        result += "3. **Langkah 3 (Eksekusi)**: Ambil kesimpulan logis atau gunakan rumus eliminasi cepat pilihan ganda.\n\n";
        
        result += "### ⚠️ Jebakan Batman di Soal Ujian\n";
        result += "- *Hati-hati!* Soal sering menjebak dengan mengaburkan perbedaan mendasar antara istilah satu dengan istilah lainnya. Fokus saja pada kata kunci di atas!\n";
        
    } else if (selectedLevel === "mahasiswa") {
        result += `## 🎓 ANALISIS AKADEMIS: ${title.toUpperCase()} (Tingkat Kuliah)\n\n`;
        result += "Analisis tingkat tinggi ini membedah landasan epistemilogis, metodologis, serta diskursus kritis yang menyelubungi materi.\n\n";
        
        result += "### 🔬 Metodologi & Paradigma Teoritis\n";
        result += `Kajian terhadap **${keywords[0] || "subjek ini"}** tidak bisa dilepaskan dari pendekatan holistik. Berbagai literatur ilmiah menempatkan fenomena ini sebagai variabel independen yang memengaruhi dinamika struktural di sekitarnya. Terjadi dialektika konstan antara komponen primer dengan instrumen sekunder seperti **${keywords[1] || "aspek internal"}**.\n\n`;
        
        result += "### 📊 Analisis Kritik & Keterbatasan Sistem\n";
        result += "1. **Anomali Empiris**: Dalam banyak studi kasus nyata, model linier sering kali gagal memprediksi deviasi perilaku sistem karena faktor eksternal tak terduga.\n";
        result += "2. **Reduksionisme**: Terlalu fokus memisahkan bagian-bagian kecil berisiko membutakan kita dari gambaran ekosistem makro yang saling berinteraksi secara nonlinear.\n\n";
        
        result += "### 💬 3 Pertanyaan Tajam untuk Diskusi Kelas / Seminar\n";
        result += `1. Bagaimanakah implikasi jangka panjang jika asumsi dasar tentang **${keywords[0] || "paradigma ini"}** ternyata mengalami pergeseran paradigma (paradigm shift)?\n`;
        result += `2. Sejauh mana korelasi kuantitatif antara akselerasi **${keywords[1] || "faktor satu"}** dengan stabilitas variabel kontingensi lainnya?\n`;
        result += `3. Apakah ada ruang bagi teori alternatif untuk mendobrak konsensus ilmiah yang berlaku saat ini terkait topik tersebut?\n`;
    }
    
    result += "\n---\n";
    result += "### 📝 Kutipan Analisis Sumber Asli\n";
    result += `> *"..${cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText}.."*\n`;
    
    return result;
}

function generateLocalRefine(materi, mode) {
    let clean = materi.trim();
    let titleWords = clean.split(/\s+/).slice(0, 5);
    let title = titleWords.join(" ");
    
    let words = clean.match(/[a-zA-Z]{4,}/g) || [];
    let kw1 = words[0] || "materi";
    let kw2 = words[1] || "konsep";
    let kw3 = words[2] || "teori";

    let result = "";
    if (mode === 'gampang') {
        result += `### 🧸 Penjelasan Super Gampang: ${title}\n\n`;
        result += `Yuk dengerin penjelasan santai ini! Jadi, bayangkan **${kw1}** itu seperti mainan bongkar pasang kesayanganmu.\n\n`;
        result += `Mainan itu bisa berdiri kokoh karena ada penyangga kecil bernama **${kw2}** di bawahnya. Gampang banget kan? Intinya, ini semua cuma cara kerja sederhana supaya hal-hal di sekitar kita bisa berjalan lancar!\n\n`;
        result += `#### ✨ Hal Menarik:\n`;
        result += `- Tidak perlu dihafal pusing-pusing!\n- Cukup ingat kalau **${kw1}** itu asyik dan bermanfaat!`;
    } else if (mode === 'singkat') {
        result += `### ⚡ Rangkuman Singkat Padat: ${title}\n\n`;
        result += `1. **Definisi Kilat**: **${kw1}** adalah fenomena inti yang dibahas di materi ini.\n`;
        result += `2. **Aspek Kunci**: Melibatkan interaksi konkrit dengan **${kw2}**.\n`;
        result += `3. **Takeaway**: Tanpa **${kw3}**, proses pelengkapnya tidak dapat berjalan secara optimal.\n`;
        result += `4. **Kesimpulan**: Cukup kuasai 3 poin di atas untuk paham 90% materi!`;
    } else if (mode === 'analogi') {
        result += `### 🎭 Analogi Kreatif: ${title}\n\n`;
        result += `Mari kita ganti semua bahasa rumit ini dengan perumpamaan sederhana:\n\n`;
        result += `Bayangkan kita sedang berada di sebuah **restoran pizza yang sibuk** 🍕.\n`;
        result += `- **${kw1}** berperan sebagai chef utama yang membuat adonan dasar pizza.\n`;
        result += `- **${kw2}** adalah topping keju mozzarella melimpah yang memberi rasa lezat di atasnya.\n`;
        result += `- **${kw3}** merupakan oven panas yang mematangkan seluruh pizza dalam sekejap.\n\n`;
        result += `Tanpa salah satunya, pesta makan pizza kita tidak akan pernah lengkap! Begitulah cara kerja materi ini di kehidupan nyata secara asyik!`;
    } else if (mode === 'detail') {
        result += `### 📘 Bedah Detail Komprehensif: ${title}\n\n`;
        result += `Berikut adalah rincian fungsional dan struktural dari materi yang diajukan:\n\n`;
        result += `#### 1. Arsitektur Komponen\n`;
        result += `- **Primer (${kw1.toUpperCase()})**: Menjadi inisiator utama aksi dan reaksi dalam ekosistem sistem.\n`;
        result += `- **Sekunder (${kw2.toUpperCase()})**: Menyediakan antarmuka penunjang bagi stabilitas dinamis.\n`;
        result += `- **Tersier (${kw3.toUpperCase()})**: Pengontrol laju umpan balik.\n\n`;
        result += `#### 2. Mekanisme Kausalitas\n`;
        result += `Sistem beroperasi ketika ada stimulan eksternal yang memicu aktivitas pada komponen primer. Energi kemudian didistribusikan melalui media sekunder guna menghasilkan hasil akhir yang konkrit dan dapat diukur secara empiris.`;
    }
    return result;
}

function generateLocalWeeklyRoadmap(materi) {
    let clean = materi.trim();
    let titleWords = clean.split(/\s+/).slice(0, 5);
    let title = titleWords.join(" ");
    
    let words = clean.match(/[a-zA-Z]{4,}/g) || [];
    let kw1 = words[0] || "Topik Utama";
    let kw2 = words[1] || "Konsep Kunci";
    let kw3 = words[2] || "Aplikasi Praktis";

    let result = `### 📅 Kurikulum Belajar Mandiri 4 Minggu: ${title}\n\n`;
    result += `Sistem telah menyusun rencana belajar komprehensif bagi Anda untuk menguasai topik ini dalam 1 bulan tanpa rasa stres!\n\n`;
    
    result += `#### 🗓️ KELAS MINGGU KE-1: Fondasi Dasar & Terminologi\n`;
    result += `- **Fokus Belajar**: Pengenalan umum, sejarah perkembangan, dan memahami mengapa ilmu ini dipelajari.\n`;
    result += `- **Materi Spesifik**: Eksplorasi makna dasar dari **${kw1}**.\n`;
    result += `- **Tantangan Mingguan/Goal**: Buat mindmap 1 halaman berisi istilah-istilah sulit.\n\n`;

    result += `#### 🗓️ KELAS MINGGU KE-2: Struktur Pendukung & Cara Kerja\n`;
    result += `- **Fokus Belajar**: Menyelami mekanisme internal dan melihat bagaimana elemen-elemen bekerja sama.\n`;
    result += `- **Materi Spesifik**: Hubungan sebab-akibat dengan **${kw2}**.\n`;
    result += `- **Tantangan Mingguan/Goal**: Jelaskan ulang materi ini kepada teman atau tulis catatan kecil.\n\n`;

    result += `#### 🗓️ KELAS MINGGU KE-3: Studi Kasus & Latihan Praktis\n`;
    result += `- **Fokus Belajar**: Menghubungkan teori buku dengan contoh nyata dan pemecahan masalah.\n`;
    result += `- **Materi Spesifik**: Latihan pemecahan problem set mengenai **${kw3}**.\n`;
    result += `- **Tantangan Mingguan/Goal**: Selesaikan 5 latihan soal atau bedah 1 artikel berita terkait.\n\n`;

    result += `#### 🗓️ KELAS MINGGU KE-4: Evaluasi Mandiri & Ujian Komprehensif\n`;
    result += `- **Fokus Belajar**: Review seluruh kelemahan materi dan simulasi ujian.\n`;
    result += `- **Materi Spesifik**: Integrasi semua topik dari Minggu 1 sampai 3.\n`;
    result += `- **Tantangan Mingguan/Goal**: Uji pemahaman Anda dengan fitur Kuis 3 Menit di Gotcha.ai!\n\n`;

    result += `*💡 Tips Sukses: Belajarlah secara konsisten 15-20 menit setiap hari daripada sistem kebut semalam (SKS)! Anda pasti bisa!*`;
    return result;
}

function generateLocalQuiz(materi) {
    let clean = materi.trim();
    let words = clean.match(/[a-zA-Z]{4,}/g) || [];
    let kw1 = words[0] || "Materi Utama";
    let kw2 = words[1] || "Konsep Kunci";
    let kw3 = words[2] || "Aspek Pendukung";
    let kw4 = words[3] || "Langkah Praktis";
    let kw5 = words[4] || "Tujuan Pelajaran";

    return [
        {
            "q": `Berdasarkan rangkuman materi, apa peran utama dari konsep "${kw1}"?`,
            "options": [
                `Sebagai pilar utama penentu cara kerja sistem`,
                `Sebagai komponen cadangan yang opsional`,
                `Hanya sebagai hiasan teoritis saja`,
                `Tidak memiliki peran yang signifikan`
            ],
            "answer": 0
        },
        {
            "q": `Bagaimana korelasi antara "${kw1}" dengan aspek penunjangnya yaitu "${kw2}"?`,
            "options": [
                `Keduanya saling bermusuhan`,
                `Saling melengkapi satu sama lain agar sistem bekerja stabil`,
                `Tidak ada korelasi ilmiah sama sekali`,
                `Hanya berhubungan secara tidak langsung`
            ],
            "answer": 1
        },
        {
            "q": `Apa salah satu tantangan atau hambatan jika kita mengabaikan aspek "${kw3}"?`,
            "options": [
                `Sistem tidak akan terpengaruh sedikit pun`,
                `Penyelesaian pembelajaran akan menjadi lebih instan`,
                `Akan terjadi ketidakseimbangan atau kesalahan dalam pemahaman logis`,
                `Semua jawaban di atas salah`
            ],
            "answer": 2
        },
        {
            "q": `Di manakah kita paling sering melihat pengaplikasian "${kw4 || "proses ini"}" secara nyata?`,
            "options": [
                `Hanya ada di buku teks tanpa adanya wujud asli`,
                `Di kehidupan sehari-hari dan lingkungan sekitar kita belajar`,
                `Hanya di laboratorium tertutup tingkat tinggi`,
                `Hanya di dunia fiksi`
            ],
            "answer": 1
        },
        {
            "q": `Apa tujuan akhir yang ingin dicapai dari mempelajari bahasan "${kw5 || "ilmu ini"}"?`,
            "options": [
                `Meningkatkan pemahaman dasar, kemudahan analisis kritis, dan nilai ujian mendongkrak`,
                `Sekadar menghafal definisi tanpa mengerti maknanya`,
                `Untuk mempersulit diri sendiri`,
                `Mengurangi rasa ingin tahu`
            ],
            "answer": 0
        }
    ];
}
