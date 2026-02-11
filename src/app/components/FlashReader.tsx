import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import ePub from 'epubjs';

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const FONTS = [
  { name: 'Sans Serif', value: 'font-sans' },
  { name: 'Serif', value: 'font-serif' },
  { name: 'Space Mono', value: 'font-space' },
];

interface SavedProgress {
  fileName: string;
  fileSize: number;
  currentIndex: number;
  totalWords: number;
  lastRead: string;
  speed: number;
  fontFamily: string;
  fontSize: number;
}

const STORAGE_KEY = 'cronos-flash-reader-progress';

const FlashReader: React.FC = () => {
  const [text, setText] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  const [selectedFont, setSelectedFont] = useState('font-space');
  const [fontSize, setFontSize] = useState(64);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + ' ';
    }

    return fullText;
  };

  const extractTextFromEPUB = async (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const book = ePub(arrayBuffer);
        let fullText = '';

        await book.ready;
        
        const spine = await book.loaded.spine;
        const spineItems = (spine as any).items || [];
        
        for (const item of spineItems) {
          try {
            const section = book.spine.get(item.href);
            const doc: any = await section.load(book.load.bind(book));
            const text = doc.textContent || '';
            fullText += text + ' ';
          } catch (err) {
            console.error('Erro ao carregar capítulo:', err);
          }
        }

        resolve(fullText);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);
    setFileSize(file.size);
    setIsPlaying(false);

    try {
      let extractedText = '';

      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
      } else if (file.name.endsWith('.epub')) {
        extractedText = await extractTextFromEPUB(file);
      } else {
        alert('Por favor, selecione um arquivo PDF ou EPUB');
        setIsLoading(false);
        return;
      }

      const words = extractedText
        .split(/\s+/)
        .filter(word => word.length > 0);

      setText(words);
      setCurrentIndex(0);

      // Tentar carregar progresso salvo
      const savedData = localStorage.getItem(`${STORAGE_KEY}-${file.name}-${file.size}`);
      if (savedData) {
        const progress: SavedProgress = JSON.parse(savedData);
        if (confirm(`Continuar de onde parou? (${Math.round((progress.currentIndex / progress.totalWords) * 100)}% concluído)`)) {
          setCurrentIndex(progress.currentIndex);
          setWpm(progress.speed);
          setSelectedFont(progress.fontFamily);
          setFontSize(progress.fontSize);
        }
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      alert('Erro ao processar arquivo. Tente outro arquivo.');
    } finally {
      setIsLoading(false);
    }
  };

  const getWordDisplayTime = (word: string): number => {
    const baseTime = (60 / wpm) * 1000;
    const cleanWord = word.replace(/[.,!?;:'"()\[\]{}]/g, '');
    const wordLength = cleanWord.length;
    
    let multiplier = 1.0;
    
    if (wordLength <= 3) multiplier = 0.8;
    else if (wordLength <= 5) multiplier = 1.0;
    else if (wordLength <= 8) multiplier = 1.3;
    else if (wordLength <= 12) multiplier = 1.5;
    else multiplier = 1.8;
    
    if (/[.!?]$/.test(word)) multiplier += 0.5;
    if (/\d/.test(cleanWord)) multiplier += 0.2;
    if (/[,;:]$/.test(word)) multiplier += 0.3;
    
    return baseTime * multiplier;
  };

  useEffect(() => {
    if (isPlaying && text.length > 0) {
      const currentWord = text[currentIndex];
      const delay = getWordDisplayTime(currentWord);

      intervalRef.current = setTimeout(() => {
        setCurrentIndex((prev) => {
          if (prev >= text.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    } else {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isPlaying, wpm, text.length, currentIndex]);

  // Salvar progresso
  useEffect(() => {
    if (text.length > 0 && fileName) {
      const progress: SavedProgress = {
        fileName,
        fileSize,
        currentIndex,
        totalWords: text.length,
        lastRead: new Date().toISOString(),
        speed: wpm,
        fontFamily: selectedFont,
        fontSize,
      };
      localStorage.setItem(`${STORAGE_KEY}-${fileName}-${fileSize}`, JSON.stringify(progress));
    }
  }, [currentIndex, fileName, fileSize, text.length, wpm, selectedFont, fontSize]);

  const togglePlayPause = () => {
    if (text.length === 0) return;
    if (currentIndex >= text.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const progress = text.length > 0 ? (currentIndex / text.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-space font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            ⚡ FLASH READER
          </h1>
          <p className="text-slate-400 text-sm tracking-[0.3em] uppercase">Leitura Rápida Neural</p>
        </div>

        {/* Upload Section */}
        <div className="hologram-card rounded-3xl p-6 border border-cyan-500/20">
          <label className="flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all rounded-2xl p-8 border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/50">
            <svg className="w-12 h-12 mb-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-lg mb-2 font-semibold">
              {fileName || 'CARREGAR ARQUIVO'}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-wider">PDF ou EPUB</span>
            <input
              type="file"
              accept=".pdf,.epub"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {isLoading && (
          <div className="text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent"></div>
            <p className="text-slate-400 font-space text-sm">Processando arquivo...</p>
          </div>
        )}

        {/* Display Area */}
        {text.length > 0 && !isLoading && (
          <>
            <div 
              onClick={togglePlayPause}
              className="hologram-card rounded-3xl p-12 md:p-20 min-h-[300px] flex items-center justify-center cursor-pointer hover:bg-white/5 transition-all border border-indigo-500/20 active:scale-[0.99]"
              title="Clique para pausar/retomar"
            >
              <div 
                className={`font-bold text-center ${selectedFont} transition-all duration-300 drop-shadow-[0_0_20px_rgba(96,165,250,0.3)]`}
                style={{ fontSize: `${fontSize}px` }}
              >
                {text[currentIndex] || ''}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-400 font-space">
                <span className="text-cyan-400 font-semibold">
                  {currentIndex + 1} / {text.length}
                </span>
                <span className="text-indigo-400 font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="relative group">
                <input
                  type="range"
                  min="0"
                  max={text.length - 1}
                  value={currentIndex}
                  onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                    [&::-webkit-slider-thumb]:from-cyan-400 [&::-webkit-slider-thumb]:to-indigo-400 
                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
                    [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 
                    [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-r 
                    [&::-moz-range-thumb]:from-cyan-400 [&::-moz-range-thumb]:to-indigo-400 
                    [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:hover:scale-110"
                  style={{
                    background: `linear-gradient(to right, 
                      rgba(34, 211, 238, 0.8) 0%, 
                      rgba(99, 102, 241, 0.8) ${progress}%, 
                      rgba(255, 255, 255, 0.1) ${progress}%, 
                      rgba(255, 255, 255, 0.1) 100%)`,
                  }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
                <label className="block text-[9px] font-black tracking-[0.3em] text-cyan-400 mb-3 uppercase">
                  Velocidade: {wpm} PPM
                </label>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={wpm}
                  onChange={(e) => setWpm(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
                <label className="block text-[9px] font-black tracking-[0.3em] text-indigo-400 mb-3 uppercase">
                  Tamanho: {fontSize}px
                </label>
                <input
                  type="range"
                  min="24"
                  max="128"
                  step="4"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
                <label className="block text-[9px] font-black tracking-[0.3em] text-purple-400 mb-3 uppercase">Fonte</label>
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {FONTS.map((font) => (
                    <option key={font.value} value={font.value} className="bg-slate-900">
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl border border-white/20 transition-all font-space text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reiniciar
              </button>

              <button
                onClick={togglePlayPause}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 px-8 py-3 rounded-xl font-space font-bold text-sm transition-all transform hover:scale-105 shadow-lg"
              >
                {isPlaying ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                    Pausar
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    {currentIndex >= text.length - 1 ? 'Reiniciar' : 'Iniciar'}
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Instructions */}
        {text.length === 0 && !isLoading && (
          <div className="bg-white/5 backdrop-blur rounded-3xl p-8 border border-indigo-500/20">
            <h2 className="text-xl font-space font-bold mb-4 text-cyan-400">⚙️ INSTRUÇÕES:</h2>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">▸</span>
                <span>Carregue um arquivo PDF ou EPUB</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">▸</span>
                <span>Ajuste a velocidade de leitura (100-1000 palavras/min)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">▸</span>
                <span>Personalize tamanho e fonte</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">▸</span>
                <span>Clique na tela para pausar/retomar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">▸</span>
                <span className="text-emerald-400 font-semibold">✨ Progresso salvo automaticamente!</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashReader;
