/**
 * BookCard.jsx
 * Komponen card buku yang reusable dengan animasi hover premium
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Calendar, MapPin, CheckCircle, Clock, XCircle } from 'lucide-react';
import './BookCard.css';

const AVAILABILITY_CONFIG = {
  available: {
    label: 'Tersedia',
    icon: CheckCircle,
    className: 'badge-available',
  },
  borrowed: {
    label: 'Dipinjam',
    icon: XCircle,
    className: 'badge-borrowed',
  },
  reserved: {
    label: 'Dipesan',
    icon: Clock,
    className: 'badge-reserved',
  },
};

const BookCard = ({ book, index = 0 }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  
  if (!book) return null;

  const availability = AVAILABILITY_CONFIG[book.availability] || AVAILABILITY_CONFIG.available;
  const AvailIcon = availability.icon;

  const handleClick = () => {
    navigate(`/siswa/books/${book.biblio_id}`);
  };

  // Generate warna aksen dari biblio_id untuk konsistensi visual
  const accentColors = ['cyan', 'purple', 'emerald', 'rose'];
  const accentColor = accentColors[index % accentColors.length];

  // Safely parse subjects into an array to avoid map() errors
  const subjects = Array.isArray(book.subject) 
    ? book.subject 
    : (typeof book.subject === 'string' && book.subject.trim() !== '' 
        ? book.subject.split(',').map(s => s.trim()) 
        : []);

  return (
    <article
      className={`book-card glass-panel accent-${accentColor}`}
      onClick={handleClick}
      style={{ animationDelay: `${index * 60}ms` }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Lihat detail: ${book.title}`}
    >
      {/* Cover Area */}
      <div className="book-card-cover">
        {book.cover_image && !imgError ? (
          <img
            src={book.cover_image}
            alt={`Cover ${book.title}`}
            className="book-cover-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`book-cover-placeholder cover-${accentColor}`}>
            <BookOpen size={32} />
            <span className="book-cover-call-number">{book.call_number}</span>
          </div>
        )}

        {/* Availability Badge */}
        <div className={`availability-badge ${availability.className}`}>
          <AvailIcon size={12} />
          <span>{availability.label}</span>
        </div>
      </div>

      {/* Book Info */}
      <div className="book-card-body">
        {/* Subjects */}
        {subjects.length > 0 && (
          <div className="book-subjects">
            {subjects.slice(0, 2).map((s, i) => (
              <span key={i} className="subject-chip">
                {s}
              </span>
            ))}
            {subjects.length > 2 && (
              <span className="subject-chip subject-chip-more">
                +{subjects.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="book-card-title" title={book.title}>
          {book.title}
        </h3>

        {/* Meta Info */}
        <div className="book-card-meta">
          <div className="book-meta-item">
            <User size={13} />
            <span>{book.author}</span>
          </div>
          <div className="book-meta-row">
            <div className="book-meta-item">
              <Calendar size={13} />
              <span>{book.year}</span>
            </div>
            <div className="book-meta-item">
              <MapPin size={13} />
              <span>{book.location?.split(' - ')[0] || 'Perpustakaan'}</span>
            </div>
          </div>
        </div>

        {/* Publisher */}
        <p className="book-card-publisher">{book.publisher}</p>
      </div>

      {/* Hover Arrow */}
      <div className="book-card-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </article>
  );
};

export default BookCard;
