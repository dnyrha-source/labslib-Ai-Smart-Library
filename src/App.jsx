import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './presentation/contexts/AuthContext';
import AppRouter from './presentation/router';
import './presentation/styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
