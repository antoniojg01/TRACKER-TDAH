import { useState, useCallback } from 'react';
import { useStory } from '@/hooks/useStory';
import { StoryPointCard } from './storybuilder/StoryPointCard';
import { Timeline } from './storybuilder/Timeline';
import { StoryPreview } from './storybuilder/StoryPreview';
import { generateCreativeSuggestions, getSuggestionRationale, StoryContext, analyzeSynopsis, SynopsisAnalysis } from '@/data/storyEngine';

const genres = [
  'Fantasia',
  'Ficção Científica',
  'Romance',
  'Terror',
  'Aventura',
  'Drama',
  'Comédia',
  'Mistério',
];

export function StoryBuilder() {
  const {
    story,
    selectedPosition,
    setSelectedPosition,
    updateStoryMeta,
    updatePointContent,
    addIntermediatePoint,
    removePoint,
    resetStory,
  } = useStory();

  const [suggestionSeed, setSuggestionSeed] = useState(Date.now());
  const [showSynopsisHelp, setShowSynopsisHelp] = useState(false);
  
  // Estado para controlar se a sinopse foi interpretada
  const [isInterpreted, setIsInterpreted] = useState(false);
  const [interpretedSynopsis, setInterpretedSynopsis] = useState<string>('');
  const [synopsisAnalysis, setSynopsisAnalysis] = useState<SynopsisAnalysis | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);

  const selectedPoint = story.points.find(p => p.position === selectedPosition);
  
  // Função para interpretar a sinopse
  const handleInterpretSynopsis = useCallback(() => {
    if (!story.synopsis || story.synopsis.trim().length < 10) {
      return;
    }
    
    setIsInterpreting(true);
    
    // Simula um pequeno delay para dar feedback visual
    setTimeout(() => {
      const analysis = analyzeSynopsis(story.synopsis);
      setSynopsisAnalysis(analysis);
      setInterpretedSynopsis(story.synopsis);
      setIsInterpreted(true);
      setIsInterpreting(false);
      setSuggestionSeed(Date.now()); // Regenera sugestões
    }, 800);
  }, [story.synopsis]);

  // Verifica se a sinopse mudou desde a última interpretação
  const synopsisChanged = isInterpreted && story.synopsis !== interpretedSynopsis;
  
  // Gera o contexto para o motor de sugestões
  const getStoryContext = useCallback((): StoryContext => {
    const beginning = story.points.find(p => p.position === 1)?.content || '';
    const middle = story.points.find(p => p.position === 2)?.content || '';
    const end = story.points.find(p => p.position === 3)?.content || '';
    const previousEvents = story.points
      .filter(p => p.content)
      .sort((a, b) => a.position - b.position)
      .map(p => ({ position: p.position, content: p.content }));

    return {
      title: story.title,
      genre: story.genre || 'Aventura',
      // Só usa a sinopse se foi interpretada
      synopsis: isInterpreted ? interpretedSynopsis : '',
      beginning,
      middle,
      end,
      previousEvents,
      currentPosition: selectedPosition || 1,
    };
  }, [story, selectedPosition, isInterpreted, interpretedSynopsis]);

  // Gera sugestões baseadas no contexto (só usa sinopse se interpretada)
  const suggestions = selectedPosition 
    ? generateCreativeSuggestions(getStoryContext(), suggestionSeed)
    : [];

  const rationale = selectedPosition
    ? getSuggestionRationale(getStoryContext())
    : '';

  const handleRegenerateSuggestions = () => {
    setSuggestionSeed(Date.now() + Math.random() * 10000);
  };

  const handleResetStory = () => {
    resetStory();
    setIsInterpreted(false);
    setInterpretedSynopsis('');
    setSynopsisAnalysis(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-space font-bold tracking-tighter text-white uppercase leading-none">
            Story Builder Pro
          </h1>
          <p className="text-[8px] md:text-[9px] tracking-[0.5em] text-slate-500 font-bold uppercase italic opacity-60">
            ✨ Timeline Narrativa • Sugestões Inteligentes • Análise de Sinopse
          </p>
        </div>

        <button
          onClick={handleResetStory}
          className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
        >
          🔄 Nova História
        </button>
      </header>

      {/* Synopsis Section - PRINCIPAL */}
      <div className={`rounded-xl shadow-xl p-6 mb-6 text-white transition-all duration-500 ${
        isInterpreted 
          ? 'bg-gradient-to-r from-green-600 to-emerald-700' 
          : 'bg-gradient-to-r from-orange-600 to-amber-700'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Sinopse da História
              {isInterpreted && (
                <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Interpretada
                </span>
              )}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {isInterpreted 
                ? '✅ Sugestões personalizadas ativadas com base na sinopse'
                : '📝 Escreva a sinopse e clique em "Interpretar Sinopse" para ativar sugestões inteligentes'
              }
            </p>
          </div>
          <button
            onClick={() => setShowSynopsisHelp(!showSynopsisHelp)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Dicas para escrever a sinopse"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {showSynopsisHelp && (
          <div className="bg-white/10 rounded-lg p-4 mb-4 text-sm">
            <p className="font-medium mb-2">💡 Dicas para uma boa sinopse:</p>
            <ul className="space-y-1 text-white/90">
              <li>• Mencione o <strong>protagonista</strong> pelo nome ou descrição</li>
              <li>• Descreva o <strong>conflito principal</strong> ou objetivo</li>
              <li>• Inclua o <strong>cenário/mundo</strong> onde a história acontece</li>
              <li>• Mencione o <strong>antagonista</strong> ou obstáculo principal</li>
              <li>• Use palavras que indiquem <strong>temas</strong> (amor, vingança, poder, família...)</li>
            </ul>
            <p className="mt-3 text-white/70 italic">
              Exemplo: "Maria, uma jovem arqueóloga, descobre um mapa antigo que leva a um templo 
              perdido na Amazônia. Ela deve enfrentar caçadores de tesouros rivais e seus próprios 
              medos para encontrar o artefato que pode salvar sua família da ruína."
            </p>
          </div>
        )}

        <textarea
          value={story.synopsis}
          onChange={(e) => updateStoryMeta('synopsis', e.target.value)}
          placeholder="Escreva aqui a sinopse da sua história... &#10;&#10;Exemplo: Em um reino onde a magia foi proibida, uma jovem descobre que possui poderes ancestrais. Ela deve encontrar os outros portadores antes que o rei tirano os elimine, enquanto descobre segredos sobre sua própria família."
          className="w-full min-h-[150px] p-4 bg-white/10 border border-white/20 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder:text-white/50"
        />

        {/* Botão Interpretar Sinopse */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleInterpretSynopsis}
            disabled={!story.synopsis || story.synopsis.trim().length < 10 || isInterpreting}
            className={`px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
              isInterpreted 
                ? 'bg-white text-emerald-700 hover:bg-white/90'
                : 'bg-white text-orange-700 hover:bg-white/90'
            } ${isInterpreting ? 'animate-pulse' : ''}`}
          >
            {isInterpreting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Interpretando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {isInterpreted && synopsisChanged ? 'Reinterpretar Sinopse' : 'Interpretar Sinopse'}
              </>
            )}
          </button>

          {!story.synopsis || story.synopsis.trim().length < 10 ? (
            <p className="text-white/70 text-sm">
              ⚠️ Escreva pelo menos 10 caracteres na sinopse
            </p>
          ) : !isInterpreted ? (
            <p className="text-white/70 text-sm">
              👆 Clique no botão para ativar sugestões baseadas na sinopse
            </p>
          ) : synopsisChanged ? (
            <p className="text-amber-200 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Sinopse modificada! Clique para reinterpretar
            </p>
          ) : null}
        </div>

        {/* Synopsis Analysis Display - Só mostra após interpretar */}
        {isInterpreted && synopsisAnalysis && (
          <div className="mt-6 p-4 bg-white/10 rounded-xl">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Elementos Detectados na Sinopse
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">👤 Protagonista</p>
                <p className="text-sm font-medium truncate">
                  {synopsisAnalysis.protagonist || 'Não identificado'}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">👹 Antagonista</p>
                <p className="text-sm font-medium truncate">
                  {synopsisAnalysis.antagonist || 'Não identificado'}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">🌍 Cenário</p>
                <p className="text-sm font-medium truncate">
                  {synopsisAnalysis.setting || 'Não identificado'}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">🎭 Temas</p>
                <p className="text-sm font-medium truncate">
                  {synopsisAnalysis.themes.length > 0 
                    ? synopsisAnalysis.themes.slice(0, 3).join(', ')
                    : 'Não identificados'
                  }
                </p>
              </div>
            </div>
            {synopsisAnalysis.mainConflict && (
              <div className="mt-3 bg-white/10 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">⚔️ Conflito Principal</p>
                <p className="text-sm font-medium">{synopsisAnalysis.mainConflict}</p>
              </div>
            )}
            {synopsisAnalysis.characters.length > 0 && (
              <div className="mt-3 bg-white/10 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">👥 Personagens Mencionados</p>
                <p className="text-sm font-medium">{synopsisAnalysis.characters.join(', ')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Story Meta - Title and Genre */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-orange-400/70 mb-2 uppercase tracking-wider text-xs font-black">
              📝 Título da História
            </label>
            <input
              type="text"
              value={story.title}
              onChange={(e) => updateStoryMeta('title', e.target.value)}
              placeholder="Digite o título da sua história..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-400/70 mb-2 uppercase tracking-wider text-xs font-black">
              🎭 Gênero <span className="text-orange-400">(influencia as sugestões)</span>
            </label>
            <select
              value={story.genre}
              onChange={(e) => {
                updateStoryMeta('genre', e.target.value);
                if (isInterpreted) {
                  handleRegenerateSuggestions();
                }
              }}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-white"
            >
              <option value="">Selecione um gênero...</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Explanation Card */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl shadow-lg p-6 mb-6 border-l-4 border-orange-500">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white">
          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Como funciona a Linha do Tempo?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-bold text-white">1</span>
              <span className="font-medium text-emerald-400">Começo</span>
            </div>
            <p className="text-slate-300">Estabeleça o mundo, apresente personagens e o gancho inicial.</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-sm font-bold text-white">2</span>
              <span className="font-medium text-amber-400">Meio</span>
            </div>
            <p className="text-slate-300">Desenvolva o conflito, crie tensão e leve ao clímax.</p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-sm font-bold text-white">3</span>
              <span className="font-medium text-rose-400">Fim</span>
            </div>
            <p className="text-slate-300">Resolva os conflitos e conclua a jornada dos personagens.</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-400 bg-white/5 p-3 rounded-lg border border-white/10">
          ➕ <strong>Pontos intermediários:</strong> Clique nos botões "+" entre os pontos principais para adicionar 
          eventos com números decimais (1.5, 2.25, etc.) e detalhar sua narrativa.
        </p>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <Timeline
          points={story.points}
          onAddPoint={addIntermediatePoint}
          onSelectPoint={setSelectedPosition}
          selectedPosition={selectedPosition}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editor de Pontos
            {!isInterpreted && (
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full border border-amber-500/30">
                ⚠️ Interprete a sinopse para sugestões personalizadas
              </span>
            )}
          </h2>
          
          {selectedPoint ? (
            <StoryPointCard
              point={selectedPoint}
              suggestions={suggestions}
              onUpdate={(content) => updatePointContent(selectedPoint.position, content)}
              onDelete={[1, 2, 3].includes(selectedPoint.position) ? undefined : () => removePoint(selectedPoint.position)}
              onRegenerateSuggestions={handleRegenerateSuggestions}
              isMainPoint={[1, 2, 3].includes(selectedPoint.position)}
              rationale={rationale}
              hasSynopsis={isInterpreted}
            />
          ) : (
            <div className="bg-white/[0.03] border border-white/10 rounded-xl shadow-lg p-8 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p>Selecione um ponto na linha do tempo para editar</p>
            </div>
          )}

          {/* All Points Quick View */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl shadow-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Navegação Rápida
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {story.points.sort((a, b) => a.position - b.position).map(point => (
                <button
                  key={point.id}
                  onClick={() => setSelectedPosition(point.position)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedPosition === point.position
                      ? 'bg-orange-500/20 text-orange-300 shadow-sm border border-orange-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-medium ${
                      point.type === 'beginning' ? 'bg-emerald-500' :
                      point.type === 'middle' ? 'bg-amber-500' :
                      point.type === 'end' ? 'bg-rose-500' :
                      'bg-violet-500'
                    }`}>
                      {point.position}
                    </span>
                    <span className="truncate flex-1">
                      {point.content ? (
                        point.content.length > 40 
                          ? point.content.slice(0, 40) + '...' 
                          : point.content
                      ) : (
                        <span className="text-slate-500 italic">
                          {point.type === 'beginning' ? 'Começo (vazio)' :
                          point.type === 'middle' ? 'Meio (vazio)' :
                          point.type === 'end' ? 'Fim (vazio)' :
                          `Ponto ${point.position} (vazio)`}
                        </span>
                      )}
                    </span>
                    {point.content && (
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Prévia da História
          </h2>
          <StoryPreview story={story} />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-xl shadow-lg p-6">
        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Estatísticas da História
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="text-2xl font-bold text-orange-400">{story.points.length}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Pontos</div>
          </div>
          <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">
              {story.points.filter(p => p.content).length}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Preenchidos</div>
          </div>
          <div className="text-center p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="text-2xl font-bold text-amber-400">
              {story.points.reduce((acc, p) => acc + (p.content?.split(/\s+/).filter(w => w).length || 0), 0)}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Palavras</div>
          </div>
          <div className="text-center p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg">
            <div className="text-2xl font-bold text-rose-400">
              {Math.round((story.points.filter(p => p.content).length / story.points.length) * 100)}%
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Completo</div>
          </div>
          <div className={`text-center p-4 rounded-lg border ${isInterpreted ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className={`text-2xl font-bold ${isInterpreted ? 'text-green-400' : 'text-slate-500'}`}>
              {isInterpreted ? '✓' : '✗'}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Sinopse Ativa</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-6 border-t border-white/10 bg-white/5 rounded-lg">
        <p className="text-center text-sm text-slate-500">
          Story Builder Pro - Sugestões inteligentes baseadas na sua sinopse ✨
        </p>
      </footer>
    </div>
  );
}