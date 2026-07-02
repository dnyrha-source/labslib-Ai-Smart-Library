import React, { useState, useEffect } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import BookCard from '../../components/common/BookCard';
import { Star, BookOpen, Loader2 } from 'lucide-react';
import { bookService } from '../../../data/services/book.service';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const books = await bookService.getAllBooks(200);
        const favIds = JSON.parse(localStorage.getItem('labslib_favorites') || '[]');
        const favBooks = favIds.map(id => books.find(b => b.biblio_id === id)).filter(Boolean);
        setFavorites(favBooks);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  return (
    <PageContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h1 className="gradient-text">Buku Favorit Saya</h1>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
             <Loader2 className="spin-icon text-purple" size={40} />
          </div>
        ) : favorites.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {favorites.map((book, index) => (
              <BookCard key={book.biblio_id} book={book} index={index} />
            ))}
          </div>
        ) : (
          <Card glowColor="purple">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '40px 0' }}>
              <BookOpen size={48} className="text-muted" />
              <h2>Belum Ada Buku Favorit</h2>
              <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px' }}>
                Anda belum menambahkan buku apa pun ke daftar favorit. Jelajahi perpustakaan dan klik "Tambah ke Favorit" pada buku yang Anda sukai!
              </p>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default Favorites;
