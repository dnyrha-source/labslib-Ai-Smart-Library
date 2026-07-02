import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, Users, Activity, Settings, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PageContainer from '../../components/layout/PageContainer';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <PageContainer className="admin-dashboard-container">
      {/* Welcome Banner */}
      <section className="welcome-banner glass-panel banner-rose">
        <div className="welcome-content">
          <div className="welcome-badge badge-rose">
            <Sparkles size={14} />
            <span>Portal Admin LabsLib</span>
          </div>
          <h1 className="welcome-title">
            Selamat Datang, Master <span className="gradient-text-rose">{profile?.displayName || 'Admin'}</span>
          </h1>
          <p className="welcome-subtitle">
            Kelola izin pengguna perpustakaan, monitor jalannya integrasi sinkronisasi, dan awasi status keamanan log sistem LabsLib secara global.
          </p>
        </div>
      </section>

      {/* Admin Modules */}
      <div className="dashboard-grid">
        {/* User Manager Card */}
        <Card className="dashboard-card" glowColor="purple">
          <div className="card-header-icon">
            <Users size={24} className="text-purple" />
            <h3>Pengelolaan Pengguna</h3>
          </div>
          <p className="card-desc">
            Lihat daftar pengguna yang terdaftar di sistem. Ubah peran (role) siswa menjadi guru, pustakawan, atau administrator lain untuk memberikan hak akses yang sesuai.
          </p>
          <div className="tool-cta">
            <Button
              variant="primary"
              onClick={() => navigate('/admin/users')}
              icon={<Users size={16} />}
              style={{ background: 'var(--color-purple)', color: 'var(--text-primary)' }}
            >
              Kelola Pengguna
            </Button>
          </div>
        </Card>

        {/* System Monitoring Card */}
        <Card className="dashboard-card" hoverable>
          <div className="card-header-icon">
            <Activity size={22} className="text-cyan" />
            <h3>Log Sistem & Keamanan</h3>
          </div>
          <p className="card-desc">
            Monitor aktivitas sinkronisasi dan interaksi API Gemini secara real-time untuk memastikan kestabilan aplikasi dan memantau error.
          </p>
          <div className="tool-cta">
            <Button
              variant="secondary"
              onClick={() => showUnderDevelopment()}
              icon={<Activity size={16} />}
            >
              Lihat System Logs
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );

  function showUnderDevelopment() {
    alert("Fitur Log Sistem dalam tahap pengembangan. Akan dirilis pada Sprint 4.");
  }
};

export default AdminDashboard;
