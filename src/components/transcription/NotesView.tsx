import React, { useState } from 'react';
import { Music, Users, FileText, ChevronRight, Hash } from 'lucide-react';
import { ParsedScore, ParsedPart, ParsedMeasure, ParsedEvent } from '../../services/musicXmlParser';
import { formatEventNoteNames } from '../../services/solfaEngine';

interface NotesViewProps {
  parsedScore: ParsedScore;
  selectedPartId?: string;
  onSelectPart?: (partId: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  parsedScore,
  selectedPartId,
  onSelectPart
}) => {
  // Active part filter ('all' or specific part ID)
  const [activePartFilter, setActivePartFilter] = useState<string>(selectedPartId || 'all');

  const handlePartChange = (partId: string) => {
    setActivePartFilter(partId);
    onSelectPart?.(partId);
  };

  const visibleParts: ParsedPart[] = activePartFilter === 'all'
    ? parsedScore.parts
    : parsedScore.parts.filter(p => p.id === activePartFilter);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Workspace Header & Part Selector */}
      <div className="bg-[#111114] border border-[#27272D] rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272D]/60 pb-3">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#67E8F9] flex items-center gap-1.5 font-semibold">
              <Music size={12} />
              <span>NOTE-NAME TRANSCRIPTION</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#F4F1EA]">
              {parsedScore.title}
            </h3>
            <p className="text-xs text-[#9A9AA3] font-mono">
              Key: {parsedScore.keySignature.name} • Time: {parsedScore.timeSignature}
              {parsedScore.tempoBpm ? ` • Tempo: ${parsedScore.tempoBpm} BPM` : ''}
              {parsedScore.composer ? ` • Composer: ${parsedScore.composer}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#9A9AA3]">
            <span className="px-2 py-1 rounded-md bg-[#18181D] border border-[#27272D]">
              {parsedScore.parts.length} {parsedScore.parts.length === 1 ? 'Part' : 'Parts'}
            </span>
            <span className="px-2 py-1 rounded-md bg-[#18181D] border border-[#27272D]">
              {parsedScore.measuresCount} Measures
            </span>
          </div>
        </div>

        {/* Dynamic Part Selector */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono text-[#9A9AA3] flex items-center gap-1.5">
            <Users size={12} />
            <span>Select Part to View:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePartChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                activePartFilter === 'all'
                  ? 'bg-[#8B5CF6] text-white shadow-md'
                  : 'bg-[#18181D] text-[#9A9AA3] border border-[#27272D] hover:text-[#F4F1EA] hover:border-[#3E3E4A]'
              }`}
            >
              All Parts ({parsedScore.parts.length})
            </button>
            {parsedScore.parts.map(part => (
              <button
                key={part.id}
                onClick={() => handlePartChange(part.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activePartFilter === part.id
                    ? 'bg-[#8B5CF6] text-white shadow-md'
                    : 'bg-[#18181D] text-[#9A9AA3] border border-[#27272D] hover:text-[#F4F1EA] hover:border-[#3E3E4A]'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: part.color }} />
                <span>{part.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parts & Measures Grid */}
      <div className="space-y-6">
        {visibleParts.map(part => (
          <div 
            key={part.id}
            className="bg-[#111114] border border-[#27272D] rounded-2xl overflow-hidden shadow-md"
          >
            {/* Part Header */}
            <div className="bg-[#18181D]/80 border-b border-[#27272D] px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: part.color }} />
                <h4 className="font-bold text-sm text-[#F4F1EA] tracking-wide font-mono">
                  {part.name.toUpperCase()}
                </h4>
                <span className="px-2 py-0.5 rounded bg-[#27272D] text-[10px] font-mono text-[#9A9AA3] uppercase">
                  {part.clef} Clef
                </span>
              </div>
              <span className="text-xs font-mono text-[#9A9AA3]">
                {part.measures.length} Measures
              </span>
            </div>

            {/* Measures Breakdown */}
            <div className="divide-y divide-[#27272D]/40">
              {part.measures.map(measure => (
                <div 
                  key={measure.number}
                  className="p-4 sm:px-6 hover:bg-[#15151A] transition-colors flex flex-col md:flex-row md:items-start gap-3 md:gap-6"
                >
                  {/* Measure Number Badge */}
                  <div className="shrink-0 flex items-center gap-1 text-xs font-mono text-[#A78BFA] font-bold md:w-24 pt-1">
                    <Hash size={13} className="text-[#8B5CF6]" />
                    <span>Measure {measure.number}</span>
                  </div>

                  {/* Events in Measure */}
                  <div className="flex-1 flex flex-wrap items-end gap-2 sm:gap-3">
                    {measure.events.length === 0 ? (
                      <span className="text-xs font-mono text-[#6E6E77] italic py-1">Empty measure</span>
                    ) : (
                      measure.events.map((event, eIdx) => {
                        const noteText = formatEventNoteNames(event);
                        const isRest = event.isRest;
                        const isChord = event.isChord;

                        return (
                          <div 
                            key={`${measure.number}-${eIdx}`}
                            className={`flex flex-col items-center justify-between rounded-xl px-2.5 py-1.5 border transition-all ${
                              isRest
                                ? 'bg-[#18181D]/60 border-[#27272D]/60 text-[#6E6E77] min-w-[48px]'
                                : isChord
                                ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/40 text-[#F4F1EA] min-w-[64px]'
                                : 'bg-[#18181D] border-[#27272D] text-[#F4F1EA] hover:border-[#8B5CF6]/60 min-w-[52px]'
                            }`}
                          >
                            {/* Rhythmic Symbol */}
                            <span className="text-xs font-mono text-[#9A9AA3]" title={event.durationName}>
                              {event.rhythmSymbol}
                            </span>

                            {/* Pitch Name */}
                            <span className={`text-sm font-mono font-bold my-0.5 tracking-tight ${
                              isRest ? 'text-[#6E6E77]' : isChord ? 'text-[#C4B5FD]' : 'text-[#F4F1EA]'
                            }`}>
                              {noteText}
                            </span>

                            {/* Lyric syllable (if present in MusicXML) */}
                            {event.lyric ? (
                              <span className="text-[10px] font-sans text-[#67E8F9] italic mt-0.5 truncate max-w-[80px]">
                                {event.lyric}
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono text-[#4E4E56]">
                                {event.durationName ? event.durationName.slice(0, 4) : ''}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
