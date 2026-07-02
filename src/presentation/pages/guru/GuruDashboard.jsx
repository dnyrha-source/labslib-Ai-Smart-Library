import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, Brain, Search, BookOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageContainer from '../../components/layout/PageContainer';
import './GuruDashboard.css';

const GuruDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <PageContainer className="guru-dashboard-container">
      {/* Welcome Banner */}
      <section className="welcome-banner glass-panel banner-purple">
        <div className="welcome-content">
          <div className="welcome-badge badge-purple">
            <Sparkles size={14} />
            <span>Portal Guru LabsLib</span>
          </div>
          <h1 className="welcome-title">
            Selamat Datang, Bapak/Ibu <span className="gradient-text-purple">{profile?.displayName || 'Guru'}</span>!
          </h1>
          <p className="welcome-subtitle">
            Gunakan kekuatan Gemini AI untuk mengolah modul ajar, menelusuri karya ilmiah siswa Labschool, dan merumuskan referensi pengajaran terbaik secara terintegrasi.
          </p>
        </div>
      </section>

      {/* Main Tools Grid */}
      <div className="dashboard-grid">
        {/* Research Assistant Intro */}
        <Card className="dashboard-card" glowColor="purple">
          <div className="card-header-icon">
            <Brain size={24} className="text-purple" />
            <h3>AI Research Assistant</h3>
          </div>
          <p className="card-desc">
            Asisten riset pintar Anda. Bantu rancang pertanyaan ujian, temukan buku pustaka pendukung kurikulum, serta bandingkan abstrak karya tulis ilmiah siswa untuk mendukung pengajaran Anda.
          </p>
          <div className="tool-cta">
            <Button
              variant="primary"
              onClick={() => navigate('/guru/research-assistant')}
              icon={<Sparkles size={16} />}
              style={{ background: 'var(--color-purple)', color: 'var(--text-primary)' }}
            >
              Buka Research Assistant
            </Button>
          </div>
        </Card>

        {/* Quick Search */}
        <Card className="dashboard-card" hoverable>
          <div className="card-header-icon">
            <Search size={22} className="text-cyan" />
            <h3>Pencarian Cepat SLiMS</h3>
          </div>
          <p className="card-desc">Menelusuri database hasil sinkronisasi buku dan karya ilmiah siswa di sekolah secara instan.</p>
          <div className="quick-search-box">
            <Button variant="secondary" onClick={() => navigate('/siswa/books')} className="w-full">
              Cari Buku Perpustakaan
            </Button>
            <Button variant="secondary" onClick={() => navigate('/siswa/research')} className="w-full">
              Cari Karya Tulis Siswa
            </Button>
          </div>
        </Card>
      </div>

      {/* History / Recent Activity */}
      <div className="list-panel">
        <div className="list-panel-header">
          <Clock size={18} className="text-purple" />
          <h3>Riwayat Asisten Riset Anda</h3>
        </div>
        <div className="empty-list-placeholder glass-panel">
          <Clock size={24} className="text-muted" />
          <p>Belum ada riwayat aktivitas riset AI. Eksplorasi referensi akademik menggunakan AI untuk memulainya.</p>
        </div>
      </div>
    </PageContainer>
  );
};

export default GuruDashboard;
