import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../core/firebase';
import { authService } from '../../data/services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setError(null);
      
      if (currentUser) {
        setUser(currentUser);
        try {
          const userProfile = await authService.getUserProfile(currentUser.uid);
          setProfile(userProfile);
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setError("Gagal memuat profil pengguna.");
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.loginWithEmail(email, password);
      setUser(result.user);
      setProfile(result.profile);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email, password, displayName, role) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.registerWithEmail(email, password, displayName, role);
      setUser(result.user);
      setProfile(result.profile);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (role) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.loginWithGoogle(role);
      setUser(result.user);
      setProfile(result.profile);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setProfile(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    loading,
    error,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    isAdmin: profile?.role === 'admin',
    isLibrarian: profile?.role === 'pustakawan',
    isTeacher: profile?.role === 'guru',
    isStudent: profile?.role === 'siswa'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
};
