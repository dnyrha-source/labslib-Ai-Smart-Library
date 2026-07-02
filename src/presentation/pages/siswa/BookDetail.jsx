/**
 * BookDetail.jsx
 * Halaman detail buku lengkap dengan panel AI Summary (Gemini)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  User,
  Building,
  Calendar,
  Hash,
  MapPin,
  Tag,
  Sparkles,
  Heart,
  CheckCircle,
  XCircle,
  Clock,
  BookMarked,
  Languages,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import BookCard from '../../components/common/BookCard';
import Button from '../../components/common/Button';
import { bookService } from '../../../data/services/book.service';
import { geminiService } from '../../../data/services/gemini.service';
import './BookDetail.css';

/* ─── Availability Config ─── */
const AVAILABILITY_CONFIG = {
  available: {
    label: 'Tersedia untuk Dipinjam',
    icon: CheckCircle,
    className: 'avail-available',
    color: 'var(--color-emerald)',
  },
  borrowed: {
    label: 'Sedang Dipinjam',
    icon: XCircle,
    className: 'avail-borrowed',
    color: 'var(--color-rose)',
  },
  reserved: {
    label: 'Sudah Dipesan',
    icon: Clock,
    className: 'avail-reserved',
    color: 'hsl(40,95%,65%)',
  },
};

/* ─── Typewriter Effect ─── */
const TypewriterText = ({ text }) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 8);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className={`ai-summary-text ${done ? 'summary-done' : 'summary-typing'}`}>
      {displayed}
      {!done && <span className="typing-cursor">|</span>}
    </p>
  );
};

/* ─── Info Row ─── */
const InfoRow = ({ icon: Icon, label, value, accent }) => (
  <div className="info-row">
    <div className="info-icon" style={{ color: accent || 'var(--color-cyan)' }}>
      <Icon size={16} />
    </div>
    <div className="info-content">
      <span className="info-label">{label}</span>
      <span className="info-value">{value || '—'}</span>
    </div>
  </div>
);

/* ─── Main Component ─── */
const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryError, setSummaryError] = useState(null);
  const [summaryGenerated, setSummaryGenerated] = useState(false);

  const [relatedBooks, setRelatedBooks] = useState([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);

  /* Load buku dari service */
  useEffect(() => {
    const fetchBook = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await bookService.getBookById(id);
        if (!data) {
          setError('Buku tidak ditemukan.');
        } else {
          setBook(data);

          // Cek favorit di localStorage
          const favs = JSON.parse(localStorage.getItem('labslib_favorites') || '[]');
          setIsFavorite(favs.includes(data.biblio_id));
        }
      } catch (err) {
        setError('Gagal memuat detail buku. Silakan coba lagi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  /* Load buku terkait setelah buku utama berhasil dimuat */
  useEffect(() => {
    if (!book) return;
    const loadRelated = async () => {
      setIsRelatedLoading(true);
      try {
        const allBooks = await bookService.getAllBooks(50);
        const related = await geminiService.getRelatedBooks(book, allBooks);
        setRelatedBooks(related);
      } catch {
        // Related books optional — fail silently
        setRelatedBooks([]);
      } finally {
        setIsRelatedLoading(false);
      }
    };
    loadRelated();
  }, [book]);

  /* Generate AI Summary */
  const handleGenerateSummary = useCallback(async () => {
    if (!book || isSummaryLoading) return;
    setIsSummaryLoading(true);
    setSummaryError(null);
    setSummaryText('');
    setSummaryGenerated(false);
    try {
      const summary = await geminiService.generateBookSummary(book);
      setSummaryText(summary);
      setSummaryGenerated(true);
    } catch (err) {
      setSummaryError(`Gagal membuat ringkasan: ${err.message}`);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [book, isSummaryLoading]);

  /* Toggle Favorit */
  const handleToggleFavorite = useCallback(() => {
    if (!book) return;
    const favs = JSON.parse(localStorage.getItem('labslib_favorites') || '[]');
    let newFavs;
    if (isFavorite) {
      newFavs = favs.filter((fid) => fid !== book.biblio_id);
    } else {
      newFavs = [...favs, book.biblio_id];
    }
    localStorage.setItem('labslib_favorites', JSON.stringify(newFavs));
    setIsFavorite(!isFavorite);
  }, [book, isFavorite]);

  /* ── Loading State ── */
  if (isLoading) {
    return (
      <PageContainer>
        <div className="book-detail-loading">
          <div className="loading-book-icon">
            <BookOpen size={40} className="loading-spin-icon" />
          </div>
          <p>Memuat detail buku...</p>
        </div>
      </PageContainer>
    );
  }

  /* ── Error / Not Found ── */
  if (error || !book) {
    return (
      <PageContainer>
        <div className="book-detail-error glass-panel">
          <XCircle size={40} className="text-rose" />
          <h2>{error || 'Buku tidak ditemukan.'}</h2>
          <Button
            id="btn-back-from-error"
            variant="secondary"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft size={16} />}
          >
            Kembali
          </Button>
        </div>
      </PageContainer>
    );
  }

  const availability = AVAILABILITY_CONFIG[book.availability] || AVAILABILITY_CONFIG.available;
  const AvailIcon = availability.icon;
  const accentColors = ['cyan', 'purple', 'emerald', 'rose'];
  const accentIndex = book.biblio_id?.charCodeAt(book.biblio_id.length - 1) % 4 || 0;
  const accentColor = accentColors[accentIndex];

  return (
    <PageContainer className="book-detail-page">
      {/* ── Back Button ── */}
      <button
        className="back-btn"
        id="btn-back-to-search"
        onClick={() => navigate(-1)}
        aria-label="Kembali ke pencarian"
      >
        <ArrowLeft size={16} />
        <span>Kembali ke Pencarian</span>
      </button>

      {/* ── Main Content ── */}
      <div className="book-detail-layout">

        {/* ── LEFT: Cover + Quick Actions ── */}
        <aside className="book-cover-sidebar">
          {/* Book Cover */}
          <div className={`detail-cover-container cover-${accentColor}`}>
            {book.cover_image && !imgError ? (
              <img 
                src={book.cover_image} 
                alt={`Cover ${book.title}`} 
                className="detail-cover-img" 
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="detail-cover-placeholder">
                <BookOpen size={56} />
                <span className="detail-call-number">{book.call_number}</span>
              </div>
            )}
          </div>

          {/* Availability Status */}
          <div className={`availability-status-card glass-panel ${availability.className}`}>
            <AvailIcon size={20} style={{ color: availability.color }} />
            <span style={{ color: availability.color }}>{availability.label}</span>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <Button
              id="btn-generate-summary"
              variant="primary"
              onClick={handleGenerateSummary}
              isLoading={isSummaryLoading}
              disabled={isSummaryLoading}
              icon={<Sparkles size={16} />}
              className="w-full"
            >
              {summaryGenerated ? 'Buat Ulang Ringkasan AI' : 'Generate Ringkasan AI'}
            </Button>
            <Button
              id="btn-favorite"
              variant={isFavorite ? 'danger' : 'secondary'}
              onClick={handleToggleFavorite}
              icon={<Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />}
              className="w-full"
            >
              {isFavorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
            </Button>
          </div>

          {/* Category Badge */}
          <div className="category-badge glass-panel">
            <BookMarked size={14} />
            <span>{book.category}</span>
          </div>
        </aside>

        {/* ── RIGHT: Book Info ── */}
        <div className="book-detail-main">
          {/* Title & Author */}
          <div className="book-title-section">
            {/* Subjects */}
            <div className="detail-subjects">
              {(book.subject || []).map((s, i) => (
                <span key={i} className={`detail-subject-chip chip-${accentColor}`}>
                  {s}
                </span>
              ))}
            </div>
            <h1 className="book-detail-title">{book.title}</h1>
            <p className="book-detail-author">
              <User size={16} />
              {book.author}
            </p>
          </div>

          {/* Description */}
          {book.description && (
            <div className="book-description-section glass-panel">
              <h3 className="section-title">
                <BookOpen size={16} />
                Deskripsi
              </h3>
              <p className="book-description">{book.description}</p>
            </div>
          )}

          {/* Info Grid */}
          <div className="book-info-grid glass-panel">
            <h3 className="section-title">
              <Hash size={16} />
              Informasi Bibliografi
            </h3>
            <div className="info-rows">
              <InfoRow icon={Building}    label="Penerbit"     value={book.publisher}    accent="var(--color-cyan)" />
              <InfoRow icon={Calendar}    label="Tahun Terbit" value={book.year}          accent="var(--color-purple)" />
              <InfoRow icon={Hash}        label="ISBN"         value={book.isbn}          accent="var(--color-cyan)" />
              <InfoRow icon={BookMarked}  label="No. Panggil"  value={book.call_number}   accent="var(--color-purple)" />
              <InfoRow icon={MapPin}      label="Lokasi Rak"   value={book.location}      accent="var(--color-emerald)" />
              <InfoRow icon={Languages}   label="Bahasa"       value={book.language}      accent="var(--color-cyan)" />
              <InfoRow icon={Tag}         label="Kategori"     value={book.category}      accent="var(--color-purple)" />
            </div>
          </div>

          {/* ── AI Summary Panel ── */}
          <div className="ai-summary-panel glass-panel">
            <div className="ai-panel-header">
              <div className="ai-panel-title">
                <Sparkles size={18} className="text-cyan" />
                <h3>Ringkasan AI (Gemini)</h3>
              </div>
              {!summaryGenerated && !isSummaryLoading && (
                <p className="ai-panel-hint">
                  Klik tombol "Generate Ringkasan AI" untuk mendapatkan ringkasan buku ini secara otomatis menggunakan Gemini.
                </p>
              )}
            </div>

            {/* Loading State */}
            {isSummaryLoading && (
              <div className="ai-summary-loading">
                <Loader2 size={24} className="spin-icon text-cyan" />
                <p>Gemini AI sedang menganalisis buku ini...</p>
              </div>
            )}

            {/* Error State */}
            {summaryError && !isSummaryLoading && (
              <div className="ai-summary-error">
                <XCircle size={16} />
                <p>{summaryError}</p>
              </div>
            )}

            {/* Summary Text with Typewriter */}
            {summaryGenerated && summaryText && !isSummaryLoading && (
              <div className="ai-summary-result">
                <TypewriterText text={summaryText} />
                <div className="ai-summary-footer">
                  <Sparkles size={12} />
                  <span>Dihasilkan oleh Gemini AI · LabsLib</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Related Books ── */}
      {(relatedBooks.length > 0 || isRelatedLoading) && (
        <section className="related-books-section">
          <div className="section-header">
            <h2 className="section-heading">
              <ChevronRight size={20} className="text-cyan" />
              Buku Terkait
            </h2>
            <p className="section-subheading">Rekomendasi AI berdasarkan topik yang sama</p>
          </div>

          {isRelatedLoading ? (
            <div className="related-loading">
              <Loader2 size={20} className="spin-icon text-cyan" />
              <span>Mencari buku terkait...</span>
            </div>
          ) : (
            <div className="related-books-grid">
              {relatedBooks.map((rb, index) => (
                <BookCard key={rb.biblio_id} book={rb} index={index} />
              ))}
            </div>
          )}
        </section>
      )}
    </PageContainer>
  );
};

export default BookDetail;
