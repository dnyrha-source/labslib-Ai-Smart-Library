import React, { useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import BookCard from '../../components/common/BookCard';
import { Brain, Sparkles, Search, Loader2, BookOpen, Download } from 'lucide-react';
import { groqService as geminiService } from '../../../data/services/groq.service';
import { bookService } from '../../../data/services/book.service';
import './AIResearchAssistant.css';

const AIResearchAssistant = () => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const allBooks = await bookService.getAllBooks(100);
      const brief = await geminiService.generateResearchBrief(topic, allBooks);
      setResult(brief);
    } catch (err) {
      console.error(err);
      setError('Gagal membuat Research Brief. Pastikan koneksi internet stabil dan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result || !result.reportMarkdown) return;
    
    // Create blob with markdown content
    const content = `# Research Brief: ${topic}\n\n${result.reportMarkdown}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `Research_Brief_${topic.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper untuk merender Markdown secara sederhana
  const renderMarkdown = (text) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('# ')) return <h1 key={index}>{line.replace('# ', '')}</h1>;
      if (line.startsWith('## ')) return <h2 key={index}>{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={index}>{line.replace('### ', '')}</h3>;
      if (line.startsWith('- ')) return <li key={index}>{line.replace('- ', '')}</li>;
      if (line.match(/^\d+\. /)) return <li key={index}>{line.replace(/^\d+\. /, '')}</li>;
      if (line.trim() === '') return <br key={index} />;
      
      // Handle bold
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={index}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <PageContainer>
      <div className="research-container">
        <div>
          <h1 className="gradient-text-purple" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Brain size={32} />
            AI Research Assistant
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Asisten cerdas untuk membantu Guru menyusun materi ajar dan mencari referensi relevan.
          </p>
        </div>

        <Card className="research-form-card" glowColor="purple">
          <form onSubmit={handleGenerate} className="research-input-group">
            <label htmlFor="topic">Topik Penelitian / Materi Ajar</label>
            <input
              id="topic"
              type="text"
              className="research-input"
              placeholder="Contoh: Pengaruh Perubahan Iklim terhadap Ekosistem Laut"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="research-button" 
              disabled={isLoading || !topic.trim()}
              style={{ marginTop: '16px' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Buat Research Brief
                </>
              )}
            </button>
          </form>
        </Card>

        {error && (
          <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        {result && !isLoading && (
          <div className="research-result-container">
            {/* Kolom Kiri: Report */}
            <Card glowColor="blue">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain className="text-blue" size={24} />
                  <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Hasil Analisis AI</h2>
                </div>
                <button 
                  onClick={handleDownload}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', background: 'rgba(255,255,255,0.1)',
                    border: '1px solid var(--border-glass)', borderRadius: '6px',
                    color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem'
                  }}
                >
                  <Download size={16} />
                  Unduh Dokumen
                </button>
              </div>
              <div className="markdown-report">
                {renderMarkdown(result.reportMarkdown)}
              </div>
            </Card>

            {/* Kolom Kanan: Rekomendasi Buku */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Card glowColor="purple">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <BookOpen className="text-purple" size={20} />
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Referensi Perpustakaan</h3>
                </div>
                
                {result.recommendedBooks.length > 0 ? (
                  <div className="recommendation-list">
                    {result.recommendedBooks.map(book => (
                      <BookCard key={book.biblio_id} book={book} />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <Search size={32} style={{ opacity: 0.5, margin: '0 auto 12px' }} />
                    <p>Tidak ditemukan buku yang relevan dengan topik ini di katalog perpustakaan.</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default AIResearchAssistant;
