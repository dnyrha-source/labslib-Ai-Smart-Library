/**
 * useBookSearch.js
 * Custom hook yang mengenkapsulasi logika pencarian buku
 * Mendukung dua mode: AI Search (Gemini) dan Konvensional (filter lokal)
 */

import { useState, useCallback, useRef } from 'react';
import { bookService } from '../../data/services/book.service';
import { groqService as geminiService } from '../../data/services/groq.service';

export const SEARCH_MODES = {
  AI: 'ai',
  CONVENTIONAL: 'conventional',
};

const useBookSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchMode, setSearchMode] = useState(SEARCH_MODES.AI);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiQueryInterpretation, setAiQueryInterpretation] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Filter state (untuk mode konvensional)
  const [activeSubject, setActiveSubject] = useState('');
  const [activeAvailability, setActiveAvailability] = useState('');

  // Ref untuk debounce
  const searchTimeout = useRef(null);

  /**
   * Muat semua buku saat pertama kali (untuk mode konvensional & fallback AI)
   */
  const loadAllBooks = useCallback(async () => {
    setIsInitialLoading(true);
    setError(null);
    try {
      const books = await bookService.getAllBooks(10000);
      setAllBooks(books);
      setResults(books);
    } catch (err) {
      setError('Gagal memuat data buku. Silakan refresh halaman.');
      console.error('loadAllBooks error:', err);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  /**
   * Jalankan pencarian berdasarkan mode aktif
   */
  const handleSearch = useCallback(
    async (searchQuery) => {
      const trimmedQuery = (searchQuery || query).trim();
      setQuery(trimmedQuery);
      setHasSearched(true);
      setError(null);
      setAiExplanation('');
      setAiQueryInterpretation('');

      if (!trimmedQuery) {
        setResults(allBooks);
        return;
      }

      setIsLoading(true);

      try {
        if (searchMode === SEARCH_MODES.AI) {
          // Gunakan Gemini AI untuk mencari
          const booksToSearch = allBooks.length > 0 ? allBooks : await bookService.getAllBooks(10000);
          if (allBooks.length === 0) setAllBooks(booksToSearch);

          const aiResult = await geminiService.searchBooksWithAI(
            trimmedQuery,
            booksToSearch
          );
          setResults(aiResult.results);
          setAiExplanation(aiResult.explanation);
          setAiQueryInterpretation(aiResult.queryInterpretation);
        } else {
          // Pencarian konvensional (filter lokal)
          const conventionalResults = await bookService.searchBooks(trimmedQuery);
          setResults(conventionalResults);
        }
      } catch (err) {
        if (searchMode === SEARCH_MODES.AI) {
          setError(
            `AI Search gagal: ${err.message}. Beralih ke pencarian konvensional...`
          );
          // Fallback ke konvensional jika AI gagal
          try {
            const fallbackResults = await bookService.searchBooks(trimmedQuery);
            setResults(fallbackResults);
          } catch {
            setError('Pencarian gagal. Silakan coba lagi.');
          }
        } else {
          setError('Pencarian gagal. Silakan coba lagi.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [query, searchMode, allBooks]
  );

  /**
   * Apply filter subjek dan/atau ketersediaan
   */
  const applyFilters = useCallback(
    (subject, availability) => {
      setActiveSubject(subject);
      setActiveAvailability(availability);

      let filtered = hasSearched && results.length > 0 ? [...allBooks] : [...allBooks];

      // Jika sedang dalam mode search, filter results saja
      const baseList = hasSearched ? [...results] : [...allBooks];

      let filtered2 = [...allBooks];

      if (subject) {
        filtered2 = filtered2.filter((b) =>
          b.subject?.some((s) => s.toLowerCase() === subject.toLowerCase())
        );
      }

      if (availability) {
        filtered2 = filtered2.filter((b) => b.availability === availability);
      }

      setResults(filtered2);
    },
    [allBooks, hasSearched, results]
  );

  /**
   * Reset semua pencarian dan filter
   */
  const handleReset = useCallback(() => {
    setQuery('');
    setResults(allBooks);
    setHasSearched(false);
    setError(null);
    setAiExplanation('');
    setAiQueryInterpretation('');
    setActiveSubject('');
    setActiveAvailability('');
  }, [allBooks]);

  /**
   * Toggle mode pencarian
   */
  const toggleSearchMode = useCallback(() => {
    setSearchMode((prev) =>
      prev === SEARCH_MODES.AI ? SEARCH_MODES.CONVENTIONAL : SEARCH_MODES.AI
    );
    // Reset hasil saat ganti mode
    setResults(allBooks);
    setHasSearched(false);
    setError(null);
    setAiExplanation('');
  }, [allBooks]);

  return {
    // State
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

    // Actions
    loadAllBooks,
    handleSearch,
    applyFilters,
    handleReset,
    toggleSearchMode,
  };
};

export default useBookSearch;
