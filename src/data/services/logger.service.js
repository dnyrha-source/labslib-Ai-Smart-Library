import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../core/firebase';

const AI_LOGS_COLLECTION = 'ai_logs';

export const loggerService = {
  /**
   * Catat setiap interaksi AI ke Firestore.
   * @param {string} actionType - 'search_book', 'search_research', 'chat'
   * @param {string} query - Teks input dari user (berguna untuk analitik topik)
   * @param {string} provider - 'gemini' atau 'groq'
   */
  logAIInteraction: async (actionType, query, provider = 'gemini') => {
    try {
      // Kita tidak mewajibkan UID jika user belum login saat menggunakan chat, dsb
      await addDoc(collection(db, AI_LOGS_COLLECTION), {
        actionType,
        query,
        provider,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.warn("Gagal mencatat log AI:", error);
      // Tidak melempar error agar aplikasi utama tidak berhenti
    }
  }
};
