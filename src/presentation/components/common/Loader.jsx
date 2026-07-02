import React from 'react';
import './Loader.css';

const Loader = ({
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'cyan', // 'cyan' | 'purple' | 'emerald'
  label = '',
  type = 'spinner', // 'spinner' | 'dots'
  className = ''
}) => {
  return (
    <div className={`loader-container ${className}`}>
      {type === 'spinner' ? (
        <div className={`spinner spinner-${size} spinner-${variant}`}>
          <svg viewBox="0 0 50 50">
            <circle
              className="path"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="5"
            ></circle>
          </svg>
        </div>
      ) : (
        <div className={`dots-loader dots-${size} dots-${variant}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
      {label && <span className={`loader-label label-${variant}`}>{label}</span>}
    </div>
  );
};

export default Loader;
