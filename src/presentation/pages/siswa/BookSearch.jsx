/**
 * BookSearch.jsx
 * Halaman pencarian koleksi buku perpustakaan
 * Mendukung AI Search (Gemini) dan Pencarian Konvensional
 */

import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Sparkles, SlidersHorizontal, X, RefreshCw, BookOpen, Zap, Filter } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import BookCard from '../../components/common/BookCard';
import Button from '../../components/common/Button';
import useBookSearch, { SEARCH_MODES } from '../../hooks/useBookSearch';
import { ALL_SUBJECTS, ALL_CATEGORIES } from '../../../data/mock/books.mock';
import './BookSearch.css';

// Komponen Skeleton
const BookCardSkeleton = ({ count = 8 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="book-card-skeleton glass-panel" style={{ animationDelay: `${i * 60}ms` }}>
        <div className="skeleton-cover" />
        <div className="skeleton-body">
          <div className="skeleton-line short" />
          <div className="skeleton-line long" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line xshort" />
        </div>
      </div>
    ))}
  </>
);

const BookSearch = () => {
  const {
    query,
    setQuery,
    results,
    allBooks,
    isLoading,
    isInitialLoading,
    error,
    searchMode,
    aiExplanation,
    aiQueryInterpretation,
    hasSearched,
    activeSubject,
    activeAvailability,
    loadAllBooks,
    handleSearch,
    applyFilters,
    handleReset,
    toggleSearchMode,
  } = useBookSearch();

  const [showFilters, setShowFilters] = useState(false);
  const [localSubject, setLocalSubject] = useState('');
  const [localAvailability, setLocalAvailability] = useState('');
  const inputRef = useRef(null);

  const location = useLocation();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  // Reset page when results change (e.g. searching or filtering)
  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const paginatedResults = results.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Muat buku pertama kali
  useEffect(() => {
    const initialize = async () => {
      await loadAllBooks();
      if (location.state?.initialQuery) {
        const initQ = location.state.initialQuery;
        setQuery(initQ);
        // Call handleSearch immediately after loading books
        handleSearch(initQ);
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAllBooks, location.state?.initialQuery]);

  // Auto-focus search input
  useEffect(() => {
    if (!isInitialLoading) {
      inputRef.current?.focus();
    }
  }, [isInitialLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleApplyFilters = () => {
    applyFilters(localSubject, localAvailability);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setLocalSubject('');
    setLocalAvailability('');
    applyFilters('', '');
    setShowFilters(false);
  };

  const isAIMode = searchMode === SEARCH_MODES.AI;
  const hasActiveFilters = activeSubject || activeAvailability;

  return (
    <PageContainer className="book-search-page">
      {/* ── Page Header ── */}
      <header className="book-search-header">
        <div className="book-search-header-text">
          <h1 className="page-title">
            Pencarian <span className="gradient-text">Koleksi Buku</span>
          </h1>
          <p className="page-subtitle">
            {allBooks.length > 0
              ? `${allBooks.length} koleksi buku tersedia di perpustakaan`
              : 'Memuat koleksi perpustakaan...'}
          </p>
        </div>
      </header>

      {/* ── Search Bar ── */}
      <div className="search-bar-container glass-panel">
        {/* Mode Toggle */}
        <div className="search-mode-toggle">
          <button
            id="btn-ai-mode"
            className={`mode-tab ${isAIMode ? 'mode-tab-active' : ''}`}
            onClick={() => !isAIMode && toggleSearchMode()}
            aria-pressed={isAIMode}
          >
            <Sparkles size={14} />
            <span>AI Search</span>
          </button>
          <button
            id="btn-conventional-mode"
            className={`mode-tab ${!isAIMode ? 'mode-tab-active' : ''}`}
            onClick={() => isAIMode && toggleSearchMode()}
            aria-pressed={!isAIMode}
          >
            <Search size={14} />
            <span>Konvensional</span>
          </button>
        </div>

        {/* Mode Hint */}
        <p className="search-mode-hint">
          {isAIMode
            ? '✨ Tanyakan apa saja! Contoh: "Buku fisika yang membahas gelombang dan optik"'
            : '🔍 Cari berdasarkan judul, penulis, subjek, atau ISBN'}
        </p>

        {/* Search Input */}
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-input-wrapper">
            <div className="search-icon">
              {isAIMode ? <Sparkles size={18} /> : <Search size={18} />}
            </div>
            <input
              ref={inputRef}
              id="book-search-input"
              type="text"
              className="search-input"
              placeholder={
                isAIMode
                  ? 'Ketik pertanyaan Anda secara alami...'
                  : 'Cari judul, penulis, ISBN...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isInitialLoading}
              aria-label="Kolom pencarian buku"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleReset}
                aria-label="Hapus pencarian"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <Button
            id="btn-search"
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!query.trim() || isLoading || isInitialLoading}
            icon={isAIMode ? <Sparkles size={16} /> : <Search size={16} />}
          >
            {isAIMode ? 'Cari AI' : 'Cari'}
          </Button>
          <Button
            id="btn-filter"
            type="button"
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter size={16} />}
            className={hasActiveFilters ? 'filter-btn-active' : ''}
          >
            Filter {hasActiveFilters ? `(Aktif)` : ''}
          </Button>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-grid">
              <div className="filter-group">
                <label htmlFor="filter-subject" className="filter-label">
                  <SlidersHorizontal size={13} />
                  Subjek / Topik
                </label>
                <select
                  id="filter-subject"
                  className="filter-select"
                  value={localSubject}
                  onChange={(e) => setLocalSubject(e.target.value)}
                >
                  <option value="">Semua Subjek</option>
                  {ALL_SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="filter-availability" className="filter-label">
                  <BookOpen size={13} />
                  Ketersediaan
                </label>
                <select
                  id="filter-availability"
                  className="filter-select"
                  value={localAvailability}
                  onChange={(e) => setLocalAvailability(e.target.value)}
                >
                  <option value="">Semua Status</option>
                  <option value="available">✅ Tersedia</option>
                  <option value="borrowed">📕 Dipinjam</option>
                  <option value="reserved">🕐 Dipesan</option>
                </select>
              </div>
            </div>
            <div className="filter-actions">
              <Button id="btn-apply-filter" variant="primary" size="sm" onClick={handleApplyFilters} icon={<Filter size={14} />}>
                Terapkan Filter
              </Button>
              <Button id="btn-clear-filter" variant="ghost" size="sm" onClick={handleClearFilters} icon={<X size={14} />}>
                Reset Filter
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── AI Explanation Banner ── */}
      {isAIMode && aiExplanation && !isLoading && (
        <div className="ai-explanation-banner glass-panel">
          <div className="ai-banner-icon">
            <Sparkles size={18} />
          </div>
          <div className="ai-banner-content">
            {aiQueryInterpretation && (
              <p className="ai-interpretation">
                <strong>Interpretasi:</strong> {aiQueryInterpretation}
              </p>
            )}
            <p className="ai-explanation-text">{aiExplanation}</p>
          </div>
        </div>
      )}

      {/* ── Error State ── */}
      {error && (
        <div className="search-error-banner">
          <X size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Results Header ── */}
      {!isInitialLoading && (
        <div className="results-header">
          <div className="results-count">
            {isLoading ? (
              <span className="results-loading">
                <RefreshCw size={14} className="spin-icon" />
                {isAIMode ? 'AI sedang menganalisis...' : 'Mencari...'}
              </span>
            ) : (
              <span>
                {hasSearched
                  ? `${results.length} hasil ditemukan`
                  : `${results.length} koleksi buku`}
                {hasActiveFilters && (
                  <span className="filter-active-indicator"> · Filter aktif</span>
                )}
              </span>
            )}
          </div>
          {(hasSearched || hasActiveFilters) && !isLoading && (
            <button className="reset-search-btn" onClick={handleReset} id="btn-reset-search">
              <X size={14} />
              Tampilkan Semua
            </button>
          )}
        </div>
      )}

      {/* ── Book Grid ── */}
      <div className="books-grid">
        {/* Initial Loading Skeleton */}
        {isInitialLoading && <BookCardSkeleton count={8} />}

        {/* Search Loading Skeleton (overlay) */}
        {!isInitialLoading && isLoading && <BookCardSkeleton count={6} />}

        {/* Results */}
        {!isInitialLoading && !isLoading && paginatedResults.length > 0 &&
          paginatedResults.map((book, index) => (
            <BookCard key={book.biblio_id} book={book} index={index} />
          ))
        }

        {/* Empty State */}
        {!isInitialLoading && !isLoading && results.length === 0 && (
          <div className="empty-state glass-panel">
            <div className="empty-state-icon">
              {isAIMode ? <Sparkles size={48} /> : <Search size={48} />}
            </div>
            <h3>Tidak Ada Hasil</h3>
            <p>
              {hasSearched
                ? `Tidak ditemukan buku yang cocok dengan "${query}". Coba kata kunci lain atau ubah filter.`
                : 'Mulai ketik untuk mencari buku perpustakaan.'}
            </p>
            {hasSearched && (
              <Button id="btn-empty-reset" variant="secondary" onClick={handleReset} icon={<RefreshCw size={16} />}>
                Lihat Semua Buku
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Pagination Controls ── */}
      {!isInitialLoading && !isLoading && totalPages > 1 && (
        <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem', padding: '1rem' }}>
          <Button 
            variant="secondary" 
            onClick={() => { if (currentPage > 1) setCurrentPage(c => c - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={currentPage === 1}
          >
            Sebelumnya
          </Button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button 
            variant="secondary" 
            onClick={() => { if (currentPage < totalPages) setCurrentPage(c => c + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={currentPage === totalPages}
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {/* ── AI Mode CTA Footer (hanya saat tidak ada query) ── */}
      {isAIMode && !hasSearched && !isInitialLoading && !isLoading && (
        <div className="ai-suggestion-bar glass-panel">
          <Zap size={16} className="text-cyan" />
          <span>Coba tanya:</span>
          {[
            'Buku tentang kecerdasan buatan dan machine learning',
            'Referensi untuk pelajaran matematika kelas 12',
            'Buku sejarah Indonesia yang menarik',
          ].map((suggestion) => (
            <button
              key={suggestion}
              className="suggestion-chip"
              onClick={() => {
                setQuery(suggestion);
                handleSearch(suggestion);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default BookSearch;
