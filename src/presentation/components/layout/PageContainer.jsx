import React from 'react';
import Navbar from './Navbar';
import './PageContainer.css';

const PageContainer = ({ children, className = '' }) => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className={`main-content container page-enter ${className}`}>
        {children}
      </main>
    </div>
  );
};

export default PageContainer;
