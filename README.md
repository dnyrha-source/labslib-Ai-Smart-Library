# 📚 LabsLib AI - Perpustakaan Pintar Masa Depan

LabsLib AI adalah aplikasi perpustakaan cerdas berbasis web (*Serverless/JAMstack*) yang mengintegrasikan sistem perpustakaan konvensional (SLiMS 9.4.2) dengan kekuatan Kecerdasan Buatan (Google Gemini & Meta Llama). Aplikasi ini dirancang khusus untuk memenuhi kebutuhan tiga pilar utama sekolah: **Siswa, Guru, dan Pustakawan**.

---

## ✨ Fitur Utama

1. **👦 Untuk Siswa: AI Chat Assistant & Magic Search**
   Pencarian buku tak lagi kaku. Siswa dapat mengobrol menggunakan bahasa sehari-hari dengan AI untuk mendapatkan rekomendasi buku SLiMS yang paling relevan.
   
2. **👨‍🏫 Untuk Guru: AI Research Assistant**
   Asisten cerdas untuk membantu guru menyusun kerangka materi ajar dan mencari literatur / referensi dari koleksi perpustakaan secara instan.

3. **👩‍💻 Untuk Pustakawan: Real-time Command Center**
   Dashboard analitik interaktif yang menyajikan statistik jumlah buku, tren minat baca (Topik Populer), dan aktivitas harian secara *real-time*.

4. **🔒 Digital Reader dengan Anti-Copas**
   Fitur pembaca dokumen PDF karya tulis sekolah (terintegrasi *Vercel Proxy* untuk *bypass Mixed Content*) yang dilengkapi dengan perlindungan Anti-Copas.

5. **🔄 Integrasi SLiMS 9.4.2**
   Skrip sinkronisasi khusus yang mampu memindahkan puluhan ribu data buku dari *database* MySQL (SLiMS) lokal ke Cloud (Firebase) dalam hitungan detik.

---

## 🛠️ Tech Stack (Teknologi yang Digunakan)

*   **Frontend:** React.js (v19) + Vite, CSS (Glassmorphism & Modern UI), Lucide React (Icons).
*   **Backend/Database:** Firebase Cloud Firestore (Serverless NoSQL Database).
*   **AI Models:** 
    *   Google Gemini 2.5 Flash (via Google Generative AI API) - *Otak Utama*
    *   Meta Llama 3.3 70B & Llama 3.1 8B (via Groq API) - *Pencarian Cepat*
*   **Skrip Sinkronisasi:** Node.js, `mysql2`, `firebase-admin`.
*   **Hosting:** Vercel.

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Persiapan Awal
Pastikan Anda sudah menginstal:
*   [Node.js](https://nodejs.org/) (versi 18 atau ke atas)
*   Git

### 2. Kloning Repository
```bash
git clone <url-repository-anda>
cd "AI Smart Library"
npm install
```

### 3. Konfigurasi Environment Variables (.env)
Buat file bernama `.env` di folder utama proyek (sejajar dengan `package.json`). Isi dengan kunci rahasia Anda:

```env
# Kunci API AI
VITE_GEMINI_API_KEY=masukkan_api_key_gemini_anda_di_sini
VITE_GROQ_API_KEY=masukkan_api_key_groq_anda_di_sini

# Konfigurasi Firebase (Frontend)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```
> ⚠️ **PERINGATAN:** File `.env` sudah dimasukkan ke dalam `.gitignore`. Jangan pernah membagikan atau meng-upload isi file `.env` Anda secara publik!

### 4. Sinkronisasi Data dari SLiMS (Opsional, khusus Pustakawan)
Untuk menarik data dari *database* SLiMS MySQL ke Firebase:
1. Pastikan Anda memiliki file `firebase-service-account.json` (didapat dari Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key).
2. Letakkan file `firebase-service-account.json` di folder utama (sudah di-*ignore* oleh Git).
3. Jalankan skrip sinkronisasi:
```bash
# Untuk sinkronisasi Buku
node sync-book.js

# Untuk sinkronisasi Karya Tulis / Penelitian
node sync-research.js
```
> 🚨 **DANGER:** File `firebase-service-account.json` adalah kunci *Master/Admin* database Anda. Jangan berikan ke siapapun dan pastikan tidak ter-*upload* ke GitHub.

### 5. Menjalankan Aplikasi secara Lokal
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:5173`. 
*(Catatan: Untuk akses PDF karya tulis SLiMS secara lokal, sistem menggunakan VITE Proxy yang sudah dikonfigurasi di `vite.config.js`).*

---

## 🌐 Panduan Deployment (Publikasi ke Vercel)
Aplikasi ini sudah dioptimasi untuk berjalan sempurna di **Vercel**.
1. Login ke Vercel dan buat *New Project*.
2. Hubungkan dengan *repository* GitHub Anda.
3. Masukkan seluruh *Environment Variables* (isi dari `.env`) ke menu pengaturan Vercel -> *Environment Variables*.
4. Klik **Deploy**.

**Fitur Khusus Vercel:** Proyek ini menyertakan file `vercel.json` yang berisi aturan *Rewrite Proxy*. Ini berfungsi agar *browser* tidak memblokir PDF dari SLiMS (HTTP) saat dimuat di Vercel (HTTPS) akibat masalah *Mixed Content*.

---
**Dibuat untuk memajukan masa depan pendidikan. 🎓**
