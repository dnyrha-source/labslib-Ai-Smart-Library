import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, Mail, Lock, User, LogIn, Key } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import './Login.css';

const Login = () => {
  const { user, profile, loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Secret query parameter to reveal Pustakawan role
  const queryParams = new URLSearchParams(location.search);
  const isSecretAdmin = queryParams.get('secret') === 'admin';
  
  // Ensure default role doesn't accidentally set to pustakawan for public users
  let initialRole = location.state?.role || 'siswa';
  if (initialRole === 'pustakawan' && !isSecretAdmin) {
    initialRole = 'siswa';
  }
  const [role, setRole] = useState(initialRole);

  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('info');

  // Handle redirect if user is already authenticated
  useEffect(() => {
    if (user && profile) {
      redirectByRole(profile.role);
    }
  }, [user, profile]);

  const redirectByRole = (userRole) => {
    switch (userRole) {
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Harap isi semua kolom wajib!', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        if (!displayName) {
          showToast('Harap isi nama tampilan Anda!', 'error');
          setIsLoading(false);
          return;
        }
        await registerWithEmail(email, password, displayName, role);
        showToast('Pendaftaran berhasil!', 'success');
      } else {
        await loginWithEmail(email, password);
        showToast('Login berhasil!', 'success');
      }
    } catch (err) {
      console.error(err);
      let errorFriendly = 'Terjadi kesalahan. Silakan coba lagi.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorFriendly = 'Email atau password salah!';
      } else if (err.code === 'auth/email-already-in-use') {
        errorFriendly = 'Email sudah digunakan oleh akun lain!';
      } else if (err.code === 'auth/weak-password') {
        errorFriendly = 'Password terlalu lemah (minimal 6 karakter)!';
      }
      showToast(errorFriendly, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle(role);
      showToast('Masuk dengan Google berhasil!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal masuk dengan Google.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToastMsg(message);
    setToastType(type);
  };

  return (
    <div className="login-page-container">
      <div className="login-glow"></div>
      
      {toastMsg && (
        <div className="login-toast-container">
          <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
        </div>
      )}

      <Card className="login-card" glowColor="cyan">
        <div className="login-card-header">
          <h2 className="login-title">
            {isRegister ? 'Daftar Akun Baru' : 'Masuk ke LabsLib'}
          </h2>
          <p className="login-subtitle">
            {isRegister ? 'Isi data diri untuk mulai memanfaatkan asisten AI' : 'Gunakan akun Anda untuk masuk ke sistem perpustakaan'}
          </p>
        </div>

        <form onSubmit={handleEmailSubmit} className="login-form">
          {isRegister && (
            <Input
              label="Nama Lengkap"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              icon={<User size={18} />}
              required
            />
          )}

          <Input
            label="Alamat Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@sekolah.sch.id"
            icon={<Mail size={18} />}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock size={18} />}
            required
          />

          <div className="role-selector-container">
              <span className="selector-label">Peran Anda (Role)</span>
              <div className="role-options">
                <label className={`role-option-btn ${role === 'siswa' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="siswa"
                    checked={role === 'siswa'}
                    onChange={() => setRole('siswa')}
                  />
                  Siswa
                </label>
                <label className={`role-option-btn ${role === 'guru' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="guru"
                    checked={role === 'guru'}
                    onChange={() => setRole('guru')}
                  />
                  Guru
                </label>
                {isSecretAdmin && (
                  <label className={`role-option-btn ${role === 'pustakawan' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="pustakawan"
                      checked={role === 'pustakawan'}
                      onChange={() => setRole('pustakawan')}
                    />
                    Pustakawan
                  </label>
                )}
              </div>
            </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
            icon={<LogIn size={18} />}
          >
            {isRegister ? 'Daftar Sekarang' : 'Masuk Sekarang'}
          </Button>
        </form>

        <div className="login-divider">
          <span>atau</span>
        </div>

        <Button
          variant="secondary"
          onClick={handleGoogleSubmit}
          className="w-full google-btn"
          disabled={isLoading}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
          }
        >
          Masuk dengan Google
        </Button>

        <div className="login-footer">
          <button onClick={() => setIsRegister(!isRegister)} className="toggle-auth-mode-btn">
            {isRegister ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar di sini'}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
