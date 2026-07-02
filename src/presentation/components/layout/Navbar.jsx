import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, LogOut, BookOpen, User, Sparkles } from 'lucide-react';
import Button from '../common/Button';
import './Navbar.css';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Signout failed', err);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="role-badge badge-admin">Admin</span>;
      case 'pustakawan':
        return <span className="role-badge badge-pustakawan">Pustakawan</span>;
      case 'guru':
        return <span className="role-badge badge-guru">Guru</span>;
      case 'siswa':
      default:
        return <span className="role-badge badge-siswa">Siswa</span>;
    }
  };

  // Define navigation links based on user role
  const getNavLinks = () => {
    if (!profile) return [];
    
    switch (profile.role) {
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin' },
          { name: 'User Manager', path: '/admin/users' }
        ];
      case 'pustakawan':
        return [
          { name: 'Dashboard', path: '/pustakawan' },
          { name: 'SLiMS Sync', path: '/pustakawan/sync' }
        ];
      case 'guru':
        return [
          { name: 'Dashboard', path: '/guru' },
          { name: 'Research Assistant', path: '/guru/research-assistant' }
        ];
      case 'siswa':
      default:
        return [
          { name: 'Dashboard', path: '/siswa' },
          { name: 'Cari Buku', path: '/siswa/books' },
          { name: 'Karya Tulis', path: '/siswa/research' },
          { name: 'AI Chat', path: '/siswa/chat' },
          { name: 'Favorit', path: '/siswa/favorites' }
        ];
    }
  };

  const navLinks = getNavLinks();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar-container glass-panel">
      <div className="navbar-content">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <img src="https://i.ibb.co.com/4wtwmWgS/Logo-bg-putih.png" alt="LabsLib Logo" className="brand-icon-img" />
          <div className="brand-text-container">
            <div className="brand-title-row">
              <span className="brand-name">
                Labs<span className="brand-accent">Lib</span>
              </span>
              <span className="brand-subtext animate-float">AI</span>
            </div>
            <span className="brand-subtitle">Perpustakaan Labschool Jakarta</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        {user && (
          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className={`nav-link ${isActive(link.path) ? 'nav-link-active' : ''}`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* User Info & Actions */}
        <div className="navbar-actions">
          {user ? (
            <div className="user-profile-menu">
              <div className="user-info-text">
                <span className="user-name">{profile?.displayName || user.displayName || 'Pengguna'}</span>
                {profile && getRoleBadge(profile.role)}
              </div>
              
              <div className="avatar-wrapper">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="user-avatar" />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={18} />
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                icon={<LogOut size={16} />}
                className="logout-btn"
              >
                Keluar
              </Button>
            </div>
          ) : (
            location.pathname !== '/login' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/login')}
                icon={<Sparkles size={16} />}
              >
                Masuk
              </Button>
            )
          )}

          {/* Mobile Menu Button */}
          {user && (
            <button className="mobile-menu-toggle" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {user && isOpen && (
        <div className="mobile-nav-drawer glass-panel">
          <ul className="mobile-links">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className={`mobile-link ${isActive(link.path) ? 'mobile-link-active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            <li className="mobile-logout-item">
              <button onClick={handleLogout} className="mobile-logout-btn">
                <LogOut size={18} />
                <span>Keluar</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
