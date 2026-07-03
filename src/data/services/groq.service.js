import Groq from 'groq-sdk';
import { loggerService } from './logger.service';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

let groqClient = null;

const getClient = () => {
  if (!groqClient) {
    if (!API_KEY) {
      throw new Error('VITE_GROQ_API_KEY tidak ditemukan di environment variables.');
    }
    groqClient = new Groq({ apiKey: API_KEY, dangerouslyAllowBrowser: true });
  }
  return groqClient;
};

// Model Llama 3.1 (8B) sangat cocok untuk parsing JSON dan pencarian cepat
const SEARCH_MODEL = 'llama-3.1-8b-instant';
// Model Llama 3.3 (70B) memiliki daya nalar lebih tinggi untuk chatting dan riset
const REASONING_MODEL = 'llama-3.3-70b-versatile';

export const groqService = {
  searchBooksWithAI: async (userQuery, books) => {
    const groq = getClient();
    
    // PRE-FILTERING LOKAL (Pseudo-RAG) - Stop Words & Sistem Skor
    const stopWords = ['saya', 'aku', 'mencari', 'cari', 'buku', 'tentang', 'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'untuk', 'dengan', 'ada', 'apakah', 'ingin', 'mengetahui', 'tolong', 'carikan', 'informasi', 'apa', 'saja', 'yg', 'membahas', 'mengenai', 'berkaitan', 'berisi', 'menjelaskan', 'adalah', 'yaitu', 'merupakan', 'seputar', 'hal', 'dalam', 'pada', 'bagi', 'oleh', 'sebuah', 'suatu', 'beberapa', 'macam', 'jenis', 'seperti', 'serta', 'atau', 'tetapi', 'namun', 'karena', 'sebab', 'sehingga', 'maka', 'jadi', 'buat', 'bikin', 'kasih', 'beri', 'tahu', 'lihat', 'bagaimana', 'siapa', 'kapan', 'dimana', 'kenapa', 'mengapa'];
    const cleanQuery = userQuery.toLowerCase().replace(/[.,?!()]/g, '');
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
    
    let candidateBooks = books;
    if (books.length > 0 && queryWords.length > 0) {
      const scoredBooks = books.map(b => {
        const text = `${b.title} ${b.category} ${Array.isArray(b.subject) ? b.subject.join(' ') : b.subject || ''}`.toLowerCase();
        let score = 0;
        // Bobot skor hanya berdasarkan kata kunci inti
        queryWords.forEach(w => { if (text.includes(w)) score++; });
        return { book: b, score };
      }).filter(item => item.score > 0);
      
      scoredBooks.sort((a, b) => b.score - a.score);
      candidateBooks = scoredBooks.map(item => item.book);
      
      if (candidateBooks.length === 0) candidateBooks = books.slice(0, 30);
    }
    
    // Potong maksimal 15 buku agar aman dari limit token (6000 TPM) di Groq Free Tier
    candidateBooks = candidateBooks.slice(0, 15);

    // Sertakan Kategori agar AI punya wawasan lebih luas tanpa terlalu boros token
    const booksSummary = candidateBooks
      .map((b) => `ID: ${b.biblio_id} | Judul: ${b.title} | Kategori: ${b.category || '-'}`)
      .join('\n');

    const prompt = `Kamu adalah Pustakawan AI pintar di LabsLib.

PENGGUNA MENCARI:
"${userQuery}"

DAFTAR BUKU TERSEDIA:
${booksSummary}

INSTRUKSI SANGAT PENTING:
1. Temukan buku-buku yang BENAR-BENAR RELEVAN dengan topik pencarian pengguna dari daftar di atas.
2. JANGAN PERNAH menambahkan buku yang tidak nyambung dengan topik pencarian.
3. Jika hanya ada 1 buku yang relevan, kembalikan 1 saja. Jika tidak ada yang relevan, kembalikan array kosong []. Jangan pernah menebak-nebak atau berhalusinasi.
4. Kembalikan HANYA format JSON (tanpa markdown blok):
{
  "results": ["ID_BUKU_1", "ID_BUKU_2"],
  "explanation": "Saya menemukan buku...",
  "query_interpretation": "Pengguna mencari tentang..."
}`;

    try {
      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'Kamu adalah mesin JSON.' },
          { role: 'user', content: prompt }
        ],
        model: SEARCH_MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const rawText = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawText);
      const { results: biblioIds, explanation, query_interpretation } = parsed;

      const matchedBooks = (biblioIds || [])
        .map((id) => books.find((b) => b.biblio_id === id))
        .filter(Boolean);

      let finalExplanation = explanation;
      if (matchedBooks.length === 0 && (biblioIds || []).length > 0) {
        finalExplanation = "Maaf, saya tidak dapat menemukan buku yang tepat untuk pertanyaan Anda.";
      } else if (matchedBooks.length === 0) {
        finalExplanation = explanation || "Tidak ada buku yang relevan dengan kata kunci Anda.";
      }

      loggerService.logAIInteraction('search_book', userQuery, 'groq');

      return {
        results: matchedBooks,
        explanation: finalExplanation,
        queryInterpretation: query_interpretation || userQuery,
      };
    } catch (error) {
      console.error('Groq AI Search error:', error);
      throw new Error(`Groq AI tidak dapat memproses permintaan: ${error.message}`);
    }
  },

  searchResearchWithAI: async (userQuery, researchList) => {
    const groq = getClient();

    // PRE-FILTERING LOKAL (Pseudo-RAG) - Stop Words & Sistem Skor
    const stopWords = ['saya', 'aku', 'mencari', 'cari', 'buku', 'karya', 'tulis', 'penelitian', 'skripsi', 'makalah', 'jurnal', 'artikel', 'tentang', 'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'untuk', 'dengan', 'ada', 'apakah', 'ingin', 'mengetahui', 'tolong', 'carikan', 'informasi', 'apa', 'saja', 'yg', 'membahas', 'mengenai', 'berkaitan', 'berisi', 'menjelaskan', 'adalah', 'yaitu', 'merupakan', 'seputar', 'hal', 'dalam', 'pada', 'bagi', 'oleh', 'sebuah', 'suatu', 'beberapa', 'macam', 'jenis', 'seperti', 'serta', 'atau', 'tetapi', 'namun', 'karena', 'sebab', 'sehingga', 'maka', 'jadi', 'buat', 'bikin', 'kasih', 'beri', 'tahu', 'lihat', 'bagaimana', 'siapa', 'kapan', 'dimana', 'kenapa', 'mengapa'];
    const cleanQuery = userQuery.toLowerCase().replace(/[.,?!()]/g, '');
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
    
    let candidateDocs = researchList;
    if (researchList.length > 0 && queryWords.length > 0) {
      const scoredDocs = researchList.map(r => {
        const text = `${r.title} ${r.author} ${r.keywords ? r.keywords.join(' ') : ''}`.toLowerCase();
        let score = 0;
        queryWords.forEach(w => { if (text.includes(w)) score++; });
        return { doc: r, score };
      }).filter(item => item.score > 0);
      
      scoredDocs.sort((a, b) => b.score - a.score);
      candidateDocs = scoredDocs.map(item => item.doc);
      
      // Jika tidak ada yang cocok sama sekali secara kata per kata, berikan 30 sampel acak teratas
      if (candidateDocs.length === 0) candidateDocs = researchList.slice(0, 30);
    }
    
    // Potong maksimal 15 dokumen agar tidak melebihi batas 6000 TPM dari Groq Free Tier
    candidateDocs = candidateDocs.slice(0, 15);

    const researchSummary = candidateDocs
      .map((r) => `ID: ${r.id} | Judul: ${r.title} | Penulis: ${r.author} | Kata Kunci: ${(r.keywords || []).join(', ')}`)
      .join('\n');

    const prompt = `Kamu adalah Pustakawan AI pintar di LabsLib.

PENGGUNA MENCARI:
"${userQuery}"

DAFTAR KARYA TULIS TERSEDIA:
${researchSummary}

INSTRUKSI SANGAT PENTING:
1. Temukan karya tulis yang BENAR-BENAR RELEVAN dengan topik pencarian pengguna dari daftar di atas.
2. JANGAN PERNAH menambahkan karya tulis yang tidak nyambung dengan topik (misalnya jangan berikan karya tulis tentang psikologi/agama jika yang dicari adalah lingkungan/polusi).
3. Jika hanya ada 1 karya tulis yang relevan, kembalikan 1 saja. Jika tidak ada yang relevan, kembalikan array kosong []. Jangan pernah menebak-nebak atau berhalusinasi.
4. Kembalikan HANYA format JSON (tanpa markdown blok):
{
  "results": ["ID_KARYA_1", "ID_KARYA_2"],
  "explanation": "Saya menemukan karya tulis...",
  "query_interpretation": "Pengguna mencari tentang..."
}`;

    try {
      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'Kamu adalah mesin JSON yang sangat ketat.' },
          { role: 'user', content: prompt }
        ],
        model: SEARCH_MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });
      const rawText = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawText);
      const { results: docIds, explanation, query_interpretation } = parsed;

      const matchedDocs = (docIds || []).map((id) => researchList.find((r) => r.id === id)).filter(Boolean);

      let finalExplanation = explanation;
      if (matchedDocs.length === 0 && (docIds || []).length > 0) {
        finalExplanation = "Maaf, saya tidak dapat menemukan karya tulis yang tepat untuk pertanyaan Anda.";
      } else if (matchedDocs.length === 0) {
        finalExplanation = explanation || "Tidak ada karya tulis yang relevan dengan kueri Anda.";
      }

      loggerService.logAIInteraction('search_research', userQuery, 'groq');

      return { results: matchedDocs, explanation: finalExplanation };
    } catch (error) {
      console.error('Groq AI Research Search error:', error);
      throw new Error(`Groq AI tidak dapat memproses permintaan: ${error.message}`);
    }
  },

  startChatSession: (history = []) => {
    // Translate Gemini history format to OpenAI (Groq) format
    const groqHistory = history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : msg.role,
      content: msg.parts ? msg.parts[0].text : msg.content
    }));
    
    return {
      history: groqHistory,
      getHistory: async () => groqHistory
    };
  },

  sendMessageToChat: async (chatSession, message, booksCatalog = []) => {
    loggerService.logAIInteraction('chat', message, 'groq');
    const groq = getClient();
    const isFirstMessage = chatSession.history.length === 0;
    if (isFirstMessage) {
      chatSession.history.push({
        role: 'system', 
        content: `Kamu adalah "LabsLib AI", asisten perpustakaan resmi di SMP & SMA Labschool Jakarta. Tugasmu membantu siswa menemukan buku, memberikan ringkasan, dan menjawab pertanyaan dengan ramah. ATURAN PENTING: Jika pengguna mencari buku, gunakan [INFO SISTEM] yang diberikan pada pesannya sebagai acuan koleksi. Jangan halusinasi buku yang tidak ada.`
      });
    }

    chatSession.history.push({ role: 'user', content: message });

    let contextToInject = "";
    if (booksCatalog && booksCatalog.length > 0) {
      const booksSummary = booksCatalog.map(b => {
        const desc = b.description ? b.description.substring(0, 300) + (b.description.length > 300 ? '...' : '') : 'Tidak ada sinopsis';
        return `- Judul: ${b.title} | Penulis: ${b.author} | Subjek: ${b.subject ? b.subject.join(',') : '-'} | Sinopsis: ${desc}`;
      }).join('\n');
      contextToInject = `\n\n[INFO SISTEM: Berikut adalah beberapa buku dari perpustakaan yang relevan dengan pertanyaanku beserta sinopsisnya:\n${booksSummary}\nMohon rekomendasikan atau rujuk buku-buku ini jika sesuai. Jika aku meminta ringkasan, berikan ringkasan berdasarkan sinopsis di atas.]`;
    }

    // Salin pesan untuk dikirim ke API agar INFO SISTEM tidak permanen di UI
    const apiMessages = [...chatSession.history];
    if (contextToInject) {
      apiMessages[apiMessages.length - 1] = { 
        role: 'user', 
        content: message + contextToInject 
      };
    }

    try {
      const response = await groq.chat.completions.create({
        messages: apiMessages,
        model: REASONING_MODEL,
        temperature: 0.7,
      });
      
      const replyText = response.choices[0]?.message?.content || 'Maaf, saya tidak bisa memproses balasan saat ini.';
      chatSession.history.push({ role: 'assistant', content: replyText });
      
      return replyText;
    } catch (error) {
      console.error('sendMessageToChat (Groq) error:', error);
      throw new Error('Gagal mengirim pesan ke AI Groq.');
    }
  },

  generateResearchBrief: async (topic, allBooks) => {
    const groq = getClient();
    const booksSummary = allBooks.map((b) => `ID: ${b.biblio_id} | Judul: ${b.title}`).join('\n');

    const prompt = `Kamu adalah Asisten Riset untuk Guru di Perpustakaan SMP & SMA Labschool.
Buat **Research Brief** komprehensif berdasarkan topik: "${topic}"

Katalog Buku:
${booksSummary}

Kembalikan HANYA format JSON:
{
  "report": "# Ringkasan Materi... (format markdown, minimal 3 paragraf)",
  "recommended_ids": ["ID_BUKU_1", "ID_BUKU_2"]
}`;

    try {
      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'Kamu adalah API JSON. Keluarkan JSON saja.' },
          { role: 'user', content: prompt }
        ],
        model: REASONING_MODEL,
        response_format: { type: 'json_object' }
      });
      
      const rawText = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawText);
      
      const recommendedBooks = (parsed.recommended_ids || []).map((id) => allBooks.find((b) => b.biblio_id === id)).filter(Boolean);

      return {
        reportMarkdown: parsed.report || 'Gagal menghasilkan report.',
        recommendedBooks: recommendedBooks
      };
    } catch (error) {
      console.error('generateResearchBrief error:', error);
      throw new Error('Groq AI gagal memproses Research Brief.');
    }
  }
};
