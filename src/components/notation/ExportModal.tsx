import React, { useState } from 'react';
import { Download, FileText, Music, Archive, Check, X } from 'lucide-react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { ScoreProject } from '../../types';
import { Button } from '../common/Button';

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

  const sanitizedFilename = (score.title || score.originalFilename || 'transcription')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');

  // 1. Export MusicXML (.musicxml)
  const handleExportMusicXml = () => {
    if (!score.rawMusicXml) return;
    setIsExporting('musicxml');
    try {
      const blob = new Blob([score.rawMusicXml], { type: 'application/vnd.recordare.musicxml+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizedFilename}.musicxml`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMessage('MusicXML file downloaded successfully.');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsExporting(null);
    }
  };

  // 2. Export Compressed MusicXML (.mxl)
  const handleExportMxl = async () => {
    if (!score.rawMusicXml) return;
    setIsExporting('mxl');
    try {
      const zip = new JSZip();
      
      // Standard MXL container descriptor
      const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    <rootfile full-path="score.xml" media-type="application/vnd.recordare.musicxml+xml"/>
  </rootfiles>
</container>`;

      zip.folder('META-INF')?.file('container.xml', containerXml);
      zip.file('score.xml', score.rawMusicXml);

      const content = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.recordare.musicxml' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizedFilename}.mxl`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMessage('Compressed MusicXML (.mxl) exported successfully.');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsExporting(null);
    }
  };

  // 3. Export PDF (All Pages / Complete rendered transcription)
  const handleExportPdf = async () => {
    setIsExporting('pdf');
    try {
      const svgElements = Array.from(document.querySelectorAll('#osmd-notation-canvas svg'));
      
      if (svgElements.length === 0) {
        // If notation SVGs not currently rendered, create document from scan pages
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        score.pages.forEach((pageUrl, idx) => {
          if (idx > 0) doc.addPage();
          doc.addImage(pageUrl, 'JPEG', 20, 20, width - 40, height - 40);
        });

        doc.save(`${sanitizedFilename}-transcription.pdf`);
        setSuccessMessage('PDF exported successfully.');
        return;
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      for (let i = 0; i < svgElements.length; i++) {
        if (i > 0) doc.addPage();
        
        const svg = svgElements[i] as SVGElement;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const svgBBox = svg.getBoundingClientRect();
        canvas.width = svgBBox.width * 2 || 1200;
        canvas.height = svgBBox.height * 2 || 1600;

        const img = new window.Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const URLObj = window.URL || window.webkitURL || window;
        const blobURL = URLObj.createObjectURL(svgBlob);

        await new Promise((resolve) => {
          img.onload = () => {
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            URLObj.revokeObjectURL(blobURL);
            resolve(true);
          };
          img.src = blobURL;
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgHeight = (canvas.height * (pageWidth - 40)) / canvas.width;
        doc.addImage(imgData, 'JPEG', 20, 20, pageWidth - 40, imgHeight);
      }

      doc.save(`${sanitizedFilename}-transcription.pdf`);
      setSuccessMessage('Complete multi-page PDF exported.');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsExporting(null);
    }
  };

  // 4. Export Current Page as PNG
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

      canvas.width = bbox.width * 2 || 1600;
      canvas.height = bbox.height * 2 || 2200;

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
      a.download = `${sanitizedFilename}-page-01.png`;
      a.click();
      setSuccessMessage('Current page downloaded as PNG.');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsExporting(null);
    }
  };

  // 5. Export All Pages as PNG ZIP
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

          canvas.width = bbox.width * 2 || 1600;
          canvas.height = bbox.height * 2 || 2200;

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
      } else if (score.pages && score.pages.length > 0) {
        score.pages.forEach((pUrl, i) => {
          const base64Data = pUrl.includes(',') ? pUrl.split(',')[1] : '';
          const pageNum = (i + 1).toString().padStart(2, '0');
          if (base64Data) {
            zip.file(`page-${pageNum}.png`, base64Data, { base64: true });
          }
        });
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `${sanitizedFilename}-pages.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      setSuccessMessage('All pages exported in ZIP package.');
    } catch (err: any) {
      console.error(err);
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
            <p className="text-xs text-[#9A9AA3] mt-1">
              Select an editable musical format or visual document export.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9A9AA3] hover:text-[#F4F1EA] hover:bg-[#18181D] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback alert */}
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
            {/* MusicXML */}
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
                <span className="font-bold text-sm text-[#F4F1EA]">MusicXML (.xml)</span>
                <span className="px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA] text-[10px] font-mono">
                  Standard
                </span>
              </div>
              <p className="text-[11px] text-[#9A9AA3] mt-2 leading-relaxed">
                Full uncompressed notation interchange format for Sibelius, Finale, Dorico & MuseScore.
              </p>
              <div className="text-[10px] font-mono text-[#A78BFA] mt-3 flex items-center gap-1 font-semibold">
                <Download size={12} />
                <span>{isExporting === 'musicxml' ? 'Exporting...' : 'Download MusicXML'}</span>
              </div>
            </button>

            {/* Compressed MXL */}
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
                <span className="px-1.5 py-0.5 rounded bg-[#67E8F9]/20 text-[#67E8F9] text-[10px] font-mono">
                  Archive
                </span>
              </div>
              <p className="text-[11px] text-[#9A9AA3] mt-2 leading-relaxed">
                Zip-compressed MusicXML package with standard container descriptor.
              </p>
              <div className="text-[10px] font-mono text-[#67E8F9] mt-3 flex items-center gap-1 font-semibold">
                <Download size={12} />
                <span>{isExporting === 'mxl' ? 'Packaging...' : 'Download MXL'}</span>
              </div>
            </button>
          </div>

          {/* MIDI Option (disabled when valid note stream not generated) */}
          <div className="p-3 rounded-xl border border-[#27272D]/60 bg-[#141418] flex items-center justify-between text-xs font-mono text-[#6E6E77]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#9A9AA3]">MIDI (.mid)</span>
              <span>• Raw note events</span>
            </div>
            <span className="text-[10px] text-[#FBBF24]">
              {hasMusicXml ? 'Supported via MusicXML import in DAWs' : 'MIDI unavailable'}
            </span>
          </div>
        </div>

        {/* SECTION 2: VISUAL FORMATS */}
        <div className="space-y-3 pt-2 border-t border-[#27272D]/60">
          <div className="text-xs font-mono uppercase tracking-wider text-[#A78BFA] font-semibold flex items-center gap-2">
            <FileText size={14} />
            <span>Visual Documents & Images</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* PDF (All Pages) */}
            <button
              onClick={handleExportPdf}
              disabled={isExporting !== null}
              className="p-3 rounded-xl bg-[#18181D] border border-[#27272D] hover:border-[#A78BFA] text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="font-bold text-xs text-[#F4F1EA] flex items-center justify-between">
                <span>PDF Document</span>
                <span className="text-[10px] font-mono text-[#4ADE80]">ALL PAGES</span>
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1">
                Typeset printable transcription score.
              </p>
              <span className="text-[10px] font-mono text-[#A78BFA] mt-2 font-semibold">
                {isExporting === 'pdf' ? 'Rendering...' : 'Export PDF →'}
              </span>
            </button>

            {/* Current Page PNG */}
            <button
              onClick={handleExportCurrentPng}
              disabled={isExporting !== null}
              className="p-3 rounded-xl bg-[#18181D] border border-[#27272D] hover:border-[#A78BFA] text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="font-bold text-xs text-[#F4F1EA]">
                Current Page PNG
              </div>
              <p className="text-[10px] text-[#9A9AA3] mt-1">
                Single high-res page image.
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
