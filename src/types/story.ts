export interface StoryPoint {
  id: string;
  position: number; // 1, 1.1, 1.5, 2, 2.3, etc.
  content: string;
  type: 'beginning' | 'middle' | 'end' | 'intermediate';
}

export interface Story {
  title: string;
  genre: string;
  synopsis: string; // Sinopse que guia toda a geração de eventos
  points: StoryPoint[];
}

export interface EventSuggestion {
  id: string;
  text: string;
  category: string;
}

// Elementos extraídos da sinopse
export interface SynopsisAnalysis {
  protagonist: string;
  antagonist: string;
  setting: string;
  mainConflict: string;
  themes: string[];
  characters: string[];
  objectives: string[];
  tone: string;
}
