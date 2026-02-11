import { useState, useCallback } from 'react';
import { Story, StoryPoint } from '@/types/story';

const createInitialStory = (): Story => ({
  title: '',
  genre: '',
  synopsis: '',
  points: [
    { id: '1', position: 1, content: '', type: 'beginning' },
    { id: '2', position: 2, content: '', type: 'middle' },
    { id: '3', position: 3, content: '', type: 'end' },
  ],
});

export function useStory() {
  const [story, setStory] = useState<Story>(createInitialStory);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(1);

  const updateStoryMeta = useCallback((field: 'title' | 'genre' | 'synopsis', value: string) => {
    setStory(prev => ({ ...prev, [field]: value }));
  }, []);

  const updatePointContent = useCallback((position: number, content: string) => {
    setStory(prev => ({
      ...prev,
      points: prev.points.map(p => 
        p.position === position ? { ...p, content } : p
      ),
    }));
  }, []);

  const addIntermediatePoint = useCallback((newPosition: number) => {
    const roundedPosition = Math.round(newPosition * 100) / 100;
    
    // Determine type based on position
    let type: StoryPoint['type'] = 'intermediate';
    if (roundedPosition < 2) {
      type = 'intermediate';
    } else if (roundedPosition >= 2 && roundedPosition < 3) {
      type = 'intermediate';
    }

    const newPoint: StoryPoint = {
      id: `point-${Date.now()}`,
      position: roundedPosition,
      content: '',
      type,
    };

    setStory(prev => ({
      ...prev,
      points: [...prev.points, newPoint].sort((a, b) => a.position - b.position),
    }));

    setSelectedPosition(roundedPosition);
  }, []);

  const removePoint = useCallback((position: number) => {
    // Don't allow removing main points (1, 2, 3)
    if ([1, 2, 3].includes(position)) return;
    
    setStory(prev => ({
      ...prev,
      points: prev.points.filter(p => p.position !== position),
    }));

    setSelectedPosition(null);
  }, []);

  const resetStory = useCallback(() => {
    setStory(createInitialStory());
    setSelectedPosition(1);
  }, []);

  const getContext = useCallback(() => {
    const beginning = story.points.find(p => p.position === 1)?.content || '';
    const middle = story.points.find(p => p.position === 2)?.content || '';
    const end = story.points.find(p => p.position === 3)?.content || '';
    const previousEvents = story.points
      .filter(p => p.content)
      .sort((a, b) => a.position - b.position)
      .map(p => p.content);

    return { beginning, middle, end, previousEvents };
  }, [story.points]);

  return {
    story,
    selectedPosition,
    setSelectedPosition,
    updateStoryMeta,
    updatePointContent,
    addIntermediatePoint,
    removePoint,
    resetStory,
    getContext,
  };
}
