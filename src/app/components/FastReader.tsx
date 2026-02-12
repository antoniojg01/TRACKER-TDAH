import React, { useState, useEffect, useRef } from 'react';
import { Book } from '@/types';
import { saveBookProgress, loadBookProgress } from '@/services/firebaseService';
import type { BookReadingProgress } from '@/types';
import JSZip from 'jszip';

interface FastReaderProps {
  books: Book[];
  onSaveBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onSyncBooks?: () => void;
  cloudStatus?: 'synced' | 'syncing' | 'offline';
}

const FastReader: React.FC<FastReaderProps> = ({ books, onSaveBook, onDeleteBook, onSyncBooks, cloudStatus }) => {
  const [view, setView] = useState<'LIST' | 'UPLOAD' | 'READING'>('LIST');
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookType, setNewBookType] = useState<'BOOK' | 'ARTICLE' | 'MAGAZINE'>('BOOK');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [wordKey, setWordKey] = useState(0); // Force re-render for animations
  const [turboMode, setTurboMode] = useState(false); // Intense visual effects
  const [colorMode, setColorMode] = useState<'rainbow' | 'fire' | 'ocean' | 'default'>('default');

  // Parse text file
  const parseTextFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.txt')) {
      alert('Por favor, envie apenas arquivos .txt');
      return;
    }

    setUploadedFile(file);
    const fileNameWithoutExt = file.name.replace(/\.txt$/i, '');
    setNewBookTitle(fileNameWithoutExt);
  };

  // Create book from uploaded file
  const createBookFromFile = async () => {
    if (!uploadedFile || !newBookTitle) return;

    try {
      const text = await parseTextFile(uploadedFile);
      const words = text.split(/\s+/).filter(w => w.length > 0);

      const newBook: Book = {
        id: Date.now().toString(),
        title: newBookTitle,
        content: words,
        currentPosition: 0,
        totalWords: words.length,
        wpm: 300,
        fontSize: 48,
        completed: false,
        timeSpent: 0,
        createdAt: Date.now(),
        type: newBookType
      };

      onSaveBook(newBook);
      setUploadedFile(null);
      setNewBookTitle('');
      setView('LIST');
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Erro ao processar arquivo');
    }
  };

  // Dynamic word analysis for intelligent reading
  const analyzeWord = (word: string, index: number, allWords: string[]) => {
    const cleaned = word.replace(/[^a-zA-ZÀ-ÿ]/g, '');
    const length = cleaned.length;
    const isPunctuation = /[.!?;:]$/.test(word);
    const isComma = /,$/.test(word);
    const isDash = /[-—–]/.test(word);
    const isCapitalized = /^[A-ZÀ-Ý]/.test(word);
    const isAllCaps = word === word.toUpperCase() && length > 1;
    const hasExclamation = /!/.test(word);
    const hasQuestion = /\?/.test(word);
    
    // Emotion words get special treatment
    const emotionWords = ['amor', 'ódio', 'medo', 'morte', 'vida', 'guerra', 'paz', 'sangue', 'fogo', 'tempestade', 'trovão', 'relâmpago', 'explosão', 'grito', 'sussurro', 'segredo', 'revelação', 'traição', 'vingança', 'destino'];
    const isEmotional = emotionWords.some(e => cleaned.toLowerCase().includes(e));
    
    // Action verbs get faster pacing
    const actionWords = ['correu', 'saltou', 'atacou', 'fugiu', 'gritou', 'explodiu', 'caiu', 'voou', 'disparou', 'lançou'];
    const isAction = actionWords.some(a => cleaned.toLowerCase().includes(a));
    
    return {
      length,
      isPunctuation,
      isComma,
      isDash,
      isCapitalized,
      isAllCaps,
      hasExclamation,
      hasQuestion,
      isEmotional,
      isAction,
      speedMultiplier: 
        isAllCaps ? 0.7 : // Slower for emphasis
        isEmotional ? 0.8 : // Slower for emotional impact
        isAction ? 1.3 : // Faster for action
        isPunctuation ? 0.6 : // Much slower for end of sentence
        isComma ? 0.8 : // Slower for comma
        isDash ? 0.85 : // Slightly slower for dash
        length > 12 ? 0.75 : // Slower for long words
        length > 8 ? 0.85 : // Slightly slower for medium-long words
        length < 3 ? 1.2 : // Faster for short words
        1.0, // Normal speed
      pauseAfter: 
        hasExclamation || hasQuestion ? 800 :
        isPunctuation ? 600 :
        isDash ? 400 :
        isComma ? 300 :
        0
    };
  };

  // Advanced reading with dynamic pacing
  useEffect(() => {
    if (isPlaying && currentBook) {
      const baseInterval = 60000 / currentBook.wpm;
      
      const advanceWord = () => {
        setCurrentBook(prev => {
          if (!prev) return prev;
          
          const nextPosition = prev.currentPosition + 1;
          if (nextPosition >= prev.totalWords) {
            setIsPlaying(false);
            return { ...prev, completed: true, completedAt: Date.now() };
          }

          const currentWord = prev.content[prev.currentPosition];
          const analysis = analyzeWord(currentWord, prev.currentPosition, prev.content);
          
          // Schedule next word with dynamic timing
          const nextInterval = baseInterval * analysis.speedMultiplier;
          const totalDelay = nextInterval + analysis.pauseAfter;
          
          timerRef.current = setTimeout(advanceWord, totalDelay);

          // Trigger animation re-render
          setWordKey(k => k + 1);

          return { 
            ...prev, 
            currentPosition: nextPosition, 
            timeSpent: prev.timeSpent + (totalDelay / 1000) 
          };
        });
      };

      // Start the chain
      advanceWord();

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [isPlaying, currentBook?.wpm]);

  // Save current book progress (both locally and to Firebase)
  useEffect(() => {
    if (currentBook && currentBook.currentPosition > 0) {
      onSaveBook(currentBook);
      
      // 💾 AUTO-SAVE progresso no Firebase
      const saveProgress = async () => {
        const progress: BookReadingProgress = {
          bookId: currentBook.id,
          bookTitle: currentBook.title,
          currentPosition: currentBook.currentPosition,
          totalWords: currentBook.totalWords,
          wpm: currentBook.wpm,
          lastReadAt: Date.now(),
          completedAt: currentBook.completed ? currentBook.completedAt : undefined
        };
        
        try {
          await saveBookProgress(progress);
        } catch (error) {
          console.error('Erro ao salvar progresso no Firebase:', error);
        }
      };

      // Salvar a cada 5 segundos (debounce)
      const timer = setTimeout(saveProgress, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentBook?.currentPosition, currentBook?.wpm]);

  const goToBook = (book: Book) => {
    setCurrentBook(book);
    setView('READING');
    
    // Carregar progresso anterior
    (async () => {
      try {
        const savedProgress = await loadBookProgress(book.id);
        if (savedProgress && !savedProgress.completedAt) {
          setCurrentBook(prev => prev ? {
            ...prev,
            currentPosition: savedProgress.currentPosition,
            wpm: savedProgress.wpm
          } : null);
          console.log(`📖 Retomando "${book.title}" na posição ${savedProgress.currentPosition}...`);
        }
      } catch (error) {
        console.error('Erro ao carregar progresso:', error);
      }
    })();
  };

  const completeBook = () => {
    if (currentBook) {
      const completed = { ...currentBook, completed: true, completedAt: Date.now() };
      onSaveBook(completed);
      setView('LIST');
    }
  };

  const updateSpeed = (delta: number) => {
    if (currentBook) {
      setCurrentBook({ ...currentBook, wpm: Math.max(100, Math.min(1000, currentBook.wpm + delta)) });
    }
  };

  const updateFontSize = (delta: number) => {
    if (currentBook) {
      setCurrentBook({ ...currentBook, fontSize: Math.max(24, Math.min(96, currentBook.fontSize + delta)) });
    }
  };

  const progress = currentBook ? (currentBook.currentPosition / currentBook.totalWords) * 100 : 0;
  const timeRemaining = currentBook ? ((currentBook.totalWords - currentBook.currentPosition) / currentBook.wpm) : 0;

  if (view === 'UPLOAD') {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('LIST')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-wider">Voltar</span>
          </button>
        </div>

        {/* Upload Form */}
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-wider bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Novo Livro
            </h2>

            <div>
              <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-orange-400/70 mb-3">
                Arquivo de Texto
              </label>
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileUpload}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/50"
              />
              <p className="mt-2 text-xs text-slate-500">Apenas arquivos .txt são suportados</p>
            </div>

            {uploadedFile && (
              <>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-orange-400/70 mb-3">
                    Título
                  </label>
                  <input
                    type="text"
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/50"
                    placeholder="Nome do livro"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-orange-400/70 mb-3">
                    Tipo
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['BOOK', 'ARTICLE', 'MAGAZINE'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setNewBookType(type)}
                        className={`py-3 rounded-xl text-xs font-black uppercase border-2 transition-all duration-300 ${
                          newBookType === type
                            ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                            : 'bg-white/5 border-white/10 text-slate-500 hover:border-orange-500/30'
                        }`}
                      >
                        {type === 'BOOK' && '📚 Livro'}
                        {type === 'ARTICLE' && '📄 Artigo'}
                        {type === 'MAGAZINE' && '📰 Revista'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={createBookFromFile}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-300 text-sm font-black uppercase tracking-wider hover:from-orange-500/30 hover:to-amber-500/30 transition-all duration-300"
                >
                  + Adicionar Livro
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'READING' && currentBook) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 to-slate-900">
        {/* Top Controls */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={() => { setView('LIST'); setIsPlaying(false); }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-bold">Sair</span>
          </button>

          <div className="flex items-center gap-4">
            {/* Font Size Controls */}
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
              <button
                onClick={() => updateFontSize(-4)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M20 12H4" />
                </svg>
              </button>
              <span className="text-xs font-bold text-orange-400">{currentBook.fontSize}px</span>
              <button
                onClick={() => updateFontSize(4)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Speed Controls */}
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
              <button
                onClick={() => updateSpeed(-50)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs font-bold text-orange-400">{currentBook.wpm} WPM</span>
              <button
                onClick={() => updateSpeed(50)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Turbo Mode Toggle */}
            <button
              onClick={() => setTurboMode(!turboMode)}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                turboMode
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-purple-500/30'
              }`}
              title="Ativa efeitos visuais intensos"
            >
              {turboMode ? '🚀 Turbo ON' : '⚡ Turbo'}
            </button>

            {/* Color Mode Selector */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl px-2 py-1">
              {(['default', 'rainbow', 'fire', 'ocean'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setColorMode(mode)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    colorMode === mode ? 'scale-110 ring-2 ring-white/30' : 'opacity-50 hover:opacity-100'
                  }`}
                  style={{
                    background: 
                      mode === 'rainbow' ? 'linear-gradient(135deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa)' :
                      mode === 'fire' ? 'linear-gradient(135deg, #ef4444, #f97316, #fb923c)' :
                      mode === 'ocean' ? 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)' :
                      'linear-gradient(135deg, #64748b, #94a3b8)'
                  }}
                  title={mode}
                />
              ))}
            </div>

            {/* Mark as Complete */}
            <button
              onClick={completeBook}
              className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-bold hover:bg-green-500/30 transition-all"
            >
              ✓ Concluir
            </button>
          </div>
        </div>

        {/* Reading Area */}
        <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
          {/* Static Gradient Background - SEM RE-RENDER */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: turboMode 
                ? 'radial-gradient(circle at 50% 50%, rgba(251, 146, 60, 0.3) 0%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(34, 211, 238, 0.2) 0%, transparent 50%)'
                : 'radial-gradient(ellipse at 40% 50%, rgba(251, 146, 60, 0.15) 0%, transparent 60%)',
            }}
          />

          {(() => {
            const word = currentBook.content[currentBook.currentPosition] || '';
            const analysis = analyzeWord(word, currentBook.currentPosition, currentBook.content);
            
            // Simplified visual effects - NO COMPLEX CALCULATIONS
            let colorClass = 'text-white';
            let textShadow = '';
            let scale = 1;
            
            // Color modes - SIMPLIFIED
            if (colorMode === 'rainbow') {
              const hue = (currentBook.currentPosition * 30) % 360;
              colorClass = '';
              textShadow = `0 0 30px hsla(${hue}, 70%, 50%, 0.6)`;
            } else if (colorMode === 'fire') {
              const fireColors = ['#ef4444', '#f97316', '#fb923c', '#fbbf24'];
              const fireColor = fireColors[currentBook.currentPosition % 4];
              colorClass = '';
              textShadow = `0 0 40px ${fireColor}80`;
            } else if (colorMode === 'ocean') {
              const oceanColors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#6366f1'];
              const oceanColor = oceanColors[currentBook.currentPosition % 4];
              colorClass = '';
              textShadow = `0 0 35px ${oceanColor}80`;
            }
            
            // Word type effects - SIMPLIFIED
            if (turboMode) {
              if (analysis.isAllCaps) {
                colorClass = colorClass || 'text-orange-400';
                textShadow = textShadow || '0 0 60px rgba(251, 146, 60, 1)';
                scale = 1.4;
              } else if (analysis.isEmotional) {
                colorClass = colorClass || 'text-red-400';
                textShadow = textShadow || '0 0 50px rgba(248, 113, 113, 0.9)';
              } else if (analysis.isAction) {
                colorClass = colorClass || 'text-cyan-400';
                textShadow = textShadow || '0 0 45px rgba(34, 211, 238, 0.8)';
              }
            } else {
              if (analysis.isAllCaps) {
                colorClass = colorClass || 'text-orange-400';
                textShadow = textShadow || '0 0 40px rgba(251, 146, 60, 0.8)';
                scale = 1.2;
              } else if (analysis.isEmotional) {
                colorClass = colorClass || 'text-red-400';
                textShadow = textShadow || '0 0 30px rgba(248, 113, 113, 0.6)';
              } else if (analysis.isAction) {
                colorClass = colorClass || 'text-cyan-400';
                textShadow = textShadow || '0 0 25px rgba(34, 211, 238, 0.5)';
              }
            }

            return (
              <div
                key={`word-${currentBook.currentPosition}-${wordKey}`}
                className={`text-center font-bold tracking-wide ${colorClass}`}
                style={{ 
                  fontSize: `${currentBook.fontSize}px`,
                  textShadow,
                  transform: scale !== 1 ? `scale(${scale})` : undefined,
                  willChange: 'contents'
                }}
              >
                {word}
              </div>
            );
          })()}

          {/* Reading Speed Indicator - STATIC */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => {
                const speedLevel = Math.floor((currentBook.wpm / 200) * 5);
                return (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      i < speedLevel 
                        ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]' 
                        : 'bg-white/20'
                    }`}
                    style={{
                      height: `${8 + i * 4}px`
                    }}
                  />
                );
              })}
            </div>
            <span className="text-xs font-bold text-orange-400">{currentBook.wpm}</span>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-6 border-t border-white/10 space-y-4">
          {/* Progress Bar */}
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{currentBook.currentPosition} / {currentBook.totalWords} palavras</span>
            <span>{Math.round(timeRemaining)} min restantes</span>
          </div>

          {/* Play/Pause Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                isPlaying
                  ? 'bg-red-500/20 border-2 border-red-500/50 text-red-300 hover:bg-red-500/30'
                  : 'bg-orange-500/20 border-2 border-orange-500/50 text-orange-300 hover:bg-orange-500/30'
              }`}
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List View
  const activeBooks = books.filter(b => !b.completed);
  const completedBooks = books.filter(b => b.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-space font-bold tracking-tighter text-white uppercase leading-none">Fast Reader</h1>
          <p className="text-[8px] md:text-[9px] tracking-[0.5em] text-slate-500 font-bold uppercase italic opacity-60">⚡ Leitura Quântica • Maximize sua Absorção de Conhecimento</p>
        </div>

        <div className="flex items-center gap-3">
          {onSyncBooks && (
            <button
              onClick={onSyncBooks}
              disabled={cloudStatus === 'syncing'}
              className="flex items-center gap-2 text-[8px] font-black border px-4 py-3 rounded-2xl uppercase tracking-[0.3em] active:scale-95 transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: cloudStatus === 'synced' ? '#10b981' : cloudStatus === 'syncing' ? '#f59e0b' : '#ef4444',
                borderColor: cloudStatus === 'synced' ? 'rgba(16, 185, 129, 0.2)' : cloudStatus === 'syncing' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                backgroundColor: cloudStatus === 'synced' ? 'rgba(16, 185, 129, 0.05)' : cloudStatus === 'syncing' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)'
              }}
              title={cloudStatus === 'offline' ? 'Clique para sincronizar com Supabase' : cloudStatus === 'synced' ? 'Dados sincronizados na nuvem' : 'Sincronizando...'}
            >
              {cloudStatus === 'synced' && '☁️ Sincronizado'}
              {cloudStatus === 'syncing' && '🔄 Sincronizando...'}
              {cloudStatus === 'offline' && '📤 Sync Cloud'}
            </button>
          )}
          <button
            onClick={() => setView('UPLOAD')}
            className="w-full md:w-auto text-[8px] font-black text-orange-400 border border-orange-400/20 px-6 py-3 rounded-2xl uppercase tracking-[0.3em] bg-orange-400/5 active:scale-95 transition-all hover:bg-orange-400/10 hover:border-orange-400/30"
          >
            + Adicionar Livro
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="group relative p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-orange-400/30 transition-all duration-300">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative space-y-2">
            <div className="text-[10px] font-black text-orange-400/70 uppercase tracking-[0.2em]">📖 Lendo</div>
            <div className="text-4xl font-space font-bold text-orange-400">{activeBooks.length}</div>
          </div>
        </div>
        
        <div className="group relative p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-400/30 transition-all duration-300">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative space-y-2">
            <div className="text-[10px] font-black text-emerald-400/70 uppercase tracking-[0.2em]">✓ Concluídos</div>
            <div className="text-4xl font-space font-bold text-emerald-400">{completedBooks.length}</div>
          </div>
        </div>
        
        <div className="group relative p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/30 transition-all duration-300">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative space-y-2">
            <div className="text-[10px] font-black text-cyan-400/70 uppercase tracking-[0.2em]">📝 Palavras</div>
            <div className="text-4xl font-space font-bold text-cyan-400">{books.reduce((sum, b) => sum + b.totalWords, 0).toLocaleString()}</div>
          </div>
        </div>
        
        <div className="group relative p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-400/30 transition-all duration-300">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative space-y-2">
            <div className="text-[10px] font-black text-violet-400/70 uppercase tracking-[0.2em]">⏱️ Minutos</div>
            <div className="text-4xl font-space font-bold text-violet-400">{Math.round(books.reduce((sum, b) => sum + b.timeSpent, 0) / 60)}</div>
          </div>
        </div>
      </div>

      {/* Active Books */}
      {activeBooks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-orange-400/70 uppercase tracking-[0.3em]">📖 Lendo Agora</h2>
          <div className="grid gap-3">
            {activeBooks.map(book => (
              <div
                key={book.id}
                className="group relative p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-orange-400/30 transition-all duration-300 cursor-pointer"
                onClick={() => goToBook(book)}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl opacity-70">{book.type === 'BOOK' && '📚'}{book.type === 'ARTICLE' && '📄'}{book.type === 'MAGAZINE' && '📰'}</div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-base font-space font-bold text-white group-hover:text-orange-400 transition-colors">{book.title}</h3>
                        <div className="flex items-center gap-3 text-[8px] text-slate-500 uppercase tracking-wider">
                          <span className="font-black">{book.type}</span>
                          <span>•</span>
                          <span>{book.totalWords.toLocaleString()} palavras</span>
                          <span>•</span>
                          <span>{Math.round(book.timeSpent / 60)} min</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${(book.currentPosition / book.totalWords) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider">
                        <span className="text-slate-500">{Math.round((book.currentPosition / book.totalWords) * 100)}% completo</span>
                        <span className="text-orange-400">{book.currentPosition.toLocaleString()} / {book.totalWords.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteBook(book.id); }}
                    className="p-2.5 rounded-xl bg-red-500/10 border border-red-400/20 text-red-400 hover:bg-red-500/20 hover:border-red-400/30 transition-all active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Books */}
      {completedBooks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-emerald-400/70 uppercase tracking-[0.3em]">✓ Concluídos</h2>
          <div className="grid gap-3">
            {completedBooks.map(book => (
              <div
                key={book.id}
                className="group relative p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-400/30 transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl opacity-70">✓</div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-base font-space font-bold text-emerald-400">{book.title}</h3>
                        <div className="flex items-center gap-3 text-[8px] text-slate-500 uppercase tracking-wider">
                          <span className="font-black text-emerald-400/70">{book.type === 'BOOK' && '📚 Livro'}{book.type === 'ARTICLE' && '📄 Artigo'}{book.type === 'MAGAZINE' && '📰 Revista'}</span>
                          <span>•</span>
                          <span>{book.totalWords.toLocaleString()} palavras</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-black">{Math.round(book.timeSpent / 60)} min gastos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onDeleteBook(book.id)}
                    className="p-2.5 rounded-xl bg-red-500/10 border border-red-400/20 text-red-400 hover:bg-red-500/20 hover:border-red-400/30 transition-all active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {books.length === 0 && (
        <div className="py-20 text-center space-y-6">
          <div className="text-7xl opacity-30">📚</div>
          <div className="space-y-2">
            <h3 className="text-xl font-space font-bold text-white uppercase">Biblioteca Vazia</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">Adicione seu primeiro livro para começar sua jornada de leitura quântica</p>
          </div>
          <button
            onClick={() => setView('UPLOAD')}
            className="text-[8px] font-black text-orange-400 border border-orange-400/20 px-6 py-3 rounded-2xl uppercase tracking-[0.3em] bg-orange-400/5 active:scale-95 transition-all hover:bg-orange-400/10 hover:border-orange-400/30"
          >
            + Adicionar Livro
          </button>
        </div>
      )}
    </div>
  );
};

export default FastReader;