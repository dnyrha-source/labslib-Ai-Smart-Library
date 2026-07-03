import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, Database, Users, MessageSquare, RefreshCw, BarChart2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageContainer from '../../components/layout/PageContainer';
import { analyticsService } from '../../../data/services/analytics.service';
import './LibrarianDashboard.css';

const LibrarianDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchMetrics = async () => {
      try {
        const metrics = await analyticsService.getDashboardMetrics();
        if (active) {
          setData(metrics);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchMetrics();
    return () => {
      active = false;
    };
  }, []);

  // Show a premium glass loader while fetching data
  if (loading) {
    return (
      <PageContainer className="librarian-dashboard-container">
        <div 
          className="loading-container glass-panel" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '400px', 
            gap: '16px' 
          }}
        >
          <RefreshCw className="text-cyan animate-spin-slow" size={48} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1rem', letterSpacing: '0.05em' }}>
            Memuat Data Analitik...
          </p>
        </div>
      </PageContainer>
    );
  }

  // Dynamic stats
  const stats = [
    { 
      title: 'Total Buku (Firestore)', 
      value: data?.generalStats?.totalBooks ? data.generalStats.totalBooks.toLocaleString('id-ID') : '0', 
      icon: <BookOpen className="text-cyan" />, 
      desc: 'Buku tersinkronisasi' 
    },
    { 
      title: 'Pengguna Terdaftar', 
      value: data?.generalStats?.totalUsers ? data.generalStats.totalUsers.toLocaleString('id-ID') : '0', 
      icon: <Users className="text-purple" />, 
      desc: 'Siswa, Guru, Staf' 
    },
    { 
      title: 'Interaksi AI', 
      value: data?.generalStats?.totalAIInteractions ? data.generalStats.totalAIInteractions.toLocaleString('id-ID') : '0', 
      icon: <MessageSquare className="text-emerald" />, 
      desc: 'Summary & Chat' 
    },
    { 
      title: 'Status Sinkronisasi', 
      value: data?.generalStats?.syncStatus || 'Belum Sinkron', 
      icon: <Database className="text-rose" />, 
      desc: 'Sinc. SLiMS 9.4.2' 
    }
  ];

  // Hitung nilai tertinggi untuk presentase grafik aktivitas harian
  const dailyValues = data?.dailyActivity || [];
  const maxActivityValue = dailyValues.length > 0 ? Math.max(...dailyValues.map(d => d.value)) : 100;

  return (
    <PageContainer className="librarian-dashboard-container">
      {/* Welcome Banner */}
      <section className="welcome-banner glass-panel banner-cyan">
        <div className="welcome-content">
          <div className="welcome-badge badge-cyan">
            <Sparkles size={14} />
            <span>Portal Pustakawan LabsLib</span>
          </div>
          <h1 className="welcome-title">
            Dasbor Analitik, <span className="gradient-text">{profile?.displayName || 'Pustakawan'}</span>
          </h1>
          <p className="welcome-subtitle">
            Kendalikan sinkronisasi metadata perpustakaan SLiMS 9.4.2, pantau kinerja interaksi asisten AI, dan analisis minat baca civitas akademika Labschool.
          </p>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <Card key={idx} className="stat-card" hoverable>
            <div className="stat-icon-row">
              {stat.icon}
              <span className="stat-number">{stat.value}</span>
            </div>
            <div className="stat-text">
              <h4>{stat.title}</h4>
              <p>{stat.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Sync Manager Section (Full Width) */}
      <div className="sync-section">
        <Card className="sync-card" glowColor="cyan">
          <div className="sync-info">
            <div className="card-header-icon" style={{ marginBottom: '8px' }}>
              <RefreshCw size={22} className="text-cyan animate-spin-slow" />
              <h3>Sinkronisasi Database SLiMS</h3>
            </div>
            <p className="card-desc" style={{ margin: 0 }}>
              Ambil metadata bibliografi dari master database SLiMS 9.4.2 lokal ke server cloud Firestore secara instan.
              Memastikan katalog buku digital civitas akademika LabsLib selalu sinkron dan diperbarui secara *real-time*.
            </p>
          </div>
          <div className="sync-action">
            <Button
              variant="primary"
              onClick={() => navigate('/pustakawan/sync')}
              icon={<RefreshCw size={16} />}
            >
              Buka Sync Manager
            </Button>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Popular Topics - Horizontal Bar Chart */}
        <Card className="chart-card-wrapper" hoverable>
          <div className="card-header-icon">
            <BarChart2 size={22} className="text-purple" />
            <h3>Topik Populer (Gemini AI)</h3>
          </div>
          <p className="card-desc">
            Topik pencarian buku berbasis bahasa alami yang paling sering diajukan ke Gemini AI oleh siswa di LabsLib.
          </p>
          
          <div className="horizontal-bar-chart">
            {data?.popularTopics.map((topic, index) => (
              <div key={index} className="horizontal-bar-item">
                <div className="bar-info">
                  <span className="bar-label">{topic.label}</span>
                  <span className="bar-value">{topic.percentage}%</span>
                </div>
                <div className="bar-track">
                  <div 
                    className="bar-fill bg-gradient-purple" 
                    style={{ width: `${topic.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Daily Activity - Vertical Bar Chart */}
        <Card className="chart-card-wrapper" hoverable>
          <div className="card-header-icon">
            <BarChart2 size={22} className="text-emerald" />
            <h3>Aktivitas Harian Siswa</h3>
          </div>
          <p className="card-desc">
            Tren volume interaksi asisten AI (Pencarian Rekomendasi & Tanya Jawab) selama 7 hari terakhir.
          </p>
          
          <div className="vertical-chart-outer">
            <div className="vertical-bar-chart-container">
              <div className="vertical-bar-chart">
                {data?.dailyActivity.map((activity, index) => {
                  const heightPercent = maxActivityValue > 0 ? (activity.value / maxActivityValue) * 100 : 0;
                  return (
                    <div key={index} className="vertical-bar-item">
                      <div className="vertical-bar-wrapper">
                        <div className="vertical-bar-tooltip">{activity.value} Kueri</div>
                        <div 
                          className="vertical-bar-fill bg-gradient-emerald" 
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="vertical-bar-label">{activity.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default LibrarianDashboard;
