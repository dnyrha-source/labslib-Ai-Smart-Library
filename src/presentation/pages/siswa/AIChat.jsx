import React, { useState, useEffect, useRef } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import { Sparkles, Send, Trash2, User, Bot } from 'lucide-react';
import { groqService as geminiService } from '../../../data/services/groq.service';
import { useAuth } from '../../contexts/AuthContext';
import './AIChat.css';

const AIChat = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  
  const [contextBooks, setContextBooks] = useState(() => {
    const saved = localStorage.getItem('labslib_chat_context');
    return saved ? JSON.parse(saved) : [];
  });

  // Initialize or load chat session from local storage
  useEffect(() => {
    const savedMessages = localStorage.getItem('labslib_chat_history');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        
        // Reconstruct Gemini history format
        const historyForGemini = parsedMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));
        setChatSession(geminiService.startChatSession(historyForGemini));
      } catch (e) {
        console.error("Failed to parse chat history");
        setChatSession(geminiService.startChatSession([]));
      }
    } else {
      setChatSession(geminiService.startChatSession([]));
      // Add initial greeting
      setMessages([
        {
          id: 'msg-initial',
          sender: 'ai',
          text: `Halo ${profile?.displayName || 'Siswa'}! Saya LabsLib AI, asisten perpustakaan Anda. Ada yang bisa saya bantu hari ini? Misalnya mencari referensi buku, membuat ringkasan, atau membahas topik tertentu.`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [profile?.displayName]);

  // Save to local storage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('labslib_chat_history', JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatSession || isTyping) return;

    const userText = inputValue.trim();
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const newUserMsg = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const { bookService } = await import('../../../data/services/book.service');
      const relevantBooks = await bookService.searchBooks(userText);
      
      // Ambil maksimal 8 buku baru, agar selalu tersisa ruang (minimal 7 buku) 
      // untuk mempertahankan memori konteks buku sebelumnya.
      const topRelevant = relevantBooks.slice(0, 8);
      
      // Gabungkan buku relevan baru dengan buku konteks sebelumnya (Rolling Window 15 buku)
      // Prioritaskan buku baru di depan, hapus duplikat
      const mergedBooks = [...topRelevant, ...contextBooks]
        .filter((v, i, a) => a.findIndex(t => t.biblio_id === v.biblio_id) === i)
        .slice(0, 15);
        
      setContextBooks(mergedBooks);
      localStorage.setItem('labslib_chat_context', JSON.stringify(mergedBooks));
      
      const aiResponseText = await geminiService.sendMessageToChat(chatSession, userText, mergedBooks);
      
      const newAiMsg = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newAiMsg]);
    } catch (error) {
      const errorMsg = {
        id: `msg-${Date.now()}-error`,
        sender: 'ai',
        text: "Maaf, saya sedang mengalami gangguan koneksi. Mohon coba lagi sebentar.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat percakapan ini?')) {
      localStorage.removeItem('labslib_chat_history');
      localStorage.removeItem('labslib_chat_context');
      setContextBooks([]);
      setChatSession(geminiService.startChatSession([]));
      setMessages([
        {
          id: `msg-${Date.now()}-initial`,
          sender: 'ai',
          text: 'Riwayat percakapan telah dihapus. Ada yang bisa saya bantu hari ini?',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <PageContainer>
      <div className="chat-container">
        {/* Chat Header */}
        <header className="chat-header">
          <div className="chat-header-info">
            <div className="chat-ai-avatar">
              <Sparkles size={24} />
            </div>
            <div className="chat-header-text">
              <h2>LabsLib AI Assistant</h2>
              <p>
                <span className="online-dot"></span> Online
              </p>
            </div>
          </div>
          <button 
            className="chat-clear-btn" 
            onClick={handleClearChat}
            title="Hapus riwayat obrolan"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Bersihkan Obrolan</span>
          </button>
        </header>

        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.length === 0 && !isTyping ? (
            <div className="chat-empty-state">
              <Sparkles size={48} className="sparkles-icon" />
              <h3>Mulai Percakapan</h3>
              <p>Tanyakan tentang buku, minta ringkasan, atau diskusikan topik pelajaran sekolah Anda di sini.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.sender}`}>
                <div className="message-avatar">
                  {msg.sender === 'ai' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="message-content">
                  <div className="message-bubble">
                    {msg.text}
                  </div>
                  <div className="message-time">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="message-row ai">
              <div className="message-avatar">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="message-bubble typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="chat-input-wrapper">
          <div className="chat-input-box">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder="Tanya sesuatu ke LabsLib AI..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              rows="1"
            />
            <button 
              className="chat-send-btn"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              title="Kirim pesan (Enter)"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="chat-footer-note">
            AI dapat melakukan kesalahan. Harap verifikasi informasi penting ke guru atau buku fisik.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default AIChat;
