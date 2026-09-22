import React, { useState } from 'react';
import { Music2, Key, Users, Hash, Info, Layers } from 'lucide-react';
import { ParsedScore, ParsedPart, ParsedMeasure, ParsedEvent } from '../../services/musicXmlParser';
import { formatEventSolfa } from '../../services/solfaEngine';

interface SolfaViewProps {
  parsedScore: ParsedScore;
  selectedPartId?: string;
  onSelectPart?: (partId: string) => void;
}

export const SolfaView: React.FC<SolfaViewProps> = ({
  parsedScore,
  selectedPartId,
  onSelectPart
}) => {
  // Active part filter ('all' or specific part ID, defaulting to selected or first part)
  const defaultPart = selectedPartId || (parsedScore.parts[0]?.id || 'all');
  const [activePartFilter, setActivePartFilter] = useState<string>(defaultPart);

  const handlePartChange = (partId: string) => {
    setActivePartFilter(partId);
    onSelectPart?.(partId);
  };

  const visibleParts: ParsedPart[] = activePartFilter === 'all'
    ? parsedScore.parts
    : parsedScore.parts.filter(p => p.id === activePartFilter);

  const isMinor = parsedScore.keySignature.mode === 'minor';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Tonal Metadata & Part Selector Banner */}
      <div className="bg-[#111114] border border-[#27272D] rounded-2xl p-5 space-y-4 shadow-xl">
        {/* Tonal Header Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-[#27272D]/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30">
              <Key size={20} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#9A9AA3]">
                DETECTED KEY
              </div>
              <div className="text-base font-bold text-[#F4F1EA] flex items-center gap-1.5">
                <span>{parsedScore.keySignature.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA]">
                  {parsedScore.keySignature.fifths > 0
                    ? `${parsedScore.keySignature.fifths}♯`
                    : parsedScore.keySignature.fifths < 0
                    ? `${Math.abs(parsedScore.keySignature.fifths)}♭`
                    : 'Natural'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#67E8F9]/15 text-[#67E8F9] border border-[#67E8F9]/30">
              <Music2 size={20} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#9A9AA3]">
                NOTATION SYSTEM
              </div>
              <div className="text-base font-bold text-[#F4F1EA]">
                Movable-Do Sol-Fa
              </div>
              <div className="text-[10px] font-mono text-[#67E8F9]">
                {isMinor ? 'Tonic-Based Do-Minor' : '1 = do (Tonic Center)'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30">
              <Layers size={20} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#9A9AA3]">
                METER & TEMPO
              </div>
              <div className="text-base font-bold text-[#F4F1EA]">
                {parsedScore.timeSignature} Meter
              </div>
              <div className="text-[10px] font-mono text-[#9A9AA3]">
                {parsedScore.tempoBpm ? `${parsedScore.tempoBpm} BPM` : 'Standard Tempo'}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Part Selector */}
        <div className="space-y-1.5">
          <div className="text-xs font-mono text-[#9A9AA3] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users size={12} />
              <span>Voice / Part:</span>
            </span>
            <span className="text-[11px] text-[#8B5CF6] font-semibold">
              Movable-Do active
            </span>
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

      {/* Syllable Scale Degree Quick Guide */}
      <div className="px-4 py-2 bg-[#18181D]/40 border border-[#27272D]/50 rounded-xl text-xs font-mono text-[#9A9AA3] flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-[#A78BFA] font-bold flex items-center gap-1">
          <Info size={12} />
          <span>Scale Degrees:</span>
        </span>
        {isMinor ? (
          <span>do (1) • re (2) • me (♭3) • fa (4) • sol (5) • le (♭6) • te (♭7) / ti (♮7)</span>
        ) : (
          <span>do (1) • re (2) • mi (3) • fa (4) • sol (5) • la (6) • ti (7)</span>
        )}
      </div>

      {/* Measures Layout */}
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
              {part.measures.map(measure => {
                const measureKey = measure.keySignature || parsedScore.keySignature;

                return (
                  <div 
                    key={measure.number}
                    className="p-4 sm:px-6 hover:bg-[#15151A] transition-colors flex flex-col md:flex-row md:items-start gap-3 md:gap-6"
                  >
                    {/* Measure Label & Key Indicator if changed */}
                    <div className="shrink-0 flex items-center gap-1.5 text-xs font-mono text-[#A78BFA] font-bold md:w-28 pt-1">
                      <Hash size={13} className="text-[#8B5CF6]" />
                      <span>M{measure.number}</span>
                      {measure.keySignature && measure.keySignature.name !== parsedScore.keySignature.name && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#8B5CF6]/20 text-[#A78BFA]">
                          {measure.keySignature.name}
                        </span>
                      )}
                    </div>

                    {/* Events & Syllables */}
                    <div className="flex-1 flex flex-wrap items-end gap-2 sm:gap-3">
                      {measure.events.length === 0 ? (
                        <span className="text-xs font-mono text-[#6E6E77] italic py-1">Rest</span>
                      ) : (
                        measure.events.map((event, eIdx) => {
                          const solfaText = formatEventSolfa(event, measureKey);
                          const isRest = event.isRest;
                          const isChord = event.isChord;

                          return (
                            <div 
                              key={`${measure.number}-${eIdx}`}
                              className={`flex flex-col items-center justify-between rounded-xl px-3 py-1.5 border transition-all ${
                                isRest
                                  ? 'bg-[#18181D]/60 border-[#27272D]/60 text-[#6E6E77] min-w-[50px]'
                                  : isChord
                                  ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/50 text-[#F4F1EA] min-w-[68px]'
                                  : 'bg-[#18181D] border-[#27272D] text-[#F4F1EA] hover:border-[#8B5CF6]/60 min-w-[54px]'
                              }`}
                            >
                              {/* Rhythmic Symbol & Pitch tooltip */}
                              <div className="flex items-center gap-1 text-xs font-mono text-[#9A9AA3]">
                                <span>{event.rhythmSymbol}</span>
                              </div>

                              {/* Sol-fa Syllable */}
                              <span className={`text-base font-mono font-extrabold my-0.5 tracking-tight ${
                                isRest 
                                  ? 'text-[#6E6E77] text-xs' 
                                  : isChord 
                                  ? 'text-[#C4B5FD]' 
                                  : 'text-[#F4F1EA]'
                              }`}>
                                {solfaText}
                              </span>

                              {/* Lyric syllable (if present in MusicXML) */}
                              {event.lyric ? (
                                <span className="text-[10px] font-sans text-[#67E8F9] italic mt-0.5 truncate max-w-[84px]">
                                  {event.lyric}
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-[#585863]">
                                  {event.notes.length === 1 && !isRest ? event.notes[0].pitch : ''}
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
