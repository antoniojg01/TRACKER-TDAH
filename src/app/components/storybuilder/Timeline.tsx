import { StoryPoint } from '@/types/story';
import { cn } from '@/utils/cn';

interface TimelineProps {
  points: StoryPoint[];
  onAddPoint: (afterPosition: number) => void;
  onSelectPoint: (position: number) => void;
  selectedPosition: number | null;
}

export function Timeline({ points, onAddPoint, onSelectPoint, selectedPosition }: TimelineProps) {
  const sortedPoints = [...points].sort((a, b) => a.position - b.position);

  const getPointColor = (type: StoryPoint['type']) => {
    switch (type) {
      case 'beginning': return 'bg-emerald-500';
      case 'middle': return 'bg-amber-500';
      case 'end': return 'bg-rose-500';
      default: return 'bg-orange-500';
    }
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
        Linha do Tempo
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/50 via-amber-500/50 to-rose-500/50 rounded-full" />

        {/* Points */}
        <div className="relative flex justify-between items-start">
          {sortedPoints.map((point, index) => (
            <div key={point.id} className="relative flex flex-col items-center" style={{
              marginLeft: index === 0 ? 0 : 'auto',
              marginRight: index === sortedPoints.length - 1 ? 0 : 'auto',
            }}>
              {/* Point dot */}
              <button
                onClick={() => onSelectPoint(point.position)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all",
                  getPointColor(point.type),
                  selectedPosition === point.position 
                    ? "ring-4 ring-offset-2 ring-offset-slate-950 ring-orange-500/50 scale-110" 
                    : "hover:scale-110"
                )}
              >
                {point.position}
              </button>

              {/* Label */}
              <span className="mt-2 text-xs text-slate-400 text-center max-w-[80px] truncate">
                {point.content?.slice(0, 20) || (
                  point.type === 'beginning' ? 'Começo' :
                  point.type === 'middle' ? 'Meio' :
                  point.type === 'end' ? 'Fim' : 
                  `Ponto ${point.position}`
                )}
              </span>

              {/* Add button between points */}
              {index < sortedPoints.length - 1 && (
                <button
                  onClick={() => {
                    const nextPoint = sortedPoints[index + 1];
                    const newPosition = (point.position + nextPoint.position) / 2;
                    onAddPoint(newPosition);
                  }}
                  className="absolute -right-8 top-1 w-6 h-6 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-full flex items-center justify-center transition-colors"
                  title="Adicionar ponto intermediário"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-400">Começo (1.x)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-slate-400">Meio (2.x)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-xs text-slate-400">Fim (3)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-xs text-slate-400">Intermediário</span>
        </div>
      </div>
    </div>
  );
}