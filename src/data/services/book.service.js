/**
 * book.service.js
 * Service layer untuk operasi Firestore terhadap koleksi 'books'
 * Dengan fallback ke data mock jika koleksi kosong
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../core/firebase';
import { MOCK_BOOKS } from '../mock/books.mock';

const BOOKS_COLLECTION = 'books';

/**
 * Resolve cover URL for SLiMS images. If it's just a filename, prepend SLiMS URL.
 */
const resolveCoverUrl = (cover) => {
  if (!cover) return null;
  if (cover.startsWith('http') || cover.startsWith('blob:') || cover.startsWith('data:')) {
    return cover;
  }
  const baseUrl = import.meta.env.VITE_SLIMS_BASE_URL || 'http://perpus.labschool-unj.sch.id/labsjkt';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBase}/images/docs/${cover}`;
};

let cachedAllBooks = null;
let lastCacheTime = 0;
const CACHE_LIFETIME = 1000 * 60 * 60; // 1 Jam

/**
 * Ambil semua buku dari Firestore. Jika koleksi kosong, gunakan data mock.
 * @param {number} limitCount - Jumlah maksimal buku yang diambil
 * @returns {Promise<Array>} - Array objek buku
 */
export const bookService = {
  /**
   * Ambil semua buku (dengan limit)
   */
  getAllBooks: async (limitCount = 50) => {
    try {
      // Gunakan Cache jika masih valid dan kita sedang meminta seluruh data
      if (limitCount >= 5000 && cachedAllBooks && (Date.now() - lastCacheTime < CACHE_LIFETIME)) {
        return cachedAllBooks.slice(0, limitCount);
      }

      const booksRef = collection(db, BOOKS_COLLECTION);
      const q = query(booksRef, orderBy('title'), limit(limitCount));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return MOCK_BOOKS;
      }

      const results = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          biblio_id: data.slims_id || data.biblio_id || doc.id,
          availability: data.status || data.availability || 'available',
          description: data.synopsis || data.description,
          location: data.rackLocation || data.location,
          cover_image: data.coverUrl || data.cover_image,
          call_number: data.callNumber || data.call_number,
          subject: Array.isArray(data.subject) 
            ? data.subject 
            : (typeof data.subject === 'string' && data.subject.trim() !== '' 
                ? data.subject.split(',').map(s => s.trim()) 
                : [])
        };
      });

      // Simpan ke memori jika menarik data besar
      if (limitCount >= 5000) {
        cachedAllBooks = results;
        lastCacheTime = Date.now();
      }

      return results;
    } catch (error) {
      console.warn('Firestore query gagal, menggunakan data mock:', error.message);
      return MOCK_BOOKS;
    }
  },

  /**
   * Ambil satu buku berdasarkan ID
   * @param {string} biblioId - ID buku (biblio_id)
   */
  getBookById: async (biblioId) => {
    try {
      // Coba langsung dari Firestore dulu
      const docRef = doc(db, BOOKS_COLLECTION, biblioId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
          id: docSnap.id, 
          ...data,
          biblio_id: data.slims_id || data.biblio_id || docSnap.id,
          availability: data.status || data.availability || 'available',
          description: data.synopsis || data.description,
          location: data.rackLocation || data.location,
          cover_image: resolveCoverUrl(data.coverUrl || data.cover_image),
          call_number: data.callNumber || data.call_number,
          subject: Array.isArray(data.subject) 
            ? data.subject 
            : (typeof data.subject === 'string' && data.subject.trim() !== '' 
                ? data.subject.split(',').map(s => s.trim()) 
                : [])
        };
      }

      // Coba query dengan field biblio_id atau slims_id
      const booksRef = collection(db, BOOKS_COLLECTION);
      let q = query(booksRef, where('biblio_id', '==', biblioId), limit(1));
      let snapshot = await getDocs(q);

      if (snapshot.empty) {
        q = query(booksRef, where('slims_id', '==', biblioId), limit(1));
        snapshot = await getDocs(q);
      }

      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        const data = docData.data();
        return { 
          id: docData.id, 
          ...data,
          biblio_id: data.slims_id || data.biblio_id || docData.id,
          availability: data.status || data.availability || 'available',
          description: data.synopsis || data.description,
          location: data.rackLocation || data.location,
          cover_image: resolveCoverUrl(data.coverUrl || data.cover_image),
          call_number: data.callNumber || data.call_number,
          subject: Array.isArray(data.subject) 
            ? data.subject 
            : (typeof data.subject === 'string' && data.subject.trim() !== '' 
                ? data.subject.split(',').map(s => s.trim()) 
                : [])
        };
      }

      // Fallback ke mock data
      const mockBook = MOCK_BOOKS.find((b) => b.biblio_id === biblioId);
      return mockBook || null;
    } catch (error) {
      console.warn('getBookById gagal, fallback ke mock:', error.message);
      const mockBook = MOCK_BOOKS.find((b) => b.biblio_id === biblioId);
      return mockBook || null;
    }
  },

  /**
   * Cari buku berdasarkan keyword di title dan author (konvensional)
   * @param {string} keyword - Kata kunci pencarian
   */
  searchBooks: async (keyword) => {
    if (!keyword || keyword.trim() === '') {
      return bookService.getAllBooks();
    }

    // Bersihkan karakter spesial (termasuk asterisk **) agar tidak membuat Regex crash
    const cleanQuery = keyword.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    const stopWords = ['saya', 'aku', 'mencari', 'cari', 'buku', 'tentang', 'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'untuk', 'dengan', 'ada', 'apakah', 'ingin', 'mengetahui', 'tolong', 'carikan', 'informasi', 'apa', 'saja', 'yg', 'membahas', 'mengenai', 'berkaitan', 'berisi', 'menjelaskan', 'adalah', 'yaitu', 'merupakan', 'seputar', 'hal', 'dalam', 'pada', 'bagi', 'oleh', 'sebuah', 'suatu', 'beberapa', 'macam', 'jenis', 'seperti', 'serta', 'atau', 'tetapi', 'namun', 'karena', 'sebab', 'sehingga', 'maka', 'jadi', 'buat', 'bikin', 'kasih', 'beri', 'tahu', 'lihat', 'bagaimana', 'siapa', 'kapan', 'dimana', 'kenapa', 'mengapa', 'karya', 'tulis', 'penelitian', 'skripsi', 'makalah', 'jurnal', 'artikel', 'tugas', 'dgn', 'tersebut', 'anda', 'kamu', 'dia', 'mereka', 'kita', 'kami', 'ringkas', 'ringkasan', 'rangkum', 'rangkuman', 'sinopsis', 'sinopsisnya', 'jelaskan', 'berikan', 'coba', 'bisa', 'bisakah', 'nomor', 'no'];
    
    // Split into keywords and remove stop words
    let queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
    
    // If all words are stop words, fallback to the entire clean query
    if (queryWords.length === 0) {
      queryWords = [cleanQuery];
    }

    try {
      // Mengambil seluruh koleksi (sekitar 10.000 buku) agar pencarian menyeluruh.
      // Data akan di-cache selama 1 jam di memori (lihat getAllBooks).
      const allBooks = await bookService.getAllBooks(10000);

      // Filter client-side menggunakan sistem skor (kemunculan keyword)
      const scoredBooks = allBooks.map((book) => {
        let score = 0;
        const textToSearch = [
          book.title,
          book.author,
          book.isbn,
          book.category,
          book.description,
          ...(book.subject || [])
        ].join(' ').toLowerCase();

        queryWords.forEach(w => {
          // Hanya hitung jika exact word atau kata cukup panjang
          const regex = new RegExp(`\\b${w}\\b`, 'i');
          if (regex.test(textToSearch)) {
            score += (w.length * 2); // Bobot tinggi untuk exact match
          } else if (w.length >= 4 && textToSearch.includes(w)) {
            score += w.length; // Bobot standar untuk partial match
          }
        });

        return { book, score };
      }).filter(item => item.score > 0);

      // Urutkan dari yang paling banyak cocok kata kuncinya
      scoredBooks.sort((a, b) => b.score - a.score);
      return scoredBooks.map(item => item.book);

    } catch (error) {
      console.warn('searchBooks error:', error.message);
      return [];
    }
  },

  /**
   * Filter buku berdasarkan subjek
   * @param {string} subject - Nama subjek
   */
  getBooksBySubject: async (subject) => {
    try {
      const allBooks = await bookService.getAllBooks(10000);
      if (!subject) return allBooks;
      return allBooks.filter((book) =>
        book.subject?.some(
          (s) => s.toLowerCase() === subject.toLowerCase()
        )
      );
    } catch (error) {
      console.warn('getBooksBySubject error:', error.message);
      return MOCK_BOOKS.filter((book) =>
        book.subject?.some((s) => s.toLowerCase() === subject.toLowerCase())
      );
    }
  },

  /**
   * Filter buku berdasarkan ketersediaan
   * @param {string} availability - 'available' | 'borrowed' | 'reserved'
   */
  getBooksByAvailability: async (availability) => {
    try {
      const allBooks = await bookService.getAllBooks(10000);
      if (!availability) return allBooks;
      return allBooks.filter((book) => book.availability === availability);
    } catch (error) {
      console.warn('getBooksByAvailability error:', error.message);
      return MOCK_BOOKS.filter((b) => b.availability === availability);
    }
  },
};
