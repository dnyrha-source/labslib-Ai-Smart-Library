import { collection, doc, getDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../core/firebase';
import { MOCK_RESEARCH } from '../mock/research.mock';

const RESEARCH_COLLECTION = 'research'; // Nama koleksi di Firebase

let cachedAllResearch = null;
let lastCacheTime = 0;
const CACHE_LIFETIME = 1000 * 60 * 60; // 1 Jam

export const researchService = {
  /**
   * Mengambil semua karya tulis
   */
  getAllResearch: async (limitCount = 10000) => {
    try {
      if (limitCount >= 5000 && cachedAllResearch && (Date.now() - lastCacheTime < CACHE_LIFETIME)) {
        return cachedAllResearch.slice(0, limitCount);
      }

      const ref = collection(db, RESEARCH_COLLECTION);
      const q = query(ref, orderBy('title'), limit(limitCount));
      const snapshot = await getDocs(q);

      // Jika koleksi Firebase kosong, fallback ke mock sementara agar layar tidak kosong melompong
      if (snapshot.empty) {
        return MOCK_RESEARCH.slice(0, limitCount);
      }

      const results = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Normalisasi field jika data dari SLiMS memiliki penamaan berbeda
          title: data.title || data.judul,
          author: data.author || data.penulis,
          year: data.year || data.tahun || 2024,
          type: data.type || data.tipe || 'Karya Tulis',
          keywords: Array.isArray(data.keywords) ? data.keywords : (typeof data.keywords === 'string' ? data.keywords.split(',').map(k=>k.trim()) : []),
          abstract: data.abstract || data.abstrak || '',
          pdf_url: data.pdf_url || data.file_url || null
        };
      });

      if (limitCount >= 5000) {
        cachedAllResearch = results;
        lastCacheTime = Date.now();
      }

      return results;
    } catch (error) {
      console.warn('Firestore query gagal (Research), fallback ke mock:', error.message);
      return MOCK_RESEARCH.slice(0, limitCount);
    }
  },

  /**
   * Mengambil karya tulis berdasarkan ID
   */
  getResearchById: async (id) => {
    try {
      const docRef = doc(db, RESEARCH_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return { id: docSnap.id, ...data };
      }

      const mock = MOCK_RESEARCH.find((r) => r.id === id);
      return mock || null;
    } catch (error) {
      console.warn('getResearchById gagal, fallback ke mock:', error.message);
      return MOCK_RESEARCH.find((r) => r.id === id) || null;
    }
  },

  /**
   * Pencarian konvensional (judul, penulis, keyword, abstrak)
   */
  searchResearch: async (keyword) => {
    if (!keyword || keyword.trim() === '') {
      return researchService.getAllResearch(10000);
    }

    const lower = keyword.toLowerCase().trim();

    try {
      const all = await researchService.getAllResearch(10000);

      return all.filter(
        (r) =>
          r.title?.toLowerCase().includes(lower) ||
          r.author?.toLowerCase().includes(lower) ||
          r.keywords?.some((k) => k.toLowerCase().includes(lower)) ||
          r.abstract?.toLowerCase().includes(lower) ||
          r.type?.toLowerCase().includes(lower)
      );
    } catch (error) {
      console.warn('searchResearch error:', error.message);
      return MOCK_RESEARCH.filter(
        (r) =>
          r.title.toLowerCase().includes(lower) ||
          r.author.toLowerCase().includes(lower) ||
          r.keywords.some((k) => k.toLowerCase().includes(lower))
      );
    }
  }
};
