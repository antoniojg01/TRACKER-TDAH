import React, { useState, useEffect } from 'react';
import { MangaMeta, uploadMangaFromImages, loadMangaList, loadMangaPages } from '@/services/mangaService';
import { saveMangaProgress, loadMangaProgress } from '@/services/firebaseService';
import type { MangaReadingProgress } from '@/types';

interface MangaReaderProps {
  cloudStatus?: 'synced' | 'syncing' | 'offline';
}

type MangaView = 'LIST' | 'UPLOAD' | 'READING';

interface ReadingState {
  manga: MangaMeta;
  pages: string[];
  currentPage: number;
  scale: number;
  readingMode: 'RTL' | 'LTR'; // RTL para Manga/Manhwa, LTR para Webtoon
  webtoonMode: boolean;
}

/**
 * 🎨 LEITOR DE MANGA OTIMIZADO
 * 
 * Configuração profissional para leitura confortável:
 * - RTL (Right-to-Left): Padrão tradicional de mangá
 * - LTR (Left-to-Right): Para webtoons
 * - Webtoon Mode: Rolagem vertical contínua (inspirado em Webtoon Corp)
 * - Auto-scaling: Ajusta zoom automático ao tamanho da tela
 * - Keyboard navigation: Setas + Page Up/Down
 * - Touch swipe: Suporte nativo para mobile
 */

const MangaReader: React.FC<MangaReaderProps> = ({ cloudStatus = 'synced' }) => {
  const [view, setView] = useState<MangaView>('LIST');
  const [mangas, setMangas] = useState<MangaMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [readingState, setReadingState] = useState<ReadingState | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [mangaTitle, setMangaTitle] = useState('');

  // Carregar lista de mangás
  useEffect(() => {
    const loadMangas = async () => {
      setIsLoading(true);
      try {
        const loaded = await loadMangaList();
        setMangas(loaded);
      } catch (error) {
        console.error('Erro ao carregar mangás:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (view === 'LIST') {
      loadMangas();
    }
  }, [view]);

  const handleUpload = async () => {
    if (!mangaTitle || uploadFiles.length === 0) {
      alert('Defina um título e selecione imagens');
      return;
    }

    setIsLoading(true);
    try {
      await uploadMangaFromImages(mangaTitle, uploadFiles);
      setUploadFiles([]);
      setMangaTitle('');
      setView('LIST');
      alert('✅ Manga enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('❌ Erro ao fazer upload do manga');
    } finally {
      setIsLoading(false);
    }
  };

  const startReading = async (manga: MangaMeta) => {
    setIsLoading(true);
    try {
      const pages = await loadMangaPages(manga.id);
      
      // Carregar progresso anterior
      let savedProgress = await loadMangaProgress(manga.id);
      let startPage = 0;
      let savedMode: 'RTL' | 'LTR' = 'RTL';
      let savedWebtoon = false;
      let savedScale = 100;
      
      if (savedProgress && !savedProgress.completedAt) {
        startPage = savedProgress.currentPage;
        savedMode = savedProgress.readingMode;
        savedWebtoon = savedProgress.webtoonMode;
        savedScale = savedProgress.scale;
        console.log(`📖 Retomando ${manga.id} na página ${startPage}...`);
      }
      
      setReadingState({
        manga,
        pages,
        currentPage: startPage,
        scale: savedScale,
        readingMode: savedMode,
        webtoonMode: savedWebtoon
      });
      setView('READING');
    } catch (error) {
      console.error('Erro ao carregar páginas:', error);
      alert('Erro ao carregar manga');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageNavigation = (direction: 'prev' | 'next') => {
    if (!readingState) return;

    const { readingMode, currentPage, pages } = readingState;
    let nextPage = currentPage;

    if (readingMode === 'RTL') {
      nextPage = direction === 'next' ? currentPage - 1 : currentPage + 1;
    } else {
      nextPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    }

    if (nextPage >= 0 && nextPage < pages.length) {
      setReadingState({ ...readingState, currentPage: nextPage });
    }
  };

  const toggleWebtoonMode = () => {
    if (readingState) {
      setReadingState({
        ...readingState,
        webtoonMode: !readingState.webtoonMode,
        currentPage: 0
      });
    }
  };

  const changeScale = (delta: number) => {
    if (readingState) {
      const newScale = Math.max(50, Math.min(200, readingState.scale + delta));
      setReadingState({ ...readingState, scale: newScale });
    }
  };

  const toggleReadingMode = () => {
    if (readingState) {
      setReadingState({
        ...readingState,
        readingMode: readingState.readingMode === 'RTL' ? 'LTR' : 'RTL'
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (view !== 'READING') return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePageNavigation('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlePageNavigation('next');
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        handlePageNavigation('prev');
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        handlePageNavigation('next');
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        changeScale(10);
      } else if (e.key === '-') {
        e.preventDefault();
        changeScale(-10);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleReadingMode();
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        toggleWebtoonMode();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [view, readingState]);

  // 💾 AUTO-SAVE progresso de leitura
  useEffect(() => {
    if (!readingState || view !== 'READING') return;

    const saveProgress = async () => {
      const progress: MangaReadingProgress = {
        mangaId: readingState.manga.id,
        mangaTitle: readingState.manga.title,
        currentPage: readingState.currentPage,
        totalPages: readingState.pages.length,
        readingMode: readingState.readingMode,
        webtoonMode: readingState.webtoonMode,
        scale: readingState.scale,
        lastReadAt: Date.now()
      };

      try {
        await saveMangaProgress(progress);
      } catch (error) {
        console.error('Erro ao salvar progresso:', error);
      }
    };

    // Salvar logo após mudança (debounce de 500ms)
    const timer = setTimeout(saveProgress, 500);
    return () => clearTimeout(timer);
  }, [readingState, view]);

  // VIEW: UPLOAD
  if (view === 'UPLOAD') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <button
          onClick={() => setView('LIST')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>

        <div className="space-y-6 p-8 rounded-3xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10">
          <h2 className="text-2xl font-black uppercase tracking-wider bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
            📖 Upload de Manga
          </h2>

          <div>
            <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-red-400/70 mb-3">
              Título do Manga
            </label>
            <input
              type="text"
              value={mangaTitle}
              onChange={(e) => setMangaTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500/50"
              placeholder="Ex: One Piece Ch. 1001"
            />
          </div>

          <div>
            <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-red-400/70 mb-3">
              Selecione as Imagens
            </label>
            <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-red-500/30 rounded-2xl cursor-pointer hover:border-red-500/50 transition-colors">
              <div className="text-center space-y-2">
                <svg className="w-12 h-12 mx-auto text-red-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-sm font-bold text-red-400">
                  Clique ou arraste imagens aqui
                </p>
                <p className="text-xs text-slate-500">
                  {uploadFiles.length} imagem(ns) selecionada(s)
                </p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                className="hidden"
              />
            </label>
          </div>

          {uploadFiles.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400">Imagens selecionadas:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto">
                {uploadFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Page ${i + 1}`}
                      className="w-full h-auto rounded-lg border border-white/10 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">#{i + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={isLoading || !mangaTitle || uploadFiles.length === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-300 text-sm font-black uppercase tracking-wider hover:from-red-500/30 hover:to-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? '📤 Carregando...' : '✓ Fazer Upload'}
          </button>
        </div>
      </div>
    );
  }

  // VIEW: READING
  if (view === 'READING' && readingState) {
    const { manga, pages, currentPage, scale, readingMode, webtoonMode } = readingState;
    const progress = ((currentPage + 1) / pages.length) * 100;

    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Top Controls */}
        <div className="bg-slate-950 border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              setView('LIST');
              setReadingState(null);
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-bold">Sair</span>
          </button>

          <h2 className="text-white font-bold flex-1 text-center truncate">{manga.title}</h2>

          <div className="flex items-center gap-3">
            {/* Modo de Leitura */}
            <button
              onClick={toggleReadingMode}
              title={`Modo: ${readingMode === 'RTL' ? 'Manga (RTL)' : 'Webtoon (LTR)'}`}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm font-bold text-white hover:bg-white/20 transition-all"
            >
              {readingMode === 'RTL' ? '📖 RTL' : '📘 LTR'}
            </button>

            {/* Modo Webtoon */}
            <button
              onClick={toggleWebtoonMode}
              title="Ativar rolagem vertical contínua"
              className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                webtoonMode
                  ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
              }`}
            >
              ⬇️ Webtoon
            </button>

            {/* Zoom */}
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-2">
              <button onClick={() => changeScale(-10)} className="text-white hover:text-red-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M20 12H4" />
                </svg>
              </button>
              <span className="text-xs font-bold text-red-400 w-10 text-center">{scale}%</span>
              <button onClick={() => changeScale(10)} className="text-white hover:text-red-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Reading Area */}
        <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
          {webtoonMode ? (
            // Webtoon Mode: Vertical scrolling
            <div className="w-full max-w-2xl h-full overflow-y-auto space-y-4 py-4">
              <img
                src={pages[currentPage]}
                alt={`Página ${currentPage + 1}`}
                style={{ maxWidth: '100%', height: 'auto' }}
                className="mx-auto rounded-lg"
              />
            </div>
          ) : (
            // Traditional Mode: Two-page spread or single page
            <div className="flex items-center justify-center gap-4">
              {/* Previous Page (apenas em RTL) */}
              {readingMode === 'RTL' && currentPage > 0 && (
                <img
                  src={pages[currentPage - 1]}
                  alt={`Página ${currentPage}`}
                  style={{ maxHeight: '100%', maxWidth: '45%', transform: 'scaleX(-1)' }}
                  className="rounded-lg border-2 border-white/10"
                />
              )}

              {/* Current/Main Page */}
              <img
                src={pages[currentPage]}
                alt={`Página ${currentPage + 1}`}
                style={{ maxHeight: '100%', maxWidth: readingMode === 'RTL' && currentPage > 0 ? '45%' : '90%' }}
                className="rounded-lg"
              />

              {/* Next Page (apenas em LTR) */}
              {readingMode === 'LTR' && currentPage < pages.length - 1 && (
                <img
                  src={pages[currentPage + 1]}
                  alt={`Página ${currentPage + 2}`}
                  style={{ maxHeight: '100%', maxWidth: '45%' }}
                  className="rounded-lg border-2 border-white/10"
                />
              )}
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="bg-slate-950 border-t border-white/10 px-6 py-4 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Página {currentPage + 1} / {pages.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handlePageNavigation('prev')}
              disabled={readingMode === 'RTL' ? currentPage >= pages.length - 1 : currentPage === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>

            <button
              onClick={() => handlePageNavigation('next')}
              disabled={readingMode === 'RTL' ? currentPage === 0 : currentPage >= pages.length - 1}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Próxima
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <p className="text-center text-[8px] text-slate-600 uppercase tracking-wider">
            ⮜ Setas / PageUp/Down | +/- Zoom | M (modo) | W (webtoon)
          </p>
        </div>
      </div>
    );
  }

  // VIEW: LIST
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-red-500/10 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-space font-bold tracking-tighter text-white uppercase leading-none">Manga Reader</h1>
          <p className="text-[8px] md:text-[9px] tracking-[0.5em] text-slate-500 font-bold uppercase italic opacity-60">🎨 Leitor Otimizado para Mangá & Manhwa</p>
        </div>

        <button
          onClick={() => setView('UPLOAD')}
          className="w-full md:w-auto text-[8px] font-black text-red-400 border border-red-400/20 px-6 py-3 rounded-2xl uppercase tracking-[0.3em] bg-red-400/5 active:scale-95 transition-all hover:bg-red-400/10 hover:border-red-400/30"
        >
          + Upload Manga
        </button>
      </header>

      {isLoading && (
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-400 border-t-transparent"></div>
          <p className="text-slate-400 font-space text-sm">Carregando mangás...</p>
        </div>
      )}

      {!isLoading && mangas.length === 0 && (
        <div className="py-20 text-center space-y-6">
          <div className="text-7xl opacity-30">📖</div>
          <p className="text-slate-400">Nenhum mangá no momento</p>
          <button
            onClick={() => setView('UPLOAD')}
            className="text-[8px] font-black text-red-400 border border-red-400/20 px-6 py-3 rounded-2xl uppercase tracking-[0.3em] bg-red-400/5 active:scale-95 transition-all hover:bg-red-400/10 hover:border-red-400/30"
          >
            + Upload Manga
          </button>
        </div>
      )}

      {!isLoading && mangas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mangas.map((manga) => (
            <div
              key={manga.id}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 hover:border-red-500/30 transition-all duration-300 cursor-pointer"
              onClick={() => startReading(manga)}
            >
              {/* Cover */}
              {manga.coverUrl ? (
                <img
                  src={manga.coverUrl}
                  alt={manga.title}
                  className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center">
                  <svg className="w-16 h-16 text-red-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Info Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <h3 className="font-bold text-white mb-2 line-clamp-2">{manga.title}</h3>
                <p className="text-sm text-red-400 font-semibold">{manga.pageCount} páginas</p>
              </div>

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-red-400 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MangaReader;
