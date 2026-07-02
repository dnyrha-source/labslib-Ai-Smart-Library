import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import './Toast.css';

const Toast = ({
  message,
  type = 'info', // 'success' | 'error' | 'info'
  duration = 4000,
  onClose
}) => {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="toast-icon text-success" size={20} />;
      case 'error':
        return <AlertTriangle className="toast-icon text-error" size={20} />;
      case 'info':
      default:
        return <Info className="toast-icon text-info" size={20} />;
    }
  };

  return (
    <div className={`toast-box glass-panel toast-${type} animate-slide-right`}>
      <div className="toast-content">
        {getIcon()}
        <span className="toast-message">{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="toast-close-btn">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;
