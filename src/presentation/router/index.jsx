import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Pages
import LandingPage from '../pages/shared/LandingPage';
import Login from '../pages/shared/Login';
import Unauthorized from '../pages/shared/Unauthorized';

// Siswa Pages
import SiswaDashboard from '../pages/siswa/SiswaDashboard';
import BookSearch from '../pages/siswa/BookSearch';
import BookDetail from '../pages/siswa/BookDetail';
import ResearchSearch from '../pages/siswa/ResearchSearch';
import AIChat from '../pages/siswa/AIChat';
import Favorites from '../pages/siswa/Favorites';

// Guru Pages
import GuruDashboard from '../pages/guru/GuruDashboard';
import AIResearchAssistant from '../pages/guru/AIResearchAssistant';

// Pustakawan Pages
import LibrarianDashboard from '../pages/pustakawan/LibrarianDashboard';
import SlimsSyncManager from '../pages/pustakawan/SlimsSyncManager';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManager from '../pages/admin/UserManager';

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Siswa Portal (Protected) - Dasbor khusus Siswa */}
      <Route element={<ProtectedRoute allowedRoles={['siswa']} />}>
        <Route path="/siswa" element={<SiswaDashboard />} />
        <Route path="/siswa/favorites" element={<Favorites />} />
      </Route>

      {/* Shared Tools (Protected) - Bisa diakses Siswa, Guru, dan Pustakawan */}
      <Route element={<ProtectedRoute allowedRoles={['siswa', 'guru', 'pustakawan']} />}>
        <Route path="/siswa/books" element={<BookSearch />} />
        <Route path="/siswa/books/:id" element={<BookDetail />} />
        <Route path="/siswa/research" element={<ResearchSearch />} />
        <Route path="/siswa/chat" element={<AIChat />} />
      </Route>

      {/* Guru Portal (Protected) */}
      <Route element={<ProtectedRoute allowedRoles={['guru']} />}>
        <Route path="/guru" element={<GuruDashboard />} />
        <Route path="/guru/research-assistant" element={<AIResearchAssistant />} />
      </Route>

      {/* Pustakawan Portal (Protected) */}
      <Route element={<ProtectedRoute allowedRoles={['pustakawan']} />}>
        <Route path="/pustakawan" element={<LibrarianDashboard />} />
        <Route path="/pustakawan/sync" element={<SlimsSyncManager />} />
      </Route>

      {/* Admin Portal (Protected) */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManager />} />
      </Route>

      {/* Fallback Catch-all -> Redirect to Landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
