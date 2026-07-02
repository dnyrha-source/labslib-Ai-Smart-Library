/**
 * gemini.service.js
 * Service untuk integrasi Gemini AI (@google/generative-ai)
 * Fitur: AI Search, Book Summary Generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { loggerService } from './logger.service';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Inisialisasi Gemini
let genAI = null;
let model = null;

const getModel = () => {
  if (!genAI) {
    if (!API_KEY) {
      throw new Error(
        'VITE_GEMINI_API_KEY tidak ditemukan di environment variables.'
      );
    }
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
  return model;
};

export const geminiService = {
  /**
   * Cari buku relevan dari daftar menggunakan Gemini AI
   * Gemini akan menerima query natural language + daftar buku, lalu mengembalikan
   * array biblio_id yang relevan beserta skor relevansi.
   *
   * @param {string} userQuery - Pertanyaan/kata kunci dari pengguna
   * @param {Array} books - Array buku dari Firestore/mock
   * @returns {Promise<{results: Array, explanation: string}>}
   */
  searchBooksWithAI: async (userQuery, books) => {
    const geminiModel = getModel();

    // Buat ringkasan buku yang ringkas untuk dikirim ke Gemini (hemat token)
    const booksSummary = books
      .map(
        (b) =>
          `ID: ${b.biblio_id} | Judul: ${b.title} | Penulis: ${b.author} | Subjek: ${Array.isArray(b.subject) ? b.subject.join(', ') : b.subject || ''} | Kategori: ${b.category}`
      )
      .join('\n');

    const prompt = `Kamu adalah asisten perpustakaan sekolah yang cerdas bernama LabsLib AI.

Tugasmu adalah mencocokkan pertanyaan/permintaan pengguna dengan daftar buku perpustakaan yang tersedia.

PERTANYAAN PENGGUNA:
"${userQuery}"

DAFTAR BUKU PERPUSTAKAAN:
${booksSummary}

INSTRUKSI:
1. Analisis pertanyaan pengguna dan temukan buku-buku yang paling relevan.
2. Kembalikan HANYA dalam format JSON berikut (tanpa markdown, tanpa penjelasan lain):
{
  "results": ["BUKU-001", "BUKU-005", "BUKU-009"],
  "explanation": "Saya menemukan X buku yang relevan dengan pertanyaan Anda tentang [topik]. Buku-buku ini membahas [penjelasan singkat].",
  "query_interpretation": "Kamu mencari informasi tentang [interpretasi topik]"
}

Catatan:
- Urutkan dari yang paling relevan.
- Jika tidak ada yang relevan, kembalikan "results": [] dengan penjelasan yang ramah.
- Maksimal 8 hasil.
- Penjelasan dalam Bahasa Indonesia yang ramah dan membantu.`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const rawText = result.response.text().trim();

      // Parse JSON dari respons Gemini
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Format respons Gemini tidak valid');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const { results: biblioIds, explanation, query_interpretation } = parsed;

      // Map kembali ke objek buku lengkap, pertahankan urutan relevansi
      const matchedBooks = (biblioIds || [])
        .map((id) => books.find((b) => b.biblio_id === id))
        .filter(Boolean);

      let finalExplanation = explanation;
      // Jika AI halusinasi ID atau tidak nemu
      if (matchedBooks.length === 0 && (biblioIds || []).length > 0) {
        finalExplanation = "Maaf, saya tidak dapat menemukan buku yang tepat untuk pertanyaan Anda di perpustakaan ini. (Catatan: Fitur pencarian ini tidak menyimpan riwayat percakapan sebelumnya).";
      } else if (matchedBooks.length === 0) {
        finalExplanation = explanation || "Tidak ada buku yang relevan dengan kata kunci Anda.";
      }

      return {
        results: matchedBooks,
        explanation: finalExplanation,
        queryInterpretation: query_interpretation || userQuery,
      };
    } catch (error) {
      console.error('Gemini AI Search error:', error);
      throw new Error(
        `Gemini AI tidak dapat memproses permintaan: ${error.message}`
      );
    }
  },

  /**
   * Generate ringkasan/ulasan buku berdasarkan metadata
   *
   * @param {Object} book - Objek buku lengkap
   * @returns {Promise<string>} - Teks ringkasan dari Gemini
   */
  generateBookSummary: async (book) => {
    const geminiModel = getModel();

    const prompt = `Kamu adalah asisten perpustakaan sekolah yang bernama LabsLib AI.

Berdasarkan metadata buku berikut, buatkan ringkasan yang informatif, menarik, dan bermanfaat untuk siswa/guru yang ingin memutuskan apakah buku ini sesuai dengan kebutuhan mereka.

METADATA BUKU:
- Judul: ${book.title}
- Penulis: ${book.author}
- Penerbit: ${book.publisher} (${book.year})
- Subjek/Topik: ${Array.isArray(book.subject) ? book.subject.join(', ') : book.subject || ''}
- Kategori: ${book.category}
- Deskripsi yang ada: ${book.description || 'Tidak tersedia'}

INSTRUKSI RINGKASAN:
Tulis ringkasan dalam Bahasa Indonesia (200-300 kata) yang mencakup:
1. **Gambaran Umum** — Apa isi utama buku ini?
2. **Untuk Siapa Buku Ini** — Cocok untuk tingkat/kebutuhan apa?
3. **Poin Penting** — 3-4 topik/konsep utama yang dibahas
4. **Nilai Tambah** — Mengapa buku ini layak dibaca?

Gunakan gaya bahasa yang menarik namun tetap informatif dan akademis. Formatkan dengan paragraf yang rapi.`;

    try {
      const result = await geminiModel.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('Gemini generateBookSummary error:', error);
      throw new Error(`Gagal menghasilkan ringkasan: ${error.message}`);
    }
  },

  /**
   * Dapatkan rekomendasi buku berdasarkan buku yang sedang dilihat
   *
   * @param {Object} currentBook - Buku yang sedang dilihat
   * @param {Array} allBooks - Semua buku tersedia
   * @returns {Promise<Array>} - Array buku yang direkomendasikan
   */
  getRelatedBooks: async (currentBook, allBooks) => {
    // PENGAMANAN KUOTA:
    // Tidak menggunakan Gemini AI untuk menghindari limit 20 RPD dari model 2.5-flash.
    // Menggunakan pencocokan subjek secara lokal yang jauh lebih cepat dan hemat kuota.
    try {
      const currentSubjects = Array.isArray(currentBook.subject) 
        ? currentBook.subject.map(s => s.toLowerCase()) 
        : [];
      
      const related = allBooks.filter(b => {
        if (b.biblio_id === currentBook.biblio_id) return false;
        
        const bSubjects = Array.isArray(b.subject) 
          ? b.subject.map(s => s.toLowerCase()) 
          : [];
          
        return currentSubjects.some(sub => bSubjects.some(bsub => bsub.includes(sub) || sub.includes(bsub)));
      });

      // Acak urutan rekomendasi dan ambil 3
      return related.sort(() => 0.5 - Math.random()).slice(0, 3);
    } catch (error) {
      console.error('getRelatedBooks error:', error);
      return [];
    }
  },

  /**
   * Memulai sesi chat interaktif dengan konteks asisten perpustakaan
   * 
   * @param {Array} history - Riwayat pesan sebelumnya (optional) [{role: 'user'|'model', parts: [{text: '...'}]}]
   * @returns {Object} - Objek chat session dari Gemini
   */
  startChatSession: (history = []) => {
    const geminiModel = getModel();
    
    // System instruction ditambahkan sebagai pesan pertama (jika history kosong)
    // Pada model terbaru, system instruction bisa di-set di inisialisasi model,
    // tapi untuk kompatibilitas kita gunakan prompt awalan jika perlu, atau cukup model.startChat
    
    return geminiModel.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });
  },

  /**
   * Mengirim pesan ke sesi chat yang aktif
   * 
   * @param {Object} chatSession - Instance chat dari startChatSession
   * @param {string} message - Pesan dari pengguna
   * @param {Array} booksCatalog - Opsional, daftar buku untuk disisipkan sebagai konteks
   * @returns {Promise<string>} - Balasan dari AI
   */
  sendMessageToChat: async (chatSession, message, booksCatalog = []) => {
    try {
      // Sisipkan konteks bahwa AI adalah asisten perpustakaan jika ini pesan pertama
      const isFirstMessage = (await chatSession.getHistory()).length === 0;
      let prompt = message;
      
      if (isFirstMessage) {
        let catalogContext = "";
        if (booksCatalog.length > 0) {
          const booksSummary = booksCatalog
            .map(b => `- Judul: ${b.title} | Penulis: ${b.author} | Kategori: ${b.category}`)
            .join('\n');
          catalogContext = `\n\nBerikut adalah katalog buku yang tersedia di perpustakaan saat ini:\n${booksSummary}\n\nGunakan daftar di atas untuk merekomendasikan atau menjawab ketersediaan buku. Jika buku tidak ada di daftar, katakan bahwa buku tersebut saat ini belum tersedia di perpustakaan.`;
        }

        prompt = `Instruksi sistem: Kamu adalah "LabsLib AI", asisten cerdas untuk Perpustakaan SMP & SMA Labschool. Tugasmu membantu siswa menemukan buku, memberikan ringkasan, dan menjawab pertanyaan akademik dengan ramah, suportif, dan edukatif. Gunakan bahasa Indonesia yang baik.${catalogContext}\n\nPertanyaan pengguna: ${message}`;
      }

      const result = await chatSession.sendMessage(prompt);
      const text = result.response.text();
      
      // --- LOGGING ---
      loggerService.logAIInteraction('chat', message, 'gemini');

      return text;
    } catch (error) {
      console.error('sendMessageToChat error:', error);
      throw new Error('Gagal mengirim pesan ke AI.');
    }
  },

  /**
   * Menghasilkan Research Brief untuk Guru berdasarkan topik
   * 
   * @param {string} topic - Topik penelitian atau materi ajar
   * @param {Array} allBooks - Semua buku di katalog
   * @returns {Promise<Object>} - Mengembalikan { reportMarkdown, recommendedBooks }
   */
  generateResearchBrief: async (topic, allBooks) => {
    const geminiModel = getModel();

    const booksSummary = allBooks
      .map(
        (b) =>
          `ID: ${b.biblio_id} | Judul: ${b.title} | Penulis: ${b.author} | Kategori: ${b.category}`
      )
      .join('\n');

    const prompt = `Kamu adalah Asisten Riset untuk Guru di Perpustakaan SMP & SMA Labschool.
Tugasmu adalah membuat **Research Brief** yang komprehensif berdasarkan topik yang diminta oleh guru.

Topik / Judul Materi: "${topic}"

Katalog Buku Tersedia:
${booksSummary}

Tugas:
1. Buat ringkasan / kerangka materi tentang topik tersebut (Gunakan format Markdown).
2. Temukan maksimal 4 buku dari "Katalog Buku Tersedia" yang paling relevan dengan topik tersebut.

Kembalikan HANYA JSON dengan struktur persis seperti ini (tanpa blok \`\`\`json):
{
  "report": "# Ringkasan Materi: [Judul]... (isi dalam format markdown, minimal 3 paragraf, bisa pakai list bullet/angka)",
  "recommended_ids": ["ID_BUKU_1", "ID_BUKU_2"]
}`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const rawText = result.response.text().trim();
      
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Format respons Gemini tidak valid');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      const recommendedBooks = (parsed.recommended_ids || [])
        .map((id) => allBooks.find((b) => b.biblio_id === id))
        .filter(Boolean);

      return {
        reportMarkdown: parsed.report || 'Gagal menghasilkan report.',
        recommendedBooks: recommendedBooks
      };
    } catch (error) {
      console.error('generateResearchBrief error:', error);
      throw new Error('Gemini AI gagal memproses Research Brief.');
    }
  },

  /**
   * Melakukan pencarian semantik (AI) untuk Karya Tulis Ilmiah
   * 
   * @param {string} userQuery - Pertanyaan natural dari pengguna
   * @param {Array} researchList - Daftar semua karya tulis dari mock/SLiMS
   * @returns {Promise<Object>} - Mengembalikan { results, explanation }
   */
  searchResearchWithAI: async (userQuery, researchList) => {
    const geminiModel = getModel();

    const researchSummary = researchList
      .map(
        (r) =>
          `ID: ${r.id} | Judul: ${r.title} | Penulis: ${r.author} | Kata Kunci: ${r.keywords.join(', ')}`
      )
      .join('\n');

    const prompt = `Kamu adalah Pustakawan AI pintar. Pengguna sedang mencari karya tulis ilmiah.
Berikut adalah daftar karya tulis yang tersedia:

${researchSummary}

Pertanyaan/Kueri Pengguna: "${userQuery}"

Tugas:
1. Analisis pertanyaan pengguna dan temukan karya tulis yang paling relevan.
2. Kembalikan HANYA dalam format JSON berikut (tanpa markdown blok):
{
  "results": ["KTI-001", "KTI-005"],
  "explanation": "Saya menemukan X karya tulis yang relevan dengan pertanyaan Anda..."
}

Catatan:
- Urutkan dari yang paling relevan.
- Jika tidak ada yang relevan, kembalikan "results": [] dengan penjelasan yang ramah.`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const rawText = result.response.text().trim();

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Format respons Gemini tidak valid');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const { results: docIds, explanation } = parsed;

      const matchedDocs = (docIds || [])
        .map((id) => researchList.find((r) => r.id === id))
        .filter(Boolean);

      let finalExplanation = explanation;
      if (matchedDocs.length === 0 && (docIds || []).length > 0) {
        finalExplanation = "Maaf, saya tidak dapat menemukan karya tulis yang tepat untuk pertanyaan Anda.";
      } else if (matchedDocs.length === 0) {
        finalExplanation = explanation || "Tidak ada karya tulis yang relevan dengan kueri Anda.";
      }

      return {
        results: matchedDocs,
        explanation: finalExplanation,
      };
    } catch (error) {
      console.error('Gemini AI Research Search error:', error);
      throw new Error(`Gemini AI tidak dapat memproses permintaan: ${error.message}`);
    }
  }
};
