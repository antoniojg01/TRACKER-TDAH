import { Story } from '@/types/story';

interface StoryPreviewProps {
  story: Story;
}

export function StoryPreview({ story }: StoryPreviewProps) {
  const sortedPoints = [...story.points].sort((a, b) => a.position - b.position);
  const hasContent = sortedPoints.some(p => p.content);

  if (!hasContent) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Prévia da História
        </h3>
        <div className="text-center py-8 text-slate-500">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Preencha os pontos da história para ver a prévia aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Prévia da História
      </h3>

      <div className="prose prose-sm max-w-none">
        {story.title && (
          <h4 className="text-center text-xl font-bold text-white mb-4">
            {story.title}
          </h4>
        )}
        
        {story.genre && (
          <p className="text-center text-sm text-orange-400 mb-4">
            Gênero: {story.genre}
          </p>
        )}

        {story.synopsis && (
          <div className="mb-6 p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
            <p className="text-xs font-medium text-orange-400 mb-2">📋 Sinopse:</p>
            <p className="text-sm text-slate-300 italic">{story.synopsis}</p>
          </div>
        )}

        <div className="space-y-4">
          {sortedPoints.map((point) => (
            point.content && (
              <div key={point.id} className="relative pl-6">
                <span className="absolute left-0 top-0 w-4 h-4 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {point.position}
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {point.content}
                </p>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}