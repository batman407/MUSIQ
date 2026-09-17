import React, { useState } from 'react';
import { Search, Star, Trash2, FileText, Upload, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { ScoreProject, ViewMode } from '../types';
import { storageService } from '../services/storageService';
import { Button } from '../components/common/Button';

interface LibraryViewProps {
  onNavigate: (view: ViewMode) => void;
  onSelectScore: (score: ScoreProject) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onNavigate,
  onSelectScore
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const scores = storageService.getScores();

  const filteredScores = scores.filter(score => {
    if (showFavoritesOnly && !score.isFavorite) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        score.title.toLowerCase().includes(q) ||
        score.originalFilename.toLowerCase().includes(q) ||
        (score.composer && score.composer.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenScore = (score: ScoreProject) => {
    onSelectScore(score);
    onNavigate('vision-result');
  };

  const handleDeleteScore = (scoreId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this transcription from your library?')) {
      storageService.deleteScore(scoreId);
      // Trigger rerender
      setSearchQuery(prev => prev);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272D]/60 pb-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#A78BFA]">
            DOCUMENT REPOSITORY
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA]">
            Transcription Library
          </h2>
          <p className="text-xs sm:text-sm text-[#9A9AA3] mt-0.5">
            Digitized sheet music scores, structured MusicXML, and multi-page documents.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Upload size={14} />}
          onClick={() => onNavigate('vision')}
        >
          New Score
        </Button>
      </div>

      {/* Search & Favorites Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-3.5 text-[#9A9AA3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search scores by title, filename, or composer..."
            className="w-full bg-[#111114] border border-[#27272D] hover:border-[#383842] focus:border-[#8B5CF6] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#F4F1EA] placeholder-[#6E6E77] focus:outline-none transition-colors"
          />
        </div>

        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono flex items-center gap-1.5 border transition-colors cursor-pointer ${
            showFavoritesOnly
              ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#A78BFA]'
              : 'bg-[#111114] border-[#27272D] text-[#9A9AA3] hover:text-[#F4F1EA]'
          }`}
        >
          <Star size={13} className={showFavoritesOnly ? 'fill-[#A78BFA]' : ''} />
          <span>Favorites Only</span>
        </button>
      </div>

      {/* Transcriptions Grid */}
      {filteredScores.length === 0 ? (
        <div className="p-12 text-center bg-[#111114] border border-[#27272D] rounded-2xl space-y-3">
          <FileText size={36} className="mx-auto text-[#6E6E77]" />
          <h4 className="text-base font-bold text-[#F4F1EA]">No transcriptions found</h4>
          <p className="text-xs text-[#9A9AA3] max-w-sm mx-auto">
            {searchQuery 
              ? 'No scores match your search filter. Try clearing the query.' 
              : 'Your transcription library is currently empty. Upload or photograph sheet music to add your first score.'}
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Upload size={14} />}
              onClick={() => onNavigate('vision')}
            >
              Upload Score
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScores.map(score => {
            const isReady = score.recognitionStatus === 'completed' || Boolean(score.rawMusicXml);
            const isFailed = score.recognitionStatus === 'failed';
            const statusLabel = isReady ? 'Ready' : isFailed ? 'Failed' : 'Processing';
            const statusColor = isReady ? 'text-[#4ADE80] bg-[#4ADE80]/15 border-[#4ADE80]/30' : isFailed ? 'text-[#EF4444] bg-[#EF4444]/15 border-[#EF4444]/30' : 'text-[#67E8F9] bg-[#67E8F9]/15 border-[#67E8F9]/30';

            return (
              <div
                key={score.id}
                onClick={() => handleOpenScore(score)}
                className="group bg-[#111114] border border-[#27272D] hover:border-[#8B5CF6]/50 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Status & Page count */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${statusColor} flex items-center gap-1`}>
                      {isReady && <CheckCircle2 size={11} />}
                      {isFailed && <AlertCircle size={11} />}
                      {!isReady && !isFailed && <Clock size={11} />}
                      <span>{statusLabel}</span>
                    </span>

                    <span className="text-[11px] font-mono text-[#9A9AA3]">
                      {score.pagesCount || 1} Page{score.pagesCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#F4F1EA] truncate group-hover:text-[#A78BFA] transition-colors">
                      {score.title || score.originalFilename}
                    </h4>
                    <p className="text-[11px] font-mono text-[#6E6E77] truncate mt-0.5">
                      {score.originalFilename}
                    </p>
                  </div>

                  {score.parts && score.parts.length > 0 && (
                    <div className="text-xs font-mono text-[#9A9AA3] pt-1">
                      {score.parts.length} Part{score.parts.length === 1 ? '' : 's'}: {score.parts.map(p => p.shortName || p.name).slice(0, 3).join(', ')}{score.parts.length > 3 ? '...' : ''}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#9A9AA3] pt-3 border-t border-[#27272D]/60 mt-3">
                  <span>{new Date(score.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteScore(score.id, e)}
                      className="p-1 rounded hover:bg-[#18181D] hover:text-[#EF4444] text-[#6E6E77] transition-colors"
                      title="Delete Score"
                    >
                      <Trash2 size={13} />
                    </button>
                    <span className="text-[#8B5CF6] group-hover:translate-x-0.5 transition-transform font-semibold">
                      Open →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
