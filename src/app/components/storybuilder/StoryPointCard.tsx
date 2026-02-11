import { useState } from 'react';
import { StoryPoint } from '@/types/story';
import { cn } from '@/utils/cn';

interface StoryPointCardProps {
  point: StoryPoint;
  suggestions: string[];
  onUpdate: (content: string) => void;
  onDelete?: () => void;
  onRegenerateSuggestions: () => void;
  isMainPoint?: boolean;
  rationale?: string;
  hasSynopsis?: boolean;
}

export function StoryPointCard({ 
  point, 
  suggestions, 
  onUpdate, 
  onDelete,
  onRegenerateSuggestions,
  isMainPoint = false,
  rationale,
  hasSynopsis = false
}: StoryPointCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const handleRegenerate = () => {
    setIsGenerating(true);
    // Simula um pequeno delay para feedback visual
    setTimeout(() => {
      onRegenerateSuggestions();
      setIsGenerating(false);
    }, 300);
  };

  const getTypeLabel = () => {
    switch (point.type) {
      case 'beginning': return '📖 Começo';
      case 'middle': return '⚡ Meio';
      case 'end': return '🎬 Fim';
      default: return '📍 Ponto Intermediário';
    }
  };

  const getTypeColor = () => {
    switch (point.type) {
      case 'beginning': return 'from-emerald-500 to-teal-600';
      case 'middle': return 'from-amber-500 to-orange-600';
      case 'end': return 'from-rose-500 to-pink-600';
      default: return 'from-orange-500 to-amber-600';
    }
  };

  const getBorderColor = () => {
    switch (point.type) {
      case 'beginning': return 'border-emerald-500/30';
      case 'middle': return 'border-amber-500/30';
      case 'end': return 'border-rose-500/30';
      default: return 'border-orange-500/30';
    }
  };

  const getRingColor = () => {
    switch (point.type) {
      case 'beginning': return 'ring-emerald-500/30';
      case 'middle': return 'ring-amber-500/30';
      case 'end': return 'ring-rose-500/30';
      default: return 'ring-orange-500/30';
    }
  };

  const displayedSuggestions = showAllSuggestions ? suggestions : suggestions.slice(0, 3);

  return (
    <div className={cn(
      "relative rounded-xl border-2 bg-white/[0.03] backdrop-blur-sm p-5 shadow-lg transition-all hover:shadow-xl",
      getBorderColor(),
      isMainPoint ? `ring-2 ring-offset-2 ring-offset-slate-950 ${getRingColor()}` : ""
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={cn(
            "inline-flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg bg-gradient-to-br shadow-md",
            getTypeColor()
          )}>
            {point.position}
          </span>
          <div>
            <span className="font-semibold text-white">{getTypeLabel()}</span>
            {rationale && (
              <p className="text-xs text-slate-400 mt-0.5">{rationale}</p>
            )}
          </div>
        </div>
        {!isMainPoint && onDelete && (
          <button
            onClick={onDelete}
            className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/30"
            title="Remover ponto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative">
        <textarea
          value={point.content}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder={`Descreva o que acontece neste ponto da história...\n\nDica: Use as sugestões abaixo para inspiração ou escreva sua própria ideia!`}
          className="w-full min-h-[120px] p-4 border border-white/10 bg-white/5 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent text-white placeholder:text-slate-500"
        />
        {point.content && (
          <div className="absolute bottom-3 right-3 text-xs text-slate-400">
            {point.content.split(/\s+/).filter(w => w).length} palavras
          </div>
        )}
      </div>

      {/* Suggestions Section */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">✨ Sugestões Criativas</span>
            <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30">
              Baseadas no contexto
            </span>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
              isGenerating 
                ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/10"
                : "bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700 shadow-md hover:shadow-lg hover:shadow-orange-500/30"
            )}
          >
            <svg 
              className={cn("w-4 h-4", isGenerating && "animate-spin")} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isGenerating ? 'Gerando...' : 'Gerar Novas'}
          </button>
        </div>

        {suggestions.length > 0 ? (
          <div className="space-y-2">
            {!hasSynopsis && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-3">
                <p className="text-xs text-amber-300 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span><strong>Dica:</strong> Adicione uma sinopse para receber sugestões muito mais criativas e personalizadas!</span>
                </p>
              </div>
            )}
            {displayedSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  // Se já tem conteúdo, adiciona ao final. Se não, substitui.
                  if (point.content.trim()) {
                    onUpdate(point.content + ' ' + suggestion);
                  } else {
                    onUpdate(suggestion);
                  }
                }}
                className="w-full text-left p-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20 text-slate-300 rounded-lg transition-all border border-orange-500/20 hover:border-orange-500/40 hover:shadow-md group"
              >
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 text-lg mt-0.5">💡</span>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{suggestion}</p>
                    <p className="text-xs text-orange-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Clique para usar esta sugestão
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
            ))}
            
            {suggestions.length > 3 && (
              <button
                onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                className="w-full text-center py-2 text-sm text-orange-400 hover:text-orange-300 font-medium"
              >
                {showAllSuggestions 
                  ? '↑ Mostrar menos' 
                  : `↓ Ver mais ${suggestions.length - 3} sugestões`
                }
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 bg-white/5 border border-white/10 rounded-lg">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm font-medium mb-1 text-slate-400">Sugestões personalizadas</p>
            <p className="text-xs">Adicione uma sinopse para desbloquear sugestões criativas baseadas na sua história</p>
            <button
              onClick={handleRegenerate}
              className="mt-3 text-orange-400 hover:text-orange-300 font-medium text-sm"
            >
              Ou clique aqui para gerar sugestões genéricas
            </button>
          </div>
        )}
      </div>

      {/* Tips */}
      {!point.content && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-xs text-amber-300">
            <span className="font-medium">💡 Dica:</span> Você pode clicar em uma sugestão para usá-la, 
            ou escrever diretamente seu próprio texto. Não gostou das sugestões? 
            Clique em "Gerar Novas" para ver outras ideias!
          </p>
        </div>
      )}
    </div>
  );
}