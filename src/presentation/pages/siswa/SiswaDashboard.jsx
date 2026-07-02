import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, Search, BookOpen, Star, Clock } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import PageContainer from '../../components/layout/PageContainer';
import { bookService } from '../../../data/services/book.service';
import { analyticsService } from '../../../data/services/analytics.service';
import './SiswaDashboard.css';

const SiswaDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [recommended, setRecommended] = useState([]);
  const [popular, setPopular] = useState([]);
  const [recentFavs, setRecentFavs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const books = await bookService.getAllBooks(100);
        
        // Rekomendasi (acak 2 buku)
        const shuffled = [...books].sort(() => 0.5 - Math.random());
        setRecommended(shuffled.slice(0, 2));

        // Topik Pencarian Populer (Berdasarkan Log AI nyata di Firestore)
        const topics = await analyticsService.getPopularSearchTopics();
        setPopular(topics);

        // Aktivitas: Buku Favorit (dari localStorage)
        const favIds = JSON.parse(localStorage.getItem('labslib_favorites') || '[]');
        const favBooks = favIds.map(id => books.find(b => b.biblio_id === id)).filter(Boolean);
        setRecentFavs(favBooks.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleQuickSearch = () => {
    if (searchQuery.trim()) {
      navigate('/siswa/books', { state: { initialQuery: searchQuery } });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleQuickSearch();
    }
  };

  return (
    <PageContainer className="siswa-dashboard-container">
      {/* Welcome Banner */}
      <section className="welcome-banner glass-panel">
        <div className="welcome-content">
          <div className="welcome-badge">
            <Sparkles size={14} />
            <span>Portal Siswa LabsLib</span>
          </div>
          <h1 className="welcome-title">
            Selamat Datang Kembali, <span className="gradient-text">{profile?.displayName || 'Siswa'}</span>!
          </h1>
          <p className="welcome-subtitle">
            Aplikasi pendamping perpustakaan berbasis kecerdasan buatan. Cari referensi tugas, dapatkan ringkasan AI, dan konsultasikan tugas akademik Anda langsung dengan AI Smart Assistant.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Quick Search */}
        <Card className="dashboard-card main-search-card" glowColor="cyan">
          <div className="card-header-icon">
            <Search size={22} className="text-cyan" />
            <h3>Pencarian Pintar</h3>
          </div>
          <p className="card-desc">Tulis pertanyaan Anda secara alami untuk mencari buku perpustakaan (contoh: <i>"Buku apa saja yang membahas astronomi tata surya?"</i>)</p>
          <div className="quick-search-box">
            <Input
              placeholder="Ketik pertanyaan atau judul buku..."
              className="quick-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button variant="primary" onClick={handleQuickSearch}>Cari AI</Button>
          </div>
        </Card>

        {/* AI Recommendations */}
        <Card className="dashboard-card" hoverable>
          <div className="card-header-icon">
            <Sparkles size={22} className="text-purple" />
            <h3>Rekomendasi Cerdas</h3>
          </div>
          <p className="card-desc">Rekomendasi buku yang dirancang khusus berdasarkan kegemaran membaca Anda.</p>
          {loading ? (
            <div className="ai-rec-placeholder"><p>Memuat rekomendasi...</p></div>
          ) : recommended.length > 0 ? (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              {recommended.map(b => (
                <div key={b.biblio_id} style={{ cursor: 'pointer', flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', transition: 'all 0.2s ease' }} onClick={() => navigate(`/siswa/books/${b.biblio_id}`)}>
                  <h4 style={{ fontSize: '1.05rem', margin: '0 0 6px 0', color: 'var(--color-cyan)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>{b.author}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="ai-rec-placeholder">
              <Sparkles className="placeholder-sparkle animate-float" size={32} />
              <p>Fitur Recommendation akan aktif setelah ada lebih banyak data.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Lists Section */}
      <div className="lists-grid">
        <div className="list-panel">
          <div className="list-panel-header">
            <Star size={18} className="text-cyan" />
            <h3>Topik Populer Saat Ini</h3>
          </div>
          {loading ? (
            <div className="empty-list-placeholder glass-panel"><p>Memuat topik populer...</p></div>
          ) : popular.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '1rem' }}>
              {popular.map((topic, i) => (
                <div key={i} className="glass-panel" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.8rem 1.2rem', gap: '0.6rem', cursor: 'pointer', borderRadius: '24px', backgroundColor: 'rgba(0, 200, 255, 0.05)', border: '1px solid rgba(0, 200, 255, 0.2)' }} onClick={() => navigate('/siswa/books', { state: { initialQuery: topic } })}>
                   <Search size={14} className="text-cyan" />
                   <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{topic}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-list-placeholder glass-panel">
              <BookOpen size={24} className="text-muted" />
              <p>Data topik populer belum tersedia. Menunggu interaksi pencarian siswa.</p>
            </div>
          )}
        </div>

        {/* Recent History */}
        <div className="list-panel">
          <div className="list-panel-header">
            <Clock size={18} className="text-purple" />
            <h3>Aktivitas Terakhir Anda</h3>
          </div>
          {loading ? (
            <div className="empty-list-placeholder glass-panel"><p>Memuat aktivitas...</p></div>
          ) : recentFavs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
              {recentFavs.map((b) => (
                <div key={b.biblio_id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '1rem', gap: '1rem', cursor: 'pointer', borderRadius: '12px' }} onClick={() => navigate(`/siswa/books/${b.biblio_id}`)}>
                   <Star size={20} className="text-purple" style={{ minWidth: '20px' }} />
                   <div>
                     <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Disimpan ke Favorit</div>
                     <div style={{ fontWeight: '600' }}>{b.title}</div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-list-placeholder glass-panel">
              <Clock size={24} className="text-muted" />
              <p>Belum ada aktivitas membaca atau favorit. Ayo jelajahi perpustakaan sekarang!</p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default SiswaDashboard;
