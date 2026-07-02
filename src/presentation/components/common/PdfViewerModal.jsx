import React from 'react';
import { X, Smartphone } from 'lucide-react';
import './PdfViewerModal.css';

const PdfViewerModal = ({ isOpen, onClose, document }) => {
  if (!isOpen || !document) return null;

  return (
    <div className="pdf-modal-overlay">
      <div className="pdf-modal-container">
        {/* Header */}
        <div className="pdf-modal-header">
          <h2 className="pdf-modal-title">Dokumen Pratinjau</h2>
          <button className="pdf-modal-close" onClick={onClose} aria-label="Tutup">
            <X size={24} />
          </button>
        </div>

        {/* Content Area - ANTI COPAS */}
        <div 
          className="pdf-modal-content anti-copas"
          onContextMenu={(e) => e.preventDefault()}
        >
          {document.pdf_url ? (
            <div className="pdf-iframe-container">
              <iframe 
                src={`${document.pdf_url}#toolbar=0&navpanes=0&scrollbar=0`}
                className="pdf-iframe"
                title={document.title}
              />
              {/* Kaca pelindung anti-copas */}
              <div className="pdf-iframe-overlay" />
            </div>
          ) : (
            <div className="simulated-paper">
              {/* Watermark */}
            <div className="watermark">
              LABSCHOOL JAKARTA
            </div>

            {/* Paper Content */}
            <div className="paper-header">
              <h1 className="paper-title">{document.title}</h1>
              <p className="paper-author">Oleh: {document.author}</p>
              <p className="paper-year">Tahun: {document.year}</p>
            </div>

            <div className="paper-body">
              <h3 className="paper-section-title">ABSTRAK</h3>
              <p className="paper-abstract">
                {document.abstract || 'Abstrak tidak tersedia untuk dokumen ini.'}
              </p>
              
              {document.keywords && document.keywords.length > 0 && (
                <div className="paper-keywords">
                  <strong>Kata Kunci: </strong>
                  {document.keywords.join(', ')}
                </div>
              )}
            </div>
            
            <div className="paper-footer">
              -- Halaman 1 --
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfViewerModal;
