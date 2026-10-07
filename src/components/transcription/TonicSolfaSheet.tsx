import React, { useMemo, useRef, useState } from 'react';
import {
  Printer,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Layers,
  CheckSquare,
  Square,
  Edit2,
  X,
  Maximize2
} from 'lucide-react';
import { ParsedScore, KeySignatureInfo } from '../../services/musicXmlParser';
import {
  layoutTonicSolfaDocument,
  inspectScoreStructure,
  SolfaSheetPage,
  TypesetOptions
} from '../../services/solfaSheetLayout';
import { Button } from '../common/Button';

interface TonicSolfaSheetProps {
  parsedScore: ParsedScore;
  onOpenExport?: () => void;
}

export const TonicSolfaSheet: React.FC<TonicSolfaSheetProps> = ({
  parsedScore,
  onOpenExport
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isStructureOpen, setIsStructureOpen] = useState<boolean>(false);

  // Customization state for Score Structure Panel
  const [excludedPartIds, setExcludedPartIds] = useState<string[]>([]);
  const [partLabelOverrides, setPartLabelOverrides] = useState<Record<string, string>>({});
  const [titleOverride, setTitleOverride] = useState<string>('');
  const [keyOverrideName, setKeyOverrideName] = useState<string>('');

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Inspect the detected score structure (Part → Staff → Voice)
  const scoreStructure = useMemo(() => {
    return inspectScoreStructure(parsedScore);
  }, [parsedScore]);

  // Typeset options passed to V3 engine
  const typesetOptions = useMemo<TypesetOptions>(() => {
    const opts: TypesetOptions = {
      excludedPartIds,
      partLabelOverrides: Object.keys(partLabelOverrides).length > 0 ? partLabelOverrides : undefined,
      titleOverride: titleOverride.trim() || undefined
    };
    return opts;
  }, [excludedPartIds, partLabelOverrides, titleOverride]);

  // Generate V3 pages
  const pages = useMemo<SolfaSheetPage[]>(() => {
    return layoutTonicSolfaDocument(parsedScore, typesetOptions);
  }, [parsedScore, typesetOptions]);

  const currentPage = pages[activePageIndex] || pages[0];

  const handlePrint = () => {
    window.print();
  };

  const togglePartInclusion = (partId: string) => {
    setExcludedPartIds(prev => {
      if (prev.includes(partId)) {
        return prev.filter(id => id !== partId);
      } else {
        // Prevent disabling all parts
        if (prev.length >= scoreStructure.length - 1) return prev;
        return [...prev, partId];
      }
    });
  };

  const handleLabelOverrideChange = (key: string, val: string) => {
    setPartLabelOverrides(prev => ({
      ...prev,
      [key]: val
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-[#111114] border border-[#27272D] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono font-bold text-[#F4F1EA]">
            <span>TONIC SOL-FA SCORE</span>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA]">
            A4 Print Layout
          </span>
          <span className="text-xs font-mono text-[#9A9AA3]">
            {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Score Structure Panel Toggle */}
          <button
            onClick={() => setIsStructureOpen(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 border transition-colors cursor-pointer ${
              isStructureOpen
                ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#A78BFA]'
                : 'bg-[#18181D] border-[#27272D] text-[#9A9AA3] hover:text-[#F4F1EA]'
            }`}
            title="Inspect & configure score structure (staves, voices, part labels)"
          >
            <Layers size={14} />
            <span>Score Structure</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-[#18181D] border border-[#27272D] rounded-xl px-2 py-1 text-xs font-mono text-[#F4F1EA]">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.1))}
              className="p-1 text-[#9A9AA3] hover:text-white cursor-pointer"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
              className="p-1 text-[#9A9AA3] hover:text-white cursor-pointer"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 text-[#9A9AA3] hover:text-white cursor-pointer ml-1 text-[10px]"
              title="Reset Zoom to 100%"
            >
              100%
            </button>
          </div>

          {/* Page Navigation for multi-page document */}
          {pages.length > 1 && (
            <div className="flex items-center gap-1 bg-[#18181D] border border-[#27272D] rounded-xl px-2 py-1 text-xs font-mono text-[#F4F1EA]">
              <button
                disabled={activePageIndex <= 0}
                onClick={() => setActivePageIndex(p => Math.max(0, p - 1))}
                className="p-1 text-[#9A9AA3] hover:text-white disabled:opacity-30 cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-1 text-[11px]">
                {activePageIndex + 1} / {pages.length}
              </span>
              <button
                disabled={activePageIndex >= pages.length - 1}
                onClick={() => setActivePageIndex(p => Math.min(pages.length - 1, p + 1))}
                className="p-1 text-[#9A9AA3] hover:text-white disabled:opacity-30 cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Native Print Trigger */}
          <Button
            variant="secondary"
            size="sm"
            icon={<Printer size={14} />}
            onClick={handlePrint}
          >
            Print
          </Button>

          {/* Export Modal Trigger */}
          {onOpenExport && (
            <Button
              variant="primary"
              size="sm"
              icon={<FileDown size={14} />}
              onClick={onOpenExport}
            >
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Score Structure Drawer / Configuration Panel */}
      {isStructureOpen && (
        <div className="bg-[#111114] border border-[#8B5CF6]/40 rounded-2xl p-5 space-y-4 shadow-xl print:hidden animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[#27272D] pb-3">
            <div>
              <h4 className="text-sm font-bold text-[#F4F1EA] flex items-center gap-2">
                <Layers size={16} className="text-[#A78BFA]" />
                <span>Score Structure & Part Configuration</span>
              </h4>
              <p className="text-xs text-[#9A9AA3] mt-0.5">
                Every recognized part and staff is included by default. Rename labels or toggle visibility below.
              </p>
            </div>
            <button
              onClick={() => setIsStructureOpen(false)}
              className="p-1 text-[#9A9AA3] hover:text-[#F4F1EA] cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Parts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scoreStructure.map(part => {
              const isExcluded = excludedPartIds.includes(part.id);
              const override = partLabelOverrides[part.id] || '';

              return (
                <div
                  key={part.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isExcluded
                      ? 'bg-[#18181D]/40 border-[#27272D] opacity-60'
                      : 'bg-[#18181D] border-[#383842]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => togglePartInclusion(part.id)}
                      className="flex items-center gap-2 text-xs font-semibold text-[#F4F1EA] cursor-pointer"
                    >
                      {isExcluded ? (
                        <Square size={15} className="text-[#6E6E77]" />
                      ) : (
                        <CheckSquare size={15} className="text-[#8B5CF6]" />
                      )}
                      <span>{part.name}</span>
                    </button>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#27272D] text-[#9A9AA3]">
                      {part.staves.length} {part.staves.length === 1 ? 'Staff' : 'Staves'}
                    </span>
                  </div>

                  {/* Staves breakdown */}
                  <div className="space-y-1.5 pl-6 border-l border-[#27272D] ml-2 text-xs font-mono text-[#9A9AA3]">
                    {part.staves.map(st => (
                      <div key={`st-${st.staffNumber}`} className="flex items-center justify-between text-[11px]">
                        <span>{st.label} ({st.clef})</span>
                        <span>{st.voices.length} Voice{st.voices.length === 1 ? '' : 's'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Custom Label Override Input */}
                  <div className="mt-3 pt-2 border-t border-[#27272D]/60 flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#6E6E77] shrink-0">Label:</span>
                    <input
                      type="text"
                      placeholder={part.name}
                      value={override}
                      onChange={e => handleLabelOverrideChange(part.id, e.target.value)}
                      className="w-full bg-[#111114] border border-[#27272D] focus:border-[#8B5CF6] rounded px-2 py-1 text-xs text-[#F4F1EA] focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pages Container */}
      <div
        ref={containerRef}
        className="flex flex-col items-center gap-8 overflow-x-auto py-6 bg-[#0A0A0C] rounded-2xl p-4 sm:p-8 border border-[#27272D]/60 print:p-0 print:m-0 print:border-none print:bg-white"
      >
        {pages.map((page, pageIdx) => (
          <div
            key={`solfa-page-${page.pageNumber}`}
            id={`solfa-sheet-page-${page.pageNumber}`}
            className="solfa-sheet-page bg-[#FFFFFA] text-[#111111] shadow-2xl rounded-sm border border-[#E5E5E0] relative flex flex-col justify-between print:shadow-none print:border-none print:m-0"
            style={{
              width: '794px',
              minHeight: '1123px',
              padding: '48px 52px',
              transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
              transformOrigin: 'top center',
              fontFamily: '"Times New Roman", Times, Georgia, serif',
              pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto'
            }}
          >
            {/* Header: Page 1 gets full musical title header; Page 2+ gets running header */}
            {page.isFirstPage ? (
              <div className="border-b-2 border-black pb-4 mb-6 space-y-2">
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-black font-serif">
                    {page.header.title}
                  </h1>
                  {page.header.subtitle && (
                    <div className="text-xs font-semibold tracking-widest uppercase text-gray-700 font-sans mt-0.5">
                      {page.header.subtitle}
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between text-xs pt-2 font-sans font-medium text-gray-900 border-t border-gray-300 mt-2">
                  <div className="text-left space-y-0.5">
                    <div>
                      <span className="font-bold">Key:</span> {page.header.keySignature} ({page.header.dohPitch})
                    </div>
                    <div>
                      <span className="font-bold">Time:</span> {page.header.timeSignature}
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    {page.header.composer && (
                      <div><span className="font-bold">Composer:</span> {page.header.composer}</div>
                    )}
                    {page.header.arranger && (
                      <div><span className="font-bold">Arr.:</span> {page.header.arranger}</div>
                    )}
                    {page.header.lyricist && (
                      <div><span className="font-bold">Words:</span> {page.header.lyricist}</div>
                    )}
                    {page.header.tempo && <div>M.M. ♩ = {page.header.tempo}</div>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-b border-gray-400 pb-2 mb-6 flex items-center justify-between text-xs font-sans text-gray-700">
                <span className="font-bold uppercase tracking-wide">{page.header.title}</span>
                <span>Page {page.pageNumber}</span>
              </div>
            )}

            {/* Systems Layout (Horizontal Systems of Rectangular Measure Cells) */}
            <div className="flex-1 space-y-7">
              {page.systems.map(system => (
                <div
                  key={`system-${system.systemIndex}`}
                  className="space-y-1 relative"
                >
                  {/* System Header Row: Rehearsal Marks, Tempos, Modulations & Measure Numbers */}
                  <div className="flex items-end font-sans text-xs text-gray-700 pl-24 pr-1">
                    {system.measureHeaders.map(mh => (
                      <div
                        key={`hdr-m-${mh.measureNumber}`}
                        style={{ width: `${mh.widthPercent}%` }}
                        className="px-1 flex flex-col justify-end"
                      >
                        {/* Upper Annotations (Rehearsal Marks, Directions, Modulations) */}
                        <div className="text-[10px] font-bold text-gray-900 flex items-center gap-1 leading-none mb-0.5 truncate">
                          {mh.rehearsalMark && (
                            <span className="border border-black px-1 py-0.2 rounded font-mono font-bold bg-gray-100">
                              {mh.rehearsalMark}
                            </span>
                          )}
                          {mh.directionWords && (
                            <span className="italic">{mh.directionWords}</span>
                          )}
                          {mh.modulationText && (
                            <span className="text-[#4C1D95] font-semibold">{mh.modulationText}</span>
                          )}
                          {mh.tempoBpm && (
                            <span className="font-mono">♩={mh.tempoBpm}</span>
                          )}
                        </div>

                        {/* Measure Number Box */}
                        <div className="text-[10px] font-mono font-semibold text-gray-500">
                          {mh.measureNumber}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Systems Container: Staves and Voices */}
                  <div className="border-t-2 border-b-2 border-black divide-y divide-gray-300">
                    {system.voiceRows.map(voiceRow => (
                      <div
                        key={voiceRow.rowId}
                        className="py-1"
                      >
                        {/* Voice Musical Notation Row */}
                        <div className="flex items-center text-sm leading-none font-sans">
                          {/* Part / Staff Label Column (e.g. Trumpet, Solo, Organ RH, S, A, T, B) */}
                          <div
                            className="w-24 shrink-0 font-bold text-xs font-sans text-gray-900 uppercase pr-2 truncate"
                            title={voiceRow.displayLabel}
                          >
                            {voiceRow.displayLabel}
                          </div>

                          {/* Measures in System with Rectangular Cells */}
                          <div className="flex-1 flex items-stretch">
                            {voiceRow.measures.map((measure, mIdx) => {
                              const headerInfo = system.measureHeaders[mIdx];
                              const widthPercent = headerInfo ? headerInfo.widthPercent : 100 / voiceRow.measures.length;

                              return (
                                <div
                                  key={`v-${voiceRow.rowId}-m-${measure.measureNumber}`}
                                  style={{ width: `${widthPercent}%` }}
                                  className={`flex items-center justify-between px-1 border-r ${
                                    measure.isEndBar
                                      ? 'border-r-4 border-black'
                                      : measure.isDoubleBar
                                      ? 'border-r-2 border-double border-black'
                                      : 'border-r border-black'
                                  }`}
                                >
                                  {/* Initial Barline for first measure */}
                                  {mIdx === 0 && (
                                    <span className="font-bold text-black mr-0.5">|</span>
                                  )}

                                  {/* If entire measure is a rest in this active voice */}
                                  {measure.isEntirelyRest ? (
                                    <div className="flex-1 text-center font-mono text-gray-400 font-bold">
                                      —
                                    </div>
                                  ) : (
                                    /* Beats in Measure */
                                    measure.beats.map((beat, bIdx) => (
                                      <React.Fragment key={`b-${bIdx}`}>
                                        <div
                                          className={`flex-1 flex items-center justify-center font-semibold text-center ${
                                            beat.isSustained
                                              ? 'text-gray-700 font-bold'
                                              : 'text-black'
                                          }`}
                                        >
                                          {/* Simultaneous Chords: Render stacked vertically */}
                                          {beat.isChord && beat.chordSyllables && beat.chordSyllables.length > 1 ? (
                                            <div className="flex flex-col items-center justify-center -space-y-0.5 leading-tight font-mono text-[13px]">
                                              {beat.chordSyllables.map((syl, sIdx) => (
                                                <span key={`syl-${sIdx}`} className="font-bold">
                                                  {syl}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            /* Single Note / Text / Sustained */
                                            <span className="font-mono text-sm font-bold tracking-tight">
                                              {beat.text || ' '}
                                            </span>
                                          )}
                                        </div>

                                        {/* Beat Delimiter Colon (between beats within measure) */}
                                        {bIdx < measure.beats.length - 1 && (
                                          <span className="text-gray-500 font-bold mx-0.5 select-none">:</span>
                                        )}
                                      </React.Fragment>
                                    ))
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Synchronized Lyrics Row (Directly underneath vocal voice that sings them) */}
                        {voiceRow.hasLyrics && voiceRow.lyricsRow && (
                          <div className="flex items-center text-xs font-sans text-gray-800 italic pl-24 pt-0.5">
                            {voiceRow.lyricsRow.map((lr, mIdx) => {
                              const headerInfo = system.measureHeaders[mIdx];
                              const widthPercent = headerInfo ? headerInfo.widthPercent : 100 / voiceRow.measures.length;

                              return (
                                <div
                                  key={`lyric-m-${lr.measureNumber}`}
                                  style={{ width: `${widthPercent}%` }}
                                  className="flex items-center justify-between px-1"
                                >
                                  {lr.lyricTexts.map((text, tIdx) => (
                                    <span
                                      key={`lt-${tIdx}`}
                                      className="flex-1 text-center truncate px-0.5 leading-tight font-medium"
                                      title={text}
                                    >
                                      {text}
                                    </span>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Document Footer */}
            <div className="border-t border-gray-400 pt-3 mt-6 flex items-center justify-between text-[10px] font-sans text-gray-500">
              <span>Generated with MUSIQ</span>
              <span className="font-bold">
                Page {page.pageNumber} of {page.totalPages}
              </span>
              <span>All Parts & Staves Preserved</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
