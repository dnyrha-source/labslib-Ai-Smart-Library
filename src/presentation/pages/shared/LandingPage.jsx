import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, Brain, BarChart2, BookOpen, ArrowRight } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-layout">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow"></div>
        <div className="hero-content">
          <div className="hero-badge animate-fade">
            <Sparkles size={14} className="badge-sparkle" />
            <span>AI-Powered Library Layer</span>
          </div>
          <div className="hero-logo-wrapper animate-slide-up">
            <img src="https://i.ibb.co.com/4wtwmWgS/Logo-bg-putih.png" alt="Labschool Logo" className="hero-logo" />
          </div>
          <h1 className="hero-title animate-slide-up">
            Gerbang Literasi Masa Depan <br />
            <span className="gradient-text">LabsLib AI Smart Library</span>
            <div className="hero-library-name">Perpustakaan Labschool Jakarta</div>
          </h1>
          <p className="hero-subtitle animate-slide-up">
            Membantu siswa memahami koleksi buku secara mendalam, mempercepat riset akademik bagi guru, dan menyajikan dasbor analitik cerdas bagi pustakawan secara real-time. Terintegrasi dengan database katalog perpustakaan
          </p>
          <div className="hero-buttons animate-slide-up">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
              icon={<ArrowRight size={18} />}
            >
              Mulai Eksplorasi
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Pelajari Fitur
            </Button>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="features-section">
        <h2 className="section-title">Fitur Unggulan LabsLib AI</h2>
        <div className="features-grid">
          <Card hoverable className="feature-card">
            <div className="feature-icon-wrapper cyan-glow">
              <Search className="feature-icon" />
            </div>
            <h3>Pencarian Cerdas AI</h3>
            <p>Temukan koleksi buku di perpustakaan menggunakan bahasa alami. AI memahami konteks pertanyaan Anda dan menyarankan referensi yang paling sesuai.</p>
          </Card>

          <Card hoverable className="feature-card">
            <div className="feature-icon-wrapper purple-glow">
              <Brain className="feature-icon" />
            </div>
            <h3>AI Summary & Analysis</h3>
            <p>Dapatkan ringkasan instan, identifikasi tema utama, penokohan penting, kata kunci, dan pesan moral dari buku pilihan Anda lewat satu klik tombol AI.</p>
          </Card>

          <Card hoverable className="feature-card">
            <div className="feature-icon-wrapper emerald-glow">
              <Sparkles className="feature-icon" />
            </div>
            <h3>Research Assistant</h3>
            <p>Asisten khusus untuk guru dan siswa. Temukan karya tulis ilmiah sekolah yang relevan dan dapatkan usulan bahan ajar berbasis koleksi perpustakaan.</p>
          </Card>

          <Card hoverable className="feature-card">
            <div className="feature-icon-wrapper rose-glow">
              <BarChart2 className="feature-icon" />
            </div>
            <h3>Dasbor Analitik</h3>
            <p>Analisis tren pembacaan buku terpopuler, statistik aktivitas pencarian AI, serta log monitoring sinkronisasi SLiMS ke Firestore secara terperinci.</p>
          </Card>
        </div>
      </section>

      {/* Target Audiences / User Roles */}
      <section className="roles-section">
        <h2 className="section-title">Akses Berdasarkan Peran</h2>
        <div className="roles-grid">
          <div className="role-box" onClick={() => navigate('/login', { state: { role: 'siswa' } })}>
            <BookOpen className="role-icon text-cyan" />
            <h4>Siswa</h4>
            <p>Eksplorasi buku, baca karya tulis ilmiah, manfaatkan ringkasan otomatis AI, dan konsultasi interaktif dengan asisten AI chat.</p>
          </div>
          <div className="role-box" onClick={() => navigate('/login', { state: { role: 'guru' } })}>
            <Sparkles className="role-icon text-purple" />
            <h4>Guru</h4>
            <p>Akses AI Research Assistant untuk memperkaya modul ajar, mencari referensi kelas.</p>
          </div>
          <div className="role-box" onClick={() => navigate('/login')}>
            <BarChart2 className="role-icon text-success" />
            <h4>Pustakawan</h4>
            <p>Monitor aktivitas harian perpustakaan, sinkronisasi data SLiMS, dan pantau topik pencarian buku paling populer di sekolah.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
