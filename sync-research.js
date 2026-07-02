import fs from 'fs';
import mysql from 'mysql2/promise';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Script untuk Sinkronisasi Karya Tulis dari SLiMS MySQL ke Firebase Firestore
// Cara menjalankan:
// 1. Install dependencies: npm install mysql2 firebase-admin
// 2. Isi kredensial MySQL dan Firebase di bawah ini
// 3. Jalankan: node sync-research.js

// --- 1. KONFIGURASI FIREBASE ---
// Anda harus mendownload file Service Account JSON dari Firebase Console
// (Project Settings -> Service Accounts -> Generate New Private Key)
// Pastikan file diletakkan di folder yang sama dengan nama 'firebase-service-account.json'
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

// --- 2. KONFIGURASI MYSQL SLIMS ---
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // <-- MASUKKAN PASSWORD MYSQL SLIMS ANDA DI SINI
  database: 'perpustakaan' // <-- NAMA DATABASE SLIMS ANDA
};

async function syncResearch() {
  console.log('=============================================');
  console.log('🚀 Memulai sinkronisasi Karya Tulis SLiMS...');
  console.log('=============================================');
  
  let connection;
  try {
    // Konek ke MySQL
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Berhasil terhubung ke Database MySQL SLiMS.');
    
    // Sesuaikan query ini dengan cara Anda menyimpan Karya Tulis di SLiMS
    // Secara default, SLiMS membedakan jenis koleksi dari tabel mst_gmd
    const [rows] = await connection.execute(`
      SELECT 
        b.biblio_id as id,
        b.title,
        b.publish_year as year,
        b.notes as abstract,
        a.author_name as author,
        g.gmd_name as type,
        (SELECT GROUP_CONCAT(topic) FROM biblio_topic bt JOIN mst_topic t ON bt.topic_id = t.topic_id WHERE bt.biblio_id = b.biblio_id) as keywords,
        f.file_name
      FROM biblio b
      LEFT JOIN biblio_author ba ON b.biblio_id = ba.biblio_id AND ba.level = 1
      LEFT JOIN mst_author a ON ba.author_id = a.author_id
      LEFT JOIN mst_gmd g ON b.gmd_id = g.gmd_id
      LEFT JOIN biblio_attachment att ON b.biblio_id = att.biblio_id
      LEFT JOIN files f ON att.file_id = f.file_id
      WHERE g.gmd_name IN ('Karya Tulis Digital')
      GROUP BY b.biblio_id
    `);
    
    console.log(`📚 Ditemukan ${rows.length} Karya Tulis di SLiMS yang siap dipindahkan.`);
    
    let successCount = 0;
    for (const row of rows) {
      // Menyusun URL PDF mengarah ke server SLiMS
      const pdfUrl = row.file_name ? `http://perpus.labschool-unj.sch.id/labsjkt/repository/${row.file_name}` : null;

      const researchData = {
        title: row.title || 'Tanpa Judul',
        author: row.author || 'Anonim',
        year: row.year || 2024,
        type: row.type || 'Karya Tulis',
        abstract: row.abstract || '',
        keywords: row.keywords ? row.keywords.split(',').map(k => k.trim()) : [],
        slims_id: row.id,
        pdf_url: pdfUrl
      };
      
      // Menyimpan ke koleksi 'research' di Firebase
      // Kami menggunakan awalan KTI- agar ID unik dan mudah dikenali
      await db.collection('research').doc(`KTI-${row.id}`).set(researchData);
      successCount++;
      
      // Tampilkan progress setiap kelipatan 50
      if (successCount % 50 === 0) {
        console.log(`⏳ Sedang mengunggah... (${successCount}/${rows.length})`);
      }
    }
    
    console.log('=============================================');
    console.log(`🎉 SUKSES! Berhasil menyinkronkan ${successCount} Karya Tulis ke Firebase!`);
    console.log('Karya Tulis sekarang sudah bisa dicari oleh AI Smart Library Anda.');
    console.log('=============================================');
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error);
    if (error.code === 'ECONNREFUSED') {
      console.log('INFO: Pastikan XAMPP / MySQL Server SLiMS Anda sedang berjalan.');
    }
  } finally {
    if (connection) await connection.end();
  }
}

syncResearch();
