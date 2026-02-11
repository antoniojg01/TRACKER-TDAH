import React, { useState } from 'react';

interface Story {
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

interface StoryCreatorProps {
  stories: Story[];
  onSaveStory: (story: Story) => void;
  onDeleteStory: (id: string) => void;
}

const GENRES = [
  { id: 'sci-fi', name: '🚀 Ficção Científica', color: 'from-cyan-500 to-blue-600' },
  { id: 'fantasy', name: '🧙 Fantasia', color: 'from-purple-500 to-pink-600' },
  { id: 'horror', name: '👻 Terror', color: 'from-red-600 to-gray-900' },
  { id: 'adventure', name: '🗺️ Aventura', color: 'from-green-500 to-teal-600' },
  { id: 'romance', name: '💖 Romance', color: 'from-pink-500 to-rose-600' },
  { id: 'mystery', name: '🔍 Mistério', color: 'from-indigo-600 to-purple-700' },
  { id: 'drama', name: '🎭 Drama', color: 'from-amber-600 to-orange-700' },
  { id: 'comedy', name: '😂 Comédia', color: 'from-yellow-500 to-orange-500' },
];

const STORY_PROMPTS = {
  characters: [
    'Um cientista brilhante com um segredo sombrio',
    'Uma criança com poderes inexplicáveis',
    'Um robô que desenvolveu consciência',
    'Um viajante do tempo preso no passado',
    'Uma feiticeira banida de seu reino',
    'Um detetive com memórias fragmentadas',
    'Um extraterrestre disfarçado de humano',
    'Um hacker que descobriu algo perigoso',
    'Uma bibliotecária que guarda portais mágicos',
    'Um músico que pode controlar emoções',
  ],
  settings: [
    'Uma cidade flutuante nas nuvens',
    'Estação espacial à beira do colapso',
    'Floresta encantada onde o tempo não existe',
    'Metrópole cyberpunk em 2157',
    'Ilha misteriosa fora dos mapas',
    'Reino subterrâneo iluminado por cristais',
    'Universidade de magia em outra dimensão',
    'Colônia em Marte após a evacuação da Terra',
    'Monastério no topo de montanha impossível',
    'Biblioteca infinita entre dimensões',
  ],
  conflicts: [
    'Uma profecia que está prestes a se cumprir',
    'Memórias de vidas passadas começam a despertar',
    'Portal para outro mundo se abre sem aviso',
    'Inteligência artificial assume controle da cidade',
    'Último guardião de um conhecimento ancestral',
    'Código genético que pode salvar ou destruir',
    'Conspiração que vai além da realidade conhecida',
    'Artefato antigo com poder destrutivo',
    'Mensagem do futuro alterando o presente',
    'Realidade começa a se fragmentar e colapsar',
  ],
};

const StoryCreator: React.FC<StoryCreatorProps> = ({ stories, onSaveStory, onDeleteStory }) => {
  const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('sci-fi');
  const [characters, setCharacters] = useState<string[]>([]);
  const [characterInput, setCharacterInput] = useState('');
  const [setting, setSetting] = useState('');
  const [conflict, setConflict] = useState('');
  const [content, setContent] = useState('');

  const resetForm = () => {
    setTitle('');
    setGenre('sci-fi');
    setCharacters([]);
    setCharacterInput('');
    setSetting('');
    setConflict('');
    setContent('');
    setCurrentStory(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setView('CREATE');
  };

  const handleEditStory = (story: Story) => {
    setCurrentStory(story);
    setTitle(story.title);
    setGenre(story.genre);
    setCharacters(story.characters);
    setSetting(story.setting);
    setConflict(story.conflict);
    setContent(story.content);
    setView('EDIT');
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      alert('Por favor, preencha pelo menos o título e conteúdo da história.');
      return;
    }

    const story: Story = {
      id: currentStory?.id || Date.now().toString(),
      title: title.trim(),
      genre,
      characters,
      setting: setting.trim(),
      conflict: conflict.trim(),
      content: content.trim(),
      createdAt: currentStory?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSaveStory(story);
    resetForm();
    setView('LIST');
  };

  const addCharacter = () => {
    if (characterInput.trim() && !characters.includes(characterInput.trim())) {
      setCharacters([...characters, characterInput.trim()]);
      setCharacterInput('');
    }
  };

  const removeCharacter = (char: string) => {
    setCharacters(characters.filter(c => c !== char));
  };

  const generateRandomIdea = (type: 'characters' | 'settings' | 'conflicts') => {
    const ideas = STORY_PROMPTS[type];
    const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
    
    if (type === 'characters') {
      if (!characters.includes(randomIdea)) {
        setCharacters([...characters, randomIdea]);
      }
    } else if (type === 'settings') {
      setSetting(randomIdea);
    } else if (type === 'conflicts') {
      setConflict(randomIdea);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  const selectedGenre = GENRES.find(g => g.id === genre) || GENRES[0];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-space font-bold tracking-tighter text-white uppercase leading-none">
            Story Creator
          </h1>
          <p className="text-[8px] md:text-[9px] tracking-[0.5em] text-slate-500 font-bold uppercase italic opacity-60">
            ✨ Gerador de Histórias • Liberte sua Criatividade
          </p>
        </div>

        {view === 'LIST' && (
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-violet-500/50 transition-all duration-300 hover:scale-105"
          >
            ✨ Nova História
          </button>
        )}

        {(view === 'CREATE' || view === 'EDIT') && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetForm();
                setView('LIST');
              }}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl font-bold text-sm transition-all duration-300"
            >
              ← Voltar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105"
            >
              💾 Salvar
            </button>
          </div>
        )}
      </header>

      {/* LIST VIEW */}
      {view === 'LIST' && (
        <div className="space-y-4">
          {stories.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-slate-300">Nenhuma história criada ainda</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Comece a escrever suas histórias épicas! Use o botão acima para criar sua primeira obra-prima.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stories.map(story => {
                const storyGenre = GENRES.find(g => g.id === story.genre) || GENRES[0];
                return (
                  <div
                    key={story.id}
                    className="group relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    onClick={() => handleEditStory(story)}
                  >
                    {/* Genre Badge */}
                    <div className={`absolute top-3 right-3 px-3 py-1 bg-gradient-to-r ${storyGenre.color} rounded-full text-xs font-bold text-white shadow-lg`}>
                      {storyGenre.name.split(' ')[0]}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-white pr-16 line-clamp-2">
                        {story.title}
                      </h3>

                      {story.setting && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          📍 {story.setting}
                        </p>
                      )}

                      {story.characters.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {story.characters.slice(0, 3).map((char, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-slate-700/50 text-slate-300 text-[10px] rounded-md"
                            >
                              {char.substring(0, 20)}...
                            </span>
                          ))}
                          {story.characters.length > 3 && (
                            <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-[10px] rounded-md">
                              +{story.characters.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-xs text-slate-500">
                          {story.content.trim().split(/\s+/).length} palavras
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Deletar "${story.title}"?`)) {
                              onDeleteStory(story.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg transition-all duration-300"
                        >
                          🗑️ Deletar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE/EDIT VIEW */}
      {(view === 'CREATE' || view === 'EDIT') && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Título da História *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
          </div>

          {/* Genre */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Gênero
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {GENRES.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGenre(g.id)}
                  className={`px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                    genre === g.id
                      ? `bg-gradient-to-r ${g.color} text-white shadow-lg scale-105`
                      : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/50'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* Characters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Personagens
              </label>
              <button
                onClick={() => generateRandomIdea('characters')}
                className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs rounded-lg transition-all duration-300"
              >
                🎲 Gerar Ideia
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={characterInput}
                onChange={(e) => setCharacterInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCharacter()}
                placeholder="Adicionar personagem..."
                className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
              <button
                onClick={addCharacter}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all"
              >
                + Adicionar
              </button>
            </div>
            {characters.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {characters.map((char, idx) => (
                  <span
                    key={idx}
                    className="group px-3 py-2 bg-slate-700/50 text-slate-300 text-sm rounded-lg flex items-center gap-2"
                  >
                    {char}
                    <button
                      onClick={() => removeCharacter(char)}
                      className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Setting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Cenário / Ambientação
              </label>
              <button
                onClick={() => generateRandomIdea('settings')}
                className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs rounded-lg transition-all duration-300"
              >
                🎲 Gerar Ideia
              </button>
            </div>
            <input
              type="text"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              placeholder="Onde a história acontece..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
          </div>

          {/* Conflict */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Conflito Principal
              </label>
              <button
                onClick={() => generateRandomIdea('conflicts')}
                className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs rounded-lg transition-all duration-300"
              >
                🎲 Gerar Ideia
              </button>
            </div>
            <input
              type="text"
              value={conflict}
              onChange={(e) => setConflict(e.target.value)}
              placeholder="Qual é o problema/desafio principal..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Conteúdo da História *
              </label>
              <span className="text-xs text-slate-500">
                {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Era uma vez..."
              rows={20}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none font-serif leading-relaxed"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-800/30 rounded-xl border border-white/5">
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-400">{wordCount}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Palavras</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-fuchsia-400">{characters.length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Personagens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{content.split('\n').length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Parágrafos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {Math.ceil(wordCount / 250)}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Min Leitura</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryCreator;
export type { Story };
