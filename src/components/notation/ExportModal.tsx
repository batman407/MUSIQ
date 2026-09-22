import React, { useState } from 'react';
import { Download, FileText, Music, Archive, Check, X, Clock } from 'lucide-react';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import { ScoreProject } from '../../types';
import { Button } from '../common/Button';
import { parseMusicXml } from '../../services/musicXmlParser';
import { generateNotesPlainText, generateSolfaPlainText } from '../../services/solfaEngine';

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Clean base name based on source file (e.g., "Music test piece.pdf" -> "Music test piece")
  const sourceName = (score.originalFilename || score.title || 'Score')
    .replace(/\.[^/.]+$/, '')
    .trim();

  // 1. Export MusicXML (.musicxml) — Requirement 15
  const handleExportMusicXml = () => {
    if (!score.rawMusicXml) return;
    setIsExporting('musicxml');
    try {
      const blob = new Blob([score.rawMusicXml], {
        type: 'application/vnd.recordare.musicxml+xml;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sourceName} - MUSIQ.musicxml`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMessage('MusicXML file downloaded successfully.');
    } catch (err: any) {
      console.error('[Export MusicXML Error]', err);
    } finally {
      setIsExporting(null);
    }
  };

  // 2. Export Compressed MusicXML (.mxl) — Requirement 16
  const handleExportMxl = async () => {
    if (!score.rawMusicXml) return;
    setIsExporting('mxl');
    try {
      const zip = new JSZip();

      // Standard MusicXML MXL container descriptor
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
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sourceName} - MUSIQ.mxl`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMessage('Compressed MusicXML (.mxl) exported successfully.');
    } catch (err: any) {
      console.error('[Export MXL Error]', err);
    } finally {
      setIsExporting(null);
    }
  };

  // 3. Export PDF Document (.pdf) — Requirement 17
  const handleExportPdf = async () => {
    setIsExporting('pdf');
    try {
      const svgElements = Array.from(document.querySelectorAll('#osmd-notation-canvas svg'));
      if (svgElements.length === 0) {
        throw new Error('No notation rendered to export.');
      }
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < svgElements.length; i++) {
        if (i > 0) pdf.addPage();
        const svg = svgElements[i] as SVGElement;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const bbox = svg.getBoundingClientRect();

        canvas.width = (bbox.width || 1200) * 2;
        canvas.height = (bbox.height || 1600) * 2;

        const img = new window.Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const blobURL = URL.createObjectURL(svgBlob);

        await new Promise((resolve) => {
          img.onload = () => {
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            URL.revokeObjectURL(blobURL);
            resolve(true);
          };
          img.src = blobURL;
        });

        const imgData = canvas.toDataURL('image/png');
        const margin = 20;
        const renderWidth = pdfWidth - (margin * 2);
        const renderHeight = (canvas.height * renderWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', margin, margin, renderWidth, Math.min(renderHeight, pdfHeight - (margin * 2)));
      }

      pdf.save(`${sourceName} - MUSIQ.pdf`);
      setSuccessMessage('Score exported as PDF document successfully.');
    } catch (err: any) {
      console.error('[Export PDF Error]', err);
    } finally {
      setIsExporting(null);
    }
  };

  // 4. Export Current Page / Notation Canvas as PNG — Requirement 18
  const handleExportCurrentPng = async () => {
    setIsExporting('png-current');
    try {
      const svg = document.querySelector('#osmd-notation-canvas svg') as SVGElement | null;
      if (!svg) {
        throw new Error('No rendered notation canvas available to capture.');
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const bbox = svg.getBoundingClientRect();

      canvas.width = (bbox.width || 1200) * 2;
      canvas.height = (bbox.height || 1600) * 2;

      const img = new window.Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(svgBlob);

      await new Promise((resolve) => {
        img.onload = () => {
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          URL.revokeObjectURL(blobURL);
          resolve(true);
        };
        img.src = blobURL;
      });

      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${sourceName} - MUSIQ.png`;
      a.click();
      setSuccessMessage('Notation view downloaded as PNG image.');
    } catch (err: any) {
      console.error('[Export PNG Error]', err);
    } finally {
      setIsExporting(null);
    }
  };

  // 4. Export All Rendered Notation Pages as PNG ZIP
  const handleExportAllPngZip = async () => {
    setIsExporting('png-zip');
    try {
      const zip = new JSZip();
      const svgElements = Array.from(document.querySelectorAll('#osmd-notation-canvas svg'));

      if (svgElements.length > 0) {
        for (let i = 0; i < svgElements.length; i++) {
          const svg = svgElements[i] as SVGElement;
          const svgData = new XMLSerializer().serializeToString(svg);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const bbox = svg.getBoundingClientRect();

          canvas.width = (bbox.width || 1200) * 2;
          canvas.height = (bbox.height || 1600) * 2;

          const img = new window.Image();
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const blobURL = URL.createObjectURL(svgBlob);

          await new Promise((resolve) => {
            img.onload = () => {
              if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              }
              URL.revokeObjectURL(blobURL);
              resolve(true);
            };
            img.src = blobURL;
          });

          const base64Data = canvas.toDataURL('image/png').split(',')[1];
          const pageNum = (i + 1).toString().padStart(2, '0');
          zip.file(`page-${pageNum}.png`, base64Data, { base64: true });
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `${sourceName} - MUSIQ-pages.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      setSuccessMessage('All pages exported in ZIP archive.');
    } catch (err: any) {
      console.error('[Export ZIP Error]', err);
    } finally {
      setIsExporting(null);
    }
  };

  // 5. Export Notes as TXT — Requirement 18
  const handleExportNotesTxt = () => {
    if (!score.rawMusicXml) return;
    setIsExporting('notes-txt');
    try {
      const parsed = parseMusicXml(score.rawMusicXml, sourceName);
      const text = generateNotesPlainText(parsed.title, parsed.keySignature, parsed.timeSignature, parsed.parts);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sourceName} - MUSIQ-notes.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMessage('Note-name transcription exported as text (.txt).');
    } catch (err: any) {
      console.error('[Export Notes TXT Error]', err);
    } finally {
      setIsExporting(null);
    }
  };

  // 6. Export Tonic Sol-Fa as TXT — Requirement 19
  const handleExportSolfaTxt = () => {
    if (!score.rawMusicXml) return;
    setIsExporting('solfa-txt');
    try {
      const parsed = parseMusicXml(score.rawMusicXml, sourceName);
      const text = generateSolfaPlainText(parsed.title, parsed.keySignature, parsed.timeSignature, parsed.parts);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sourceName} - MUSIQ-solfa.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMessage('Tonic Sol-Fa transcription exported as text (.txt).');
    } catch (err: any) {
      console.error('[Export Solfa TXT Error]', err);
    } finally {
      setIsExporting(null);
    }
  };

  const hasMusicXml = Boolean(score.rawMusicXml);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111114] border border-[#27272D] rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#27272D] pb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#A78BFA]">
              EXPORT TRANSCRIPTION
            </div>
            <h3 className="text-xl font-bold text-[#F4F1EA] mt-0.5">
              {score.title || score.originalFilename}
            </h3>
            <p className="text-xs text-[#9A9AA3] mt-1 font-mono">
              Output filename: {sourceName} - MUSIQ.*
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

        {/* Feedback Alert */}
        {successMessage && (
          <div className="p-3 bg-[#4ADE80]/15 border border-[#4ADE80]/40 rounded-xl text-xs text-[#4ADE80] flex items-center gap-2">
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* SECTION 1: MUSICAL & EDITABLE FORMATS */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-[#67E8F9] font-semibold flex items-center gap-2">
            <Music size={14} />
            <span>Musical & Editable Formats</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* MusicXML (.musicxml) */}
            <button
              onClick={handleExportMusicXml}
              disabled={!hasMusicXml || isExporting !== null}
              className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                hasMusicXml 
                  ? 'bg-[#18181D] border-[#27272D] hover:border-[#8B5CF6] hover:bg-[#1F1F26] cursor-pointer' 
                  : 'bg-[#18181D]/40 border-[#27272D]/50 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#F4F1EA]">MusicXML</span>
                <span className="px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA] text-[10px] font-mono font-bold">
                  Standard
                </span>
              </div>
              <p className="text-[11px] text-[#9A9AA3] mt-2 leading-relaxed">
                Full uncompressed notation interchange format for MuseScore, Sibelius, Finale & Dorico.
              </p>
              <div className="text-[10px] font-mono text-[#A78BFA] mt-3 flex items-center gap-1 font-semibold">
                <Download size={12} />
                <span>{isExporting === 'musicxml' ? 'Exporting...' : 'Download .musicxml'}</span>
              </div>
            </button>

            {/* Compressed MXL (.mxl) */}
            <button
              onClick={handleExportMxl}
              disabled={!hasMusicXml || isExporting !== null}
              className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                hasMusicXml 
                  ? 'bg-[#18181D] border-[#27272D] hover:border-[#8B5CF6] hover:bg-[#1F1F26] cursor-pointer' 
                  : 'bg-[#18181D]/40 border-[#27272D]/50 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#F4F1EA]">Compressed (.mxl)</span>
                <span className="px-1.5 py-0.5 rounded bg-[#67E8F9]/20 text-[#67E8F9] text-[10px] font-mono font-bold">
                  Archive
                </span>
              </div>
              <p className="text-[11px] text-[#9A9AA3] mt-2 leading-relaxed">
                Zip-compressed MusicXML package with standard container descriptor.
              </p>
              <div className="text-[10px] font-mono text-[#67E8F9] mt-3 flex items-center gap-1 font-semibold">
                <Download size={12} />
                <span>{isExporting === 'mxl' ? 'Packaging...' : 'Download .mxl'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 2: HUMAN-READABLE TEXT TRANSCRIPTIONS */}
        <div className="space-y-3 pt-2 border-t border-[#27272D]/60">
          <div className="text-xs font-mono uppercase tracking-wider text-[#4ADE80] font-semibold flex items-center gap-2">
            <FileText size={14} />
            <span>Human-Readable Text Transcriptions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Notes as TXT */}
            <button
              onClick={handleExportNotesTxt}
              disabled={!hasMusicXml || isExporting !== null}
              className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                hasMusicXml
                  ? 'bg-[#18181D] border-[#27272D] hover:border-[#4ADE80] hover:bg-[#1F1F26] cursor-pointer'
                  : 'bg-[#18181D]/40 border-[#27272D]/50 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#F4F1EA]">Notes as TXT</span>
                <span className="px-1.5 py-0.5 rounded bg-[#4ADE80]/20 text-[#4ADE80] text-[10px] font-mono font-bold">
                  Pitches
                </span>
              </div>
              <p className="text-[11px] text-[#9A9AA3] mt-2 leading-relaxed">
                Plain-text transcription with pitch names (e.g. C4, D4, [C4 E4 G4]), parts, and measures.
              </p>
              <div className="text-[10px] font-mono text-[#4ADE80] mt-3 flex items-center gap-1 font-semibold">
                <Download size={12} />
                <span>{isExporting === 'notes-txt' ? 'Exporting...' : 'Download Notes TXT'}</span>
              </div>
            </button>

            {/* Sol-Fa as TXT */}
            <button
              onClick={handleExportSolfaTxt}
              disabled={!hasMusicXml || isExporting !== null}
              className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                hasMusicXml
                  ? 'bg-[#18181D] border-[#27272D] hover:border-[#67E8F9] hover:bg-[#1F1F26] cursor-pointer'
                  : 'bg-[#18181D]/40 border-[#27272D]/50 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#F4F1EA]">Sol-Fa as TXT</span>
                <span className="px-1.5 py-0.5 rounded bg-[#67E8F9]/20 text-[#67E8F9] text-[10px] font-mono font-bold">
                  Movable-Do
                </span>
              </div>
              <p className="text-[11px] text-[#9A9AA3] mt-2 leading-relaxed">
                Complete Tonic Sol-Fa transcription (e.g. do re mi sol, [do mi sol]) aligned by measure.
              </p>
              <div className="text-[10px] font-mono text-[#67E8F9] mt-3 flex items-center gap-1 font-semibold">
                <Download size={12} />
                <span>{isExporting === 'solfa-txt' ? 'Exporting...' : 'Download Sol-Fa TXT'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION 2: VISUAL FORMATS */}
        <div className="space-y-3 pt-2 border-t border-[#27272D]/60">
          <div className="text-xs font-mono uppercase tracking-wider text-[#A78BFA] font-semibold flex items-center gap-2">
            <FileText size={14} />
            <span>Visual Documents & Images</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* PDF Export (.pdf) — Requirement 17 */}
            <button
              onClick={handleExportPdf}
              disabled={isExporting !== null}
              className="p-3 rounded-xl bg-[#18181D] border border-[#27272D] hover:border-[#8B5CF6] text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="font-bold text-xs text-[#F4F1EA] flex items-center justify-between">
                <span>PDF Document</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA] font-bold">
                  Print
                </span>
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1.5">
                Formatted multi-page sheet music PDF ready for printing.
              </p>
              <span className="text-[10px] font-mono text-[#A78BFA] mt-2 font-semibold flex items-center gap-1">
                <Download size={11} />
                <span>{isExporting === 'pdf' ? 'Generating PDF...' : 'Download PDF'}</span>
              </span>
            </button>

            {/* Current Page PNG (Requirement 18) */}
            <button
              onClick={handleExportCurrentPng}
              disabled={isExporting !== null}
              className="p-3 rounded-xl bg-[#18181D] border border-[#27272D] hover:border-[#A78BFA] text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="font-bold text-xs text-[#F4F1EA]">
                Current Page PNG
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1">
                High-resolution notation image.
              </p>
              <span className="text-[10px] font-mono text-[#A78BFA] mt-2 font-semibold">
                {isExporting === 'png-current' ? 'Capturing...' : 'Download PNG →'}
              </span>
            </button>

            {/* All Pages PNG ZIP */}
            <button
              onClick={handleExportAllPngZip}
              disabled={isExporting !== null}
              className="p-3 rounded-xl bg-[#18181D] border border-[#27272D] hover:border-[#A78BFA] text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="font-bold text-xs text-[#F4F1EA] flex items-center justify-between">
                <span>All Pages ZIP</span>
                <Archive size={12} className="text-[#A78BFA]" />
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1">
                Every page as individual PNG.
              </p>
              <span className="text-[10px] font-mono text-[#A78BFA] mt-2 font-semibold">
                {isExporting === 'png-zip' ? 'Packaging...' : 'Download ZIP →'}
              </span>
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
