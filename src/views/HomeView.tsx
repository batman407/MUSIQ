import React, { useState } from 'react';
import { Camera, Upload, Eye, Search, FileText, ArrowRight, Music, Clock } from 'lucide-react';
import { ViewMode, ScoreProject } from '../types';
import { Button } from '../components/common/Button';

interface HomeViewProps {
  onNavigate: (view: ViewMode) => void;
  onSelectScore: (score: ScoreProject) => void;
  onStartUpload?: (file: File) => void;
  scores: ScoreProject[];
  userRole?: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onSelectScore,
  scores,
  userRole
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScores = scores.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.composer && s.composer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-200">
      {/* Transcription-First Hero Section */}
      <div className="space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/15 text-[#A78BFA] text-xs font-mono font-semibold">
          <Eye size={13} />
          <span>MUSIQ VISION • OPTICAL MUSIC RECOGNITION</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F4F1EA]">
          Turn sheet music into sound.
        </h1>

        <p className="text-sm sm:text-base text-[#9A9AA3] max-w-2xl leading-relaxed">
          Upload a score or photograph one with your camera. MUSIQ reads the notation, rebuilds the score, and prepares it for playback and export.
        </p>

        {/* Primary Action Triggers */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            icon={<Camera size={18} />}
            onClick={() => onNavigate('vision')}
          >
            Take a Photo
          </Button>

          <Button
            variant="secondary"
            size="lg"
            icon={<Upload size={18} />}
            onClick={() => onNavigate('vision')}
          >
            Upload Score
          </Button>
        </div>
      </div>

      {/* Quick Search for Transcriptions if any exist */}
      {scores.length > 0 && (
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-3.5 text-[#9A9AA3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search transcriptions..."
            className="w-full bg-[#111114] border border-[#27272D] hover:border-[#383842] focus:border-[#8B5CF6] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#F4F1EA] placeholder-[#6E6E77] focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* Section: Recent Transcriptions */}
      <div className="space-y-4 pt-4 border-t border-[#27272D]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music size={16} className="text-[#67E8F9]" />
            <h3 className="text-sm font-semibold tracking-wide text-[#F4F1EA] uppercase font-mono">
              Recent Transcriptions
            </h3>
          </div>

          {scores.length > 0 && (
            <button
              onClick={() => onNavigate('library')}
              className="text-xs text-[#9A9AA3] hover:text-[#F4F1EA] transition-colors"
            >
              View all ({scores.length})
            </button>
          )}
        </div>

        {filteredScores.length === 0 ? (
          /* Empty State: NO fake scores allowed */
          <div 
            onClick={() => onNavigate('vision')}
            className="p-10 sm:p-14 rounded-2xl bg-[#111114] border border-[#27272D] hover:border-[#67E8F9]/40 transition-all cursor-pointer text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#18181D] border border-[#27272D] flex items-center justify-center text-[#6E6E77] mx-auto">
              <FileText size={24} />
            </div>
            <h4 className="text-base font-bold text-[#F4F1EA]">No transcriptions yet.</h4>
            <p className="text-xs text-[#9A9AA3] max-w-sm mx-auto">
              Photograph or upload your first PDF or image sheet music score to begin.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18181D] border border-[#27272D] text-xs font-mono text-[#67E8F9] hover:text-white transition-colors">
                <Upload size={14} />
                <span>Upload a Score →</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredScores.map(score => (
              <div
                key={score.id}
                onClick={() => {
                  onSelectScore(score);
                  onNavigate('vision-result');
                }}
                className="group bg-[#111114] border border-[#27272D] hover:border-[#67E8F9]/50 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA] text-[10px] font-mono font-semibold">
                      {score.arrangementType || 'SCORE'}
                    </span>
                    <span className="text-[11px] font-mono text-[#9A9AA3]">
                      {score.pagesCount || 1} Page{score.pagesCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#F4F1EA] truncate group-hover:text-[#67E8F9] transition-colors">
                      {score.title || score.originalFilename}
                    </h4>
                    {score.composer ? (
                      <p className="text-xs text-[#9A9AA3] truncate mt-0.5">
                        {score.composer}
                      </p>
                    ) : (
                      <p className="text-[11px] font-mono text-[#6E6E77] truncate mt-0.5">
                        {score.originalFilename}
                      </p>
                    )}
                  </div>

                  {score.parts && score.parts.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                      {score.parts.slice(0, 4).map(part => (
                        <span
                          key={part.id}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#18181D] border border-[#27272D] text-[#F4F1EA]"
                        >
                          {part.shortName || part.name.slice(0, 3)}
                        </span>
                      ))}
                      {score.parts.length > 4 && (
                        <span className="text-[10px] font-mono text-[#9A9AA3]">
                          +{score.parts.length - 4}
                        </span>
                      )}
                      {score.measuresCount > 0 && (
                        <span className="text-[11px] font-mono text-[#9A9AA3] ml-auto">
                          {score.measuresCount} Meas
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#9A9AA3] pt-3 border-t border-[#27272D]/60 mt-3">
                  <span>{score.keySignature ? `${score.keySignature} • ` : ''}{score.timeSignature || 'Notation'}</span>
                  <span className="text-[#67E8F9] group-hover:translate-x-0.5 transition-transform">
                    View score →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
