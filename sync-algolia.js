import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { algoliasearch } from 'algoliasearch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Script untuk Sinkronisasi Buku dari Firebase Firestore ke Algolia
// Cara menjalankan:
// 1. Pastikan file 'firebase-service-account.json' ada di folder ini
// 2. Pastikan file '.env' sudah berisi VITE_ALGOLIA_APP_ID dan VITE_ALGOLIA_ADMIN_KEY
// 3. Jalankan: node sync-algolia.js

// --- 1. KONFIGURASI FIREBASE ---
let serviceAccount;
try {
  const fileContent = fs.readFileSync(new URL('./firebase-service-account.json', import.meta.url));
  serviceAccount = JSON.parse(fileContent);
} catch (error) {
  console.error("GAGAL: File 'firebase-service-account.json' tidak ditemukan!");
  console.log("Silakan download dari Firebase Console > Project Settings > Service Accounts.");
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

// --- 2. KONFIGURASI ALGOLIA ---
const appId = process.env.VITE_ALGOLIA_APP_ID;
// CATATAN: Gunakan ADMIN API KEY untuk write/sync, bukan SEARCH API KEY
const adminKey = process.env.VITE_ALGOLIA_ADMIN_KEY || process.env.VITE_ALGOLIA_SEARCH_KEY; 

if (!appId || !adminKey) {
  console.error("GAGAL: Konfigurasi Algolia tidak lengkap di file .env!");
  console.log("Pastikan VITE_ALGOLIA_APP_ID dan VITE_ALGOLIA_ADMIN_KEY sudah terisi.");
  process.exit(1);
}

const client = algoliasearch(appId, adminKey);

// --- 3. PROSES SINKRONISASI ---
async function syncToAlgolia() {
  console.log("Memulai sinkronisasi buku dari Firestore ke Algolia...");
  
  try {
    const booksRef = db.collection('books');
    const snapshot = await booksRef.get();
    
    if (snapshot.empty) {
      console.log("Tidak ada buku di Firestore yang perlu disinkronkan.");
      return;
    }

    console.log(`Ditemukan ${snapshot.size} buku di Firestore. Mengambil data...`);
    
    const records = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Siapkan format data yang ramah untuk pencarian (hapus data yang tidak relevan agar irit kapasitas Algolia)
      records.push({
        objectID: doc.id,
        title: data.title || '',
        author: data.author || '',
        publisher: data.publisher || '',
        isbn: data.isbn || '',
        publish_year: data.publish_year || '',
        category: data.category || '',
        subject: data.subject || [],
        description: data.description || data.synopsis || '',
        coverUrl: data.coverUrl || data.cover_image || null,
        availability: data.status || data.availability || 'available',
      });
    });

    console.log(`Menyimpan ${records.length} data buku ke server Algolia...`);
    
    // Simpan ke index 'books' (Algolia akan otomatis membuat index ini jika belum ada)
    // Catatan: Karena Algolia v5 menggunakan API yang sedikit berbeda:
    const response = await client.saveObjects({
      indexName: 'books',
      objects: records,
    });
    
    console.log(`✅ BERHASIL! Sinkronisasi Selesai.`);
    console.log(`Silakan cek dashboard Algolia Anda untuk melihat datanya.`);
    
  } catch (error) {
    console.error("Terjadi kesalahan saat sinkronisasi:", error);
  }
}

syncToAlgolia();
