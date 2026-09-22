import React, { useMemo, useRef, useState } from 'react';
import { Printer, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { ParsedScore } from '../../services/musicXmlParser';
import { layoutTonicSolfaDocument, SolfaSheetPage, SolfaSystem } from '../../services/solfaSheetLayout';
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Layout document pages using traditional Curwen tonic sol-fa rules
  const pages = useMemo<SolfaSheetPage[]>(() => {
    return layoutTonicSolfaDocument(parsedScore);
  }, [parsedScore]);

  const currentPage = pages[activePageIndex] || pages[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Sheet Controls Bar */}
      <div className="bg-[#111114] border border-[#27272D] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono font-bold text-[#F4F1EA]">
            <span>TONIC SOL-FA SCORE SHEET</span>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA]">
            A4 Print Layout
          </span>
          <span className="text-xs font-mono text-[#9A9AA3]">
            {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-[#18181D] border border-[#27272D] rounded-xl px-2 py-1 text-xs font-mono text-[#F4F1EA]">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
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
              Export Visual PDF / PNG
            </Button>
          )}
        </div>
      </div>

      {/* Pages Container */}
      <div 
        ref={containerRef}
        className="flex flex-col items-center gap-8 overflow-x-auto py-4 bg-[#0A0A0C] rounded-2xl p-4 sm:p-8 border border-[#27272D]/60 print:p-0 print:m-0 print:border-none print:bg-white"
      >
        {pages.map((page, pageIdx) => (
          <div
            key={`solfa-page-${page.pageNumber}`}
            id={`solfa-sheet-page-${page.pageNumber}`}
            className="solfa-sheet-page bg-[#FFFFFA] text-[#111111] shadow-2xl rounded-sm border border-[#E5E5E0] relative flex flex-col justify-between print:shadow-none print:border-none print:m-0"
            style={{
              width: '794px',
              minHeight: '1123px',
              padding: '48px 56px',
              transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
              transformOrigin: 'top center',
              fontFamily: '"Times New Roman", Times, Georgia, serif',
              pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto'
            }}
          >
            {/* Header (Top section on page 1, compact running header on later pages) */}
            {page.isFirstPage ? (
              <div className="border-b-2 border-black pb-4 mb-6 text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-black font-serif">
                  {page.header.title}
                </h1>
                <div className="text-xs font-semibold tracking-widest uppercase text-gray-700 font-sans">
                  {page.header.subtitle}
                </div>

                <div className="flex items-center justify-between text-xs pt-3 font-sans font-medium text-gray-900">
                  <div className="text-left space-y-0.5">
                    <div><span className="font-bold">Key:</span> {page.header.keySignature} ({page.header.dohPitch})</div>
                    <div><span className="font-bold">Time:</span> {page.header.timeSignature}</div>
                  </div>
                  {page.header.composer && (
                    <div className="text-right space-y-0.5">
                      <div><span className="font-bold">Composer:</span> {page.header.composer}</div>
                      {page.header.tempo && <div>M.M. ♩ = {page.header.tempo}</div>}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-b border-gray-400 pb-2 mb-6 flex items-center justify-between text-xs font-sans text-gray-600">
                <span className="font-bold uppercase">{page.header.title}</span>
                <span>Tonic Sol-Fa • Page {page.pageNumber}</span>
              </div>
            )}

            {/* Systems Layout */}
            <div className="flex-1 space-y-8">
              {page.systems.map((system) => (
                <div 
                  key={`system-${system.systemIndex}`}
                  className="space-y-1 relative"
                >
                  {/* System Measure Numbers Banner */}
                  <div className="flex items-center justify-between text-[11px] font-sans font-bold text-gray-600 pl-10 pr-2">
                    {system.voiceRows[0]?.measures.map((m) => (
                      <span key={`meas-num-${m.measureNumber}`} className="flex-1 text-left">
                        M{m.measureNumber}
                      </span>
                    ))}
                  </div>

                  {/* Systems Container */}
                  <div className="border-t border-b-2 border-black py-1.5 space-y-1.5">
                    {system.voiceRows.map((voiceRow) => (
                      <div 
                        key={voiceRow.partId}
                        className="flex items-center text-sm leading-none font-mono"
                      >
                        {/* Voice Label Column (S, A, T, B) */}
                        <div className="w-10 shrink-0 font-bold text-xs font-sans text-gray-900 uppercase">
                          {voiceRow.shortLabel}
                        </div>

                        {/* Measures & Beats */}
                        <div className="flex-1 flex items-center">
                          {voiceRow.measures.map((measure, mIdx) => (
                            <div 
                              key={`v-${voiceRow.partId}-m-${measure.measureNumber}`}
                              className={`flex-1 flex items-center justify-between px-1 border-r ${
                                measure.isEndBar ? 'border-r-4 border-black' : 'border-r border-black'
                              }`}
                            >
                              {/* Measure Initial Bar (on first measure of system) */}
                              {mIdx === 0 && (
                                <span className="font-bold text-black mr-1">|</span>
                              )}

                              {/* Beats in Measure */}
                              {measure.beats.map((beat, bIdx) => (
                                <React.Fragment key={`b-${bIdx}`}>
                                  <span 
                                    className={`flex-1 text-center font-bold tracking-normal ${
                                      beat.isSustained 
                                        ? 'text-gray-800 font-extrabold' 
                                        : 'text-black'
                                    }`}
                                  >
                                    {beat.text || ' '}
                                  </span>
                                  {/* Curwen Beat separator colon (between beats within measure) */}
                                  {bIdx < measure.beats.length - 1 && (
                                    <span className="text-gray-600 font-bold mx-0.5">:</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Aligned Lyrics Row (if present in score) */}
                  {system.lyricsRow && system.lyricsRow.some(lr => lr.lyricTexts.some(t => Boolean(t))) && (
                    <div className="flex items-center text-xs font-sans text-gray-800 italic pl-10 pr-2 pt-1">
                      {system.lyricsRow.map((lr) => (
                        <div key={`lyric-m-${lr.measureNumber}`} className="flex-1 flex items-center justify-between px-1">
                          {lr.lyricTexts.map((text, tIdx) => (
                            <span key={`lt-${tIdx}`} className="flex-1 text-center truncate px-0.5">
                              {text}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Document Footer */}
            <div className="border-t border-gray-400 pt-3 mt-8 flex items-center justify-between text-[10px] font-sans text-gray-600">
              <span>MUSIQ Optical Music Recognition</span>
              <span className="font-bold">
                Page {page.pageNumber} of {page.totalPages}
              </span>
              <span>Typeset via Movable-Do Engine</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
