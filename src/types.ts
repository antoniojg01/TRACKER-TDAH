export type TimerMode = 'STOPWATCH' | 'TIMER' | 'POMODORO';

export interface Book {
  id: string;
  title: string;
  author?: string;
  content: string[]; // Array de palavras
  currentPosition: number; // Índice da palavra atual
  totalWords: number;
  wpm: number; // Palavras por minuto
  fontSize: number; // Tamanho da fonte (px)
  completed: boolean;
  timeSpent: number; // Tempo gasto em segundos
  createdAt: number;
  completedAt?: number;
  type: 'BOOK' | 'ARTICLE' | 'MAGAZINE';
}

export interface SavedLink {
  id: string;
  url: string;
  title: string;
  createdAt: number;
  category?: 'ARTICLE' | 'VIDEO' | 'TOOL' | 'COURSE' | 'OTHER';
}

export interface Story {
  id: string;
  title: string;
  genre: string;
  content: string;
  characters: string[];
  setting: string;
  conflict: string;
  createdAt: number;
  updatedAt: number;
}

export interface Product {
  id: string;
  name: string;
  salePrice: number; // Valor de venda fixo
  createdAt: number;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  pricePaid: number; // Valor pago na compra
  salePrice: number; // Valor de venda (copiado do produto)
  profit: number; // Lucro calculado (salePrice - pricePaid)
  createdAt: number;
}

// 📖 READING PROGRESS - Salvando progresso de leitura
export interface MangaReadingProgress {
  mangaId: string;
  mangaTitle: string;
  currentPage: number;
  totalPages: number;
  readingMode: 'RTL' | 'LTR';
  webtoonMode: boolean;
  scale: number;
  lastReadAt: number;
  completedAt?: number;
}

export interface BookReadingProgress {
  bookId: string;
  bookTitle: string;
  currentPosition: number;
  totalWords: number;
  wpm: number;
  lastReadAt: number;
  completedAt?: number;
}