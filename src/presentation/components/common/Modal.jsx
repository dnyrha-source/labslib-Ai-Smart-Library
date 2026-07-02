import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Card from './Card';
import './Modal.css';

const Modal = ({
  isOpen,
  onClose,
  title = '',
  children,
  className = ''
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop animate-fade">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content-container animate-slide-up">
        <Card className={`modal-card ${className}`}>
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            {onClose && (
              <button className="modal-close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            )}
          </div>
          <div className="modal-body">
            {children}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Modal;
