import React, { useEffect, useRef, useState } from 'react';
import { Search, Sparkles, SlidersHorizontal, X, FileText, Download, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import PdfViewerModal from '../../components/common/PdfViewerModal';
import { researchService } from '../../../data/services/research.service';
import { groqService as geminiService } from '../../../data/services/groq.service';

const ResearchSearch = () => {
  const [query, setQuery] = useState('');
  const [isAiMode, setIsAiMode] = useState(true);
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allResearch, setAllResearch] = useState([]);
  const [aiExplanation, setAiExplanation] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal State
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Load awal
  useEffect(() => {
    const initialize = async () => {
      const data = await researchService.getAllResearch();
      setAllResearch(data);
      setResults(data);
    };
    initialize();
  }, []);

  // Reset page saat hasil pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const paginatedResults = results.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Fokus input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAiMode]);

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const searchQuery = query.trim();

    setIsSearching(true);
    setError('');
    setAiExplanation('');

    try {
      if (!searchQuery) {
        setResults(allResearch);
        return;
      }

      if (isAiMode) {
        const { results: aiResults, explanation } = await geminiService.searchResearchWithAI(
          searchQuery,
          allResearch
        );
        setResults(aiResults);
        setAiExplanation(explanation);
      } else {
        const conventionalResults = await researchService.searchResearch(searchQuery);
        setResults(conventionalResults);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat mencari.');
      if (isAiMode) {
        setIsAiMode(false);
        const fallbackResults = await researchService.searchResearch(searchQuery);
        setResults(fallbackResults);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults(allResearch);
    setAiExplanation('');
    setError('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleReadOnline = (document) => {
    setSelectedDoc(document);
  };

  return (
    <PageContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 className="gradient-text-purple" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={32} />
            Penelusuran Karya Tulis Ilmiah
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Cari skripsi, makalah, dan karya ilmiah dari repositori sekolah
          </p>
        </div>

        <Card glowColor="purple">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Toggles Mode */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsAiMode(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: isAiMode ? 'var(--purple)' : 'var(--border-glass)',
                  background: isAiMode ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                  color: isAiMode ? 'var(--purple-light)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Sparkles size={16} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>AI Search</span>
              </button>
              <button
                onClick={() => setIsAiMode(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: !isAiMode ? 'var(--border-strong)' : 'var(--border-glass)',
                  background: !isAiMode ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  color: !isAiMode ? 'var(--text-primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Search size={16} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Konvensional</span>
              </button>
            </div>

            {/* Hint */}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
              {isAiMode ? (
                <>
                  <Sparkles size={14} className="text-purple" />
                  Tanyakan apa saja! Contoh: "Adakah karya tulis mengenai daur ulang sampah?"
                </>
              ) : (
                <>
                  <Search size={14} />
                  Ketik judul, nama penulis, atau kata kunci (contoh: "Media Sosial").
                </>
              )}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-card)',
                  border: `1px solid ${isAiMode ? 'rgba(168, 85, 247, 0.4)' : 'var(--border-glass)'}`,
                  borderRadius: '12px',
                  padding: '4px',
                  boxShadow: isAiMode ? '0 0 15px rgba(168, 85, 247, 0.1)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ padding: '0 12px', color: isAiMode ? 'var(--purple)' : 'var(--text-secondary)' }}>
                  {isAiMode ? <Sparkles size={20} /> : <Search size={20} />}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isAiMode ? "Penelusuran AI Pintar..." : "Cari karya tulis..."}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    padding: '12px 0',
                    outline: 'none',
                  }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      padding: '8px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isSearching}
                style={{
                  padding: '0 24px',
                  background: isAiMode
                    ? 'linear-gradient(135deg, var(--purple), #c084fc)'
                    : 'var(--bg-card)',
                  border: isAiMode ? 'none' : '1px solid var(--border-glass)',
                  color: isAiMode ? 'white' : 'var(--text-primary)',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isSearching ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {isSearching ? (
                  <>Mencari...</>
                ) : (
                  <>
                    {isAiMode ? <Sparkles size={18} /> : <Search size={18} />}
                    {isAiMode ? 'Cari AI' : 'Cari'}
                  </>
                )}
              </button>
            </form>
          </div>
        </Card>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem', display: 'flex', gap: '8px' }}>
            <X size={18} /> {error}
          </div>
        )}

        {aiExplanation && !isSearching && (
          <div style={{ padding: '16px 20px', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '12px', color: 'var(--text-primary)', display: 'flex', gap: '16px', animation: 'fadeIn 0.5s ease-out' }}>
            <Sparkles size={24} className="text-purple" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--purple-light)', marginRight: '8px' }}>Interpretasi:</span>
                {aiExplanation}
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {results.length} hasil ditemukan
          </p>
        </div>

        {results.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {paginatedResults.map((item) => (
              <Card key={item.id} hoverable style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)' }}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', color: 'var(--text-primary)' }}>{item.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Oleh: <span style={{ color: 'var(--text-primary)' }}>{item.author}</span> • {item.year} • {item.type}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleReadOnline(item)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 16px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-glass)', borderRadius: '6px',
                      color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <BookOpen size={16} />
                    Baca Online
                  </button>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {item.abstract}
                </p>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {item.keywords.map((kw, i) => (
                    <span key={i} style={{ padding: '4px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </Card>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px', padding: '16px 0' }}>
                <button
                  onClick={() => { if (currentPage > 1) setCurrentPage(c => c - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === 1}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                    background: currentPage === 1 ? 'transparent' : 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-glass)', borderRadius: '8px',
                    color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1
                  }}
                >
                  <ChevronLeft size={16} /> Sebelumnya
                </button>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => { if (currentPage < totalPages) setCurrentPage(c => c + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === totalPages}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                    background: currentPage === totalPages ? 'transparent' : 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-glass)', borderRadius: '8px',
                    color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1
                  }}
                >
                  Selanjutnya <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <Card style={{ padding: '48px 0', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <FileText size={48} className="text-purple" style={{ opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Tidak Ada Hasil</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.5 }}>
                Tidak ditemukan karya tulis yang cocok dengan "{query}". Coba kata kunci lain.
              </p>
              <button
                onClick={handleClear}
                style={{
                  marginTop: '8px',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                }}
              >
                Lihat Semua Karya Tulis
              </button>
            </div>
          </Card>
        )}
      </div>

      <PdfViewerModal 
        isOpen={selectedDoc !== null}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
      />
    </PageContainer>
  );
};

export default ResearchSearch;
