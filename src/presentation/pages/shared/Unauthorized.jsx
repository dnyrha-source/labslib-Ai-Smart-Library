import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import './Unauthorized.css';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleGoBack = () => {
    if (!profile) {
      navigate('/', { replace: true });
      return;
    }
    
    // Redirect to their dashboard
    switch (profile.role) {
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      case 'pustakawan':
        navigate('/pustakawan', { replace: true });
        break;
      case 'guru':
        navigate('/guru', { replace: true });
        break;
      case 'siswa':
      default:
        navigate('/siswa', { replace: true });
        break;
    }
  };

  return (
    <div className="unauthorized-page-container">
      <Card className="unauthorized-card" glowColor="purple">
        <div className="unauthorized-icon-wrapper">
          <ShieldAlert size={48} className="unauthorized-icon" />
        </div>
        <h2 className="unauthorized-title">Akses Ditolak</h2>
        <p className="unauthorized-desc">
          Maaf, Anda tidak memiliki izin atau hak akses yang cukup untuk melihat halaman ini. Silakan hubungi Administrator jika Anda merasa ini adalah kesalahan.
        </p>
        <Button
          variant="secondary"
          onClick={handleGoBack}
          icon={<ArrowLeft size={18} />}
        >
          Kembali ke Dasbor Anda
        </Button>
      </Card>
    </div>
  );
};

export default Unauthorized;
