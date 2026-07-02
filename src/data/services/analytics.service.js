import { collection, getCountFromServer, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../core/firebase';
import { MOCK_ANALYTICS } from '../mock/analytics.mock';

export const analyticsService = {
  getDashboardMetrics: async () => {
    try {
      // 1. Get real counts using getCountFromServer for performance
      const booksSnap = await getCountFromServer(collection(db, 'books'));
      const researchSnap = await getCountFromServer(collection(db, 'research'));
      const usersSnap = await getCountFromServer(collection(db, 'users'));
      const aiLogsSnap = await getCountFromServer(collection(db, 'ai_logs'));
      
      const totalBooks = booksSnap.data().count + researchSnap.data().count;
      const totalUsers = usersSnap.data().count;
      const totalAIInteractions = aiLogsSnap.data().count;

      // 2. Get recent AI logs to calculate Daily Activity & Popular Topics
      // Kita batasi 500 interaksi terbaru untuk efisiensi
      const logsQuery = query(collection(db, 'ai_logs'), orderBy('timestamp', 'desc'), limit(500));
      const logsSnapshot = await getDocs(logsQuery);
      
      let dailyActivity = [];
      let popularTopics = [];
      
      if (logsSnapshot.empty) {
        // Jika belum ada log nyata, kita panggil fallback agar UI tidak kosong melompong
        dailyActivity = MOCK_ANALYTICS.dailyActivity.map(d => ({ ...d, value: 0 }));
        popularTopics = MOCK_ANALYTICS.popularTopics;
      } else {
        // Menghitung Aktivitas 7 Hari Terakhir
        const dayCounts = {};
        const now = new Date();
        const daysLabel = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        
        // Inisialisasi 7 hari terakhir dengan 0
        for(let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          dayCounts[d.toDateString()] = { day: daysLabel[d.getDay()], value: 0, dateObj: d };
        }

        // Analisis Topik Berdasarkan Keyword sederhana
        const topicCategories = {
          'Sains & Alam': ['sains', 'alam', 'biologi', 'fisika', 'bumi', 'luar angkasa', 'hewan', 'tumbuhan'],
          'Fiksi & Sastra': ['novel', 'cerpen', 'puisi', 'sastra', 'fiksi', 'cerita'],
          'Sejarah': ['sejarah', 'perang', 'masa lalu', 'kerajaan', 'kemerdekaan'],
          'Teknologi': ['komputer', 'ai', 'robot', 'internet', 'programming', 'kode'],
          'Lainnya': []
        };
        const topicHits = { 'Sains & Alam': 0, 'Fiksi & Sastra': 0, 'Sejarah': 0, 'Teknologi': 0, 'Lainnya': 0 };
        
        logsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.timestamp) {
            const dateStr = data.timestamp.toDate().toDateString();
            if (dayCounts[dateStr]) {
              dayCounts[dateStr].value += 1;
            }
          }
          
          if (data.query) {
            const q = data.query.toLowerCase();
            let matched = false;
            for (const [category, keywords] of Object.entries(topicCategories)) {
              if (keywords.some(kw => q.includes(kw))) {
                topicHits[category] += 1;
                matched = true;
                break;
              }
            }
            if (!matched) topicHits['Lainnya'] += 1;
          }
        });
        
        // Format Daily Activity ke bentuk array berurutan
        dailyActivity = Object.values(dayCounts).sort((a, b) => a.dateObj - b.dateObj).map(d => ({ day: d.day, value: d.value }));
        
        // Format Popular Topics ke persentase
        const totalTopHits = Object.values(topicHits).reduce((a, b) => a + b, 0) || 1; // hindari div by 0
        popularTopics = Object.entries(topicHits)
          .map(([label, count]) => ({
            label,
            percentage: Math.round((count / totalTopHits) * 100)
          }))
          .sort((a, b) => b.percentage - a.percentage);
      }

      return {
        generalStats: {
          totalBooks,
          totalUsers,
          totalAIInteractions,
          syncStatus: 'Sinc. SLiMS 9.4.2'
        },
        dailyActivity,
        popularTopics
      };

    } catch (e) {
      console.error("Error generating real analytics dashboard:", e);
      return MOCK_ANALYTICS; // Fallback jika gagal
    }
  },

  getPopularSearchTopics: async () => {
    try {
      const logsQuery = query(collection(db, 'ai_logs'), where('action', '==', 'search_book'), orderBy('timestamp', 'desc'), limit(100));
      const logsSnapshot = await getDocs(logsQuery);
      
      const stopWords = ['saya', 'aku', 'mencari', 'cari', 'buku', 'tentang', 'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'untuk', 'dengan', 'ada', 'apakah', 'ingin', 'mengetahui', 'tolong', 'carikan', 'informasi', 'apa', 'saja', 'yg', 'membahas', 'mengenai', 'berkaitan', 'berisi', 'menjelaskan', 'adalah', 'yaitu', 'merupakan', 'seputar', 'hal', 'dalam', 'pada', 'bagi', 'oleh', 'sebuah', 'suatu', 'beberapa', 'macam', 'jenis', 'seperti', 'serta', 'atau', 'tetapi', 'namun', 'karena', 'sebab', 'sehingga', 'maka', 'jadi', 'buat', 'bikin', 'kasih', 'beri', 'tahu', 'lihat', 'bagaimana', 'siapa', 'kapan', 'dimana', 'kenapa', 'mengapa', 'karya', 'tulis', 'penelitian', 'skripsi', 'makalah', 'jurnal', 'artikel'];
      
      const wordCounts = {};
      
      logsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.query) {
          const cleanQuery = data.query.toLowerCase().replace(/[.,?!()]/g, '');
          const words = cleanQuery.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
          words.forEach(w => {
            wordCounts[w] = (wordCounts[w] || 0) + 1;
          });
        }
      });
      
      const sortedTopics = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(item => item[0]);
        
      return sortedTopics.length > 0 ? sortedTopics : ['komputer', 'sejarah', 'fiksi'];
    } catch (e) {
      console.error("Error fetching popular topics:", e);
      return ['sains', 'teknologi', 'sastra'];
    }
  }
};
