import React, { useState } from 'react';
import { Download, FileText, Music, Archive, Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import JSZip from 'jszip';
import { ScoreProject } from '../../types';
import { Button } from '../common/Button';
import { parseMusicXml } from '../../services/musicXmlParser';
import { generateNotesPlainText, generateSolfaPlainText } from '../../services/solfaEngine';
import {
  exportSolfaToPdf,
  exportSolfaPageToPng,
  exportSolfaAllPagesZip,
  exportScoreToPdf,
  exportScoreToPng,
  triggerDownload
} from '../../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: ScoreProject;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  score
}) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Professional base filename based on original source
  const sourceName = (score.originalFilename || score.title || 'Score')
    .replace(/\.[^/.]+$/, '')
    .trim();

  const hasMusicXml = Boolean(score.rawMusicXml);

  // Helper to wrap async export actions with progress and error handling
  const runExport = async (formatKey: string, exportFn: () => Promise<void>, successText: string) => {
    setIsExporting(formatKey);
    setErrorMessage(null);
    setSuccessMessage(null);
    setProgressMessage('Preparing export...');

    try {
      await exportFn();
      setSuccessMessage(successText);
    } catch (err: any) {
      console.error(`[Export ${formatKey} Error]`, err);
      setErrorMessage(err.message || "We couldn't create this export.");
    } finally {
      setIsExporting(null);
      setProgressMessage(null);
    }
  };

  // 1. MUSICAL DATA: MusicXML
  const handleExportMusicXml = () => {
    runExport('musicxml', async () => {
      if (!score.rawMusicXml) throw new Error('No MusicXML content available.');
      const blob = new Blob([score.rawMusicXml], {
        type: 'application/vnd.recordare.musicxml+xml;charset=utf-8'
      });
      triggerDownload(blob, `${sourceName} - MUSIQ.musicxml`);
    }, 'MusicXML file downloaded successfully.');
  };

  // 2. MUSICAL DATA: Compressed MXL
  const handleExportMxl = () => {
    runExport('mxl', async () => {
      if (!score.rawMusicXml) throw new Error('No MusicXML content available.');
      const zip = new JSZip();
      const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    <rootfile full-path="score.xml" media-type="application/vnd.recordare.musicxml+xml"/>
  </rootfiles>
</container>`;

      zip.folder('META-INF')?.file('container.xml', containerXml);
      zip.file('score.xml', score.rawMusicXml);

      const content = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.recordare.musicxml'
      });
      triggerDownload(content, `${sourceName} - MUSIQ.mxl`);
    }, 'Compressed MusicXML (.mxl) exported successfully.');
  };

  // 3. TEXT: Notes as TXT
  const handleExportNotesTxt = () => {
    runExport('notes-txt', async () => {
      if (!score.rawMusicXml) throw new Error('No MusicXML content available.');
      const parsed = parseMusicXml(score.rawMusicXml, sourceName);
      const text = generateNotesPlainText(parsed.title, parsed.keySignature, parsed.timeSignature, parsed.parts);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      triggerDownload(blob, `${sourceName} - MUSIQ-notes.txt`);
    }, 'Note-name transcription exported as text (.txt).');
  };

  // 4. TEXT: Sol-Fa as TXT
  const handleExportSolfaTxt = () => {
    runExport('solfa-txt', async () => {
      if (!score.rawMusicXml) throw new Error('No MusicXML content available.');
      const parsed = parseMusicXml(score.rawMusicXml, sourceName);
      const text = generateSolfaPlainText(parsed.title, parsed.keySignature, parsed.timeSignature, parsed.parts);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      triggerDownload(blob, `${sourceName} - MUSIQ-solfa.txt`);
    }, 'Tonic Sol-Fa transcription exported as text (.txt).');
  };

  // 5. SCORE DOCUMENT: PDF
  const handleExportScorePdf = () => {
    runExport('score-pdf', async () => {
      await exportScoreToPdf(sourceName, (msg) => setProgressMessage(msg));
    }, 'Score PDF document exported successfully.');
  };

  // 6. SCORE DOCUMENT: PNG
  const handleExportScorePng = () => {
    runExport('score-png', async () => {
      await exportScoreToPng(sourceName, (msg) => setProgressMessage(msg));
    }, 'Score PNG image exported successfully.');
  };

  // 7. TONIC SOL-FA DOCUMENT: PDF
  const handleExportSolfaPdf = () => {
    runExport('solfa-pdf', async () => {
      await exportSolfaToPdf(sourceName, (msg) => setProgressMessage(msg));
    }, 'Tonic Sol-Fa PDF document exported successfully.');
  };

  // 8. TONIC SOL-FA DOCUMENT: Current Page PNG
  const handleExportSolfaCurrentPng = () => {
    runExport('solfa-current-png', async () => {
      await exportSolfaPageToPng(1, sourceName, (msg) => setProgressMessage(msg));
    }, 'Sol-Fa page exported as high-res PNG.');
  };

  // 9. TONIC SOL-FA DOCUMENT: All Pages ZIP
  const handleExportSolfaAllZip = () => {
    runExport('solfa-zip', async () => {
      await exportSolfaAllPagesZip(sourceName, (msg) => setProgressMessage(msg));
    }, 'All Sol-Fa pages exported in ZIP archive.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#111114] border border-[#27272D] rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#27272D] pb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#A78BFA]">
              DOCUMENT EXPORT WORKSPACE
            </div>
            <h3 className="text-xl font-bold text-[#F4F1EA] mt-0.5">
              {score.title || score.originalFilename}
            </h3>
            <p className="text-xs text-[#9A9AA3] mt-1 font-mono">
              Output base: {sourceName} - MUSIQ.*
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9A9AA3] hover:text-[#F4F1EA] hover:bg-[#18181D] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Status Banners */}
        {progressMessage && (
          <div className="p-3.5 bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 rounded-xl text-xs text-[#C4B5FD] flex items-center gap-2.5">
            <RefreshCw size={15} className="animate-spin text-[#A78BFA] shrink-0" />
            <span className="font-mono font-semibold">{progressMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-[#4ADE80]/15 border border-[#4ADE80]/40 rounded-xl text-xs text-[#4ADE80] flex items-center gap-2">
            <Check size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-[#EF4444]/15 border border-[#EF4444]/40 rounded-xl text-xs text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SECTION 1: TONIC SOL-FA DOCUMENT (Printable Choral Sheet) */}
        <div className="space-y-2.5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#A78BFA] font-bold flex items-center gap-2">
            <FileText size={14} />
            <span>TONIC SOL-FA DOCUMENT (PRINTABLE SHEET)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sol-Fa PDF */}
            <button
              onClick={handleExportSolfaPdf}
              disabled={isExporting !== null}
              className="p-3.5 rounded-xl border bg-[#18181D] border-[#27272D] hover:border-[#8B5CF6] text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#F4F1EA]">Sol-Fa PDF</span>
                <span className="px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA] text-[9px] font-mono font-bold">
                  Print A4
                </span>
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1.5 leading-relaxed">
                Multi-page A4 choral sheet document.
              </p>
              <div className="text-[10px] font-mono text-[#A78BFA] mt-2.5 flex items-center gap-1 font-semibold">
                <Download size={11} />
                <span>{isExporting === 'solfa-pdf' ? 'Rendering...' : 'Download PDF'}</span>
              </div>
            </button>

            {/* Sol-Fa Current Page PNG */}
            <button
              onClick={handleExportSolfaCurrentPng}
              disabled={isExporting !== null}
              className="p-3.5 rounded-xl border bg-[#18181D] border-[#27272D] hover:border-[#8B5CF6] text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#F4F1EA]">Page PNG</span>
                <span className="px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA] text-[9px] font-mono font-bold">
                  2x Image
                </span>
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1.5 leading-relaxed">
                High-resolution single sheet page.
              </p>
              <div className="text-[10px] font-mono text-[#A78BFA] mt-2.5 flex items-center gap-1 font-semibold">
                <Download size={11} />
                <span>{isExporting === 'solfa-current-png' ? 'Capturing...' : 'Download PNG'}</span>
              </div>
            </button>

            {/* Sol-Fa All Pages ZIP */}
            <button
              onClick={handleExportSolfaAllZip}
              disabled={isExporting !== null}
              className="p-3.5 rounded-xl border bg-[#18181D] border-[#27272D] hover:border-[#8B5CF6] text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#F4F1EA]">All Pages ZIP</span>
                <Archive size={12} className="text-[#A78BFA]" />
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1.5 leading-relaxed">
                Every page as high-res PNG in archive.
              </p>
              <div className="text-[10px] font-mono text-[#A78BFA] mt-2.5 flex items-center gap-1 font-semibold">
                <Download size={11} />
                <span>{isExporting === 'solfa-zip' ? 'Packaging...' : 'Download ZIP'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 2: SCORE DOCUMENT (OSMD NOTATION) */}
        <div className="space-y-2.5 pt-2 border-t border-[#27272D]/60">
          <div className="text-xs font-mono uppercase tracking-wider text-[#67E8F9] font-bold flex items-center gap-2">
            <Music size={14} />
            <span>SCORE DOCUMENT (DIGITAL SHEET MUSIC)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Score PDF */}
            <button
              onClick={handleExportScorePdf}
              disabled={!hasMusicXml || isExporting !== null}
              className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                hasMusicXml 
                  ? 'bg-[#18181D] border-[#27272D] hover:border-[#67E8F9] cursor-pointer' 
                  : 'bg-[#18181D]/40 border-[#27272D]/50 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#F4F1EA]">Score PDF</span>
                <span className="px-1.5 py-0.5 rounded bg-[#67E8F9]/20 text-[#67E8F9] text-[9px] font-mono font-bold">
                  Vector
                </span>
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1.5 leading-relaxed">
                Rendered standard sheet music score document.
              </p>
              <div className="text-[10px] font-mono text-[#67E8F9] mt-2.5 flex items-center gap-1 font-semibold">
                <Download size={11} />
                <span>{isExporting === 'score-pdf' ? 'Rendering...' : 'Download Score PDF'}</span>
              </div>
            </button>

            {/* Score PNG */}
            <button
              onClick={handleExportScorePng}
              disabled={!hasMusicXml || isExporting !== null}
              className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                hasMusicXml 
                  ? 'bg-[#18181D] border-[#27272D] hover:border-[#67E8F9] cursor-pointer' 
                  : 'bg-[#18181D]/40 border-[#27272D]/50 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#F4F1EA]">Score PNG</span>
                <span className="px-1.5 py-0.5 rounded bg-[#67E8F9]/20 text-[#67E8F9] text-[9px] font-mono font-bold">
                  Image
                </span>
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1.5 leading-relaxed">
                High-resolution image capture of rendered score.
              </p>
              <div className="text-[10px] font-mono text-[#67E8F9] mt-2.5 flex items-center gap-1 font-semibold">
                <Download size={11} />
                <span>{isExporting === 'score-png' ? 'Capturing...' : 'Download Score PNG'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 3: TEXT TRANSCRIPTIONS */}
        <div className="space-y-2.5 pt-2 border-t border-[#27272D]/60">
          <div className="text-xs font-mono uppercase tracking-wider text-[#4ADE80] font-bold flex items-center gap-2">
            <FileText size={14} />
            <span>TEXT TRANSCRIPTIONS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Notes as TXT */}
            <button
              onClick={handleExportNotesTxt}
              disabled={!hasMusicXml || isExporting !== null}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                hasMusicXml 
                  ? 'bg-[#18181D] border-[#27272D] hover:border-[#4ADE80] cursor-pointer' 
                  : 'bg-[#18181D]/40 border-[#27272D]/50 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#F4F1EA]">Notes as TXT</span>
                <span className="px-1.5 py-0.5 rounded bg-[#4ADE80]/20 text-[#4ADE80] text-[9px] font-mono font-bold">
                  Pitches
                </span>
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1">
                Plain-text pitches (e.g. C4, [C4 E4 G4]), parts, and measures.
              </p>
              <div className="text-[10px] font-mono text-[#4ADE80] mt-2 flex items-center gap-1 font-semibold">
                <Download size={11} />
                <span>{isExporting === 'notes-txt' ? 'Exporting...' : 'Download Notes TXT'}</span>
              </div>
            </button>

            {/* Sol-Fa as TXT */}
            <button
              onClick={handleExportSolfaTxt}
              disabled={!hasMusicXml || isExporting !== null}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                hasMusicXml 
                  ? 'bg-[#18181D] border-[#27272D] hover:border-[#4ADE80] cursor-pointer' 
                  : 'bg-[#18181D]/40 border-[#27272D]/50 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#F4F1EA]">Sol-Fa as TXT</span>
                <span className="px-1.5 py-0.5 rounded bg-[#4ADE80]/20 text-[#4ADE80] text-[9px] font-mono font-bold">
                  Movable-Do
                </span>
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1">
                Movable-Do syllables (e.g. do re mi sol) formatted with measure bars.
              </p>
              <div className="text-[10px] font-mono text-[#4ADE80] mt-2 flex items-center gap-1 font-semibold">
                <Download size={11} />
                <span>{isExporting === 'solfa-txt' ? 'Exporting...' : 'Download Sol-Fa TXT'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 4: MUSICAL DATA (STANDARD INTERCHANGE) */}
        <div className="space-y-2.5 pt-2 border-t border-[#27272D]/60">
          <div className="text-xs font-mono uppercase tracking-wider text-[#FBBF24] font-bold flex items-center gap-2">
            <Music size={14} />
            <span>MUSICAL DATA (INTERCHANGE FORMATS)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* MusicXML */}
            <button
              onClick={handleExportMusicXml}
              disabled={!hasMusicXml || isExporting !== null}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                hasMusicXml 
                  ? 'bg-[#18181D] border-[#27272D] hover:border-[#FBBF24] cursor-pointer' 
                  : 'bg-[#18181D]/40 border-[#27272D]/50 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#F4F1EA]">MusicXML</span>
                <span className="px-1.5 py-0.5 rounded bg-[#FBBF24]/20 text-[#FBBF24] text-[9px] font-mono font-bold">
                  Standard
                </span>
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1">
                Notation interchange for MuseScore, Sibelius, Dorico & Finale.
              </p>
              <div className="text-[10px] font-mono text-[#FBBF24] mt-2 flex items-center gap-1 font-semibold">
                <Download size={11} />
                <span>{isExporting === 'musicxml' ? 'Exporting...' : 'Download .musicxml'}</span>
              </div>
            </button>

            {/* Compressed MXL */}
            <button
              onClick={handleExportMxl}
              disabled={!hasMusicXml || isExporting !== null}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                hasMusicXml 
                  ? 'bg-[#18181D] border-[#27272D] hover:border-[#FBBF24] cursor-pointer' 
                  : 'bg-[#18181D]/40 border-[#27272D]/50 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#F4F1EA]">Compressed (.mxl)</span>
                <span className="px-1.5 py-0.5 rounded bg-[#FBBF24]/20 text-[#FBBF24] text-[9px] font-mono font-bold">
                  Archive
                </span>
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1">
                Zip-compressed MusicXML package with container descriptor.
              </p>
              <div className="text-[10px] font-mono text-[#FBBF24] mt-2 flex items-center gap-1 font-semibold">
                <Download size={11} />
                <span>{isExporting === 'mxl' ? 'Packaging...' : 'Download .mxl'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#27272D]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
