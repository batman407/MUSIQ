/**
 * MUSIQ Document & Visual Export Service
 * Provides verified multi-page PDF generation, high-res PNG capture, and ZIP archives:
 * - Sol-Fa Document: PDF, Current Page PNG, All Pages ZIP
 * - Score Document: PDF, PNG
 */

import html2canvas from 'html2canvas';
import jspdfModule from 'jspdf';
import JSZip from 'jszip';

const jsPDF = (jspdfModule as any).jsPDF || jspdfModule;

export interface ExportProgressCallback {
  (stageMessage: string): void;
}

/**
 * Triggers a browser file download from Blob or URL
 */
export function triggerDownload(blobOrUrl: Blob | string, filename: string): void {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof blobOrUrl !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

/**
 * Render a DOM element to high-res HTMLCanvasElement using html2canvas
 */
export async function captureElementToCanvas(
  element: HTMLElement,
  scale = 2
): Promise<HTMLCanvasElement> {
  return await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFA',
    windowWidth: 1200
  });
}

/**
 * 1. Export Tonic Sol-Fa Multi-Page Document to PDF
 */
export async function exportSolfaToPdf(
  baseFilename: string,
  onProgress?: ExportProgressCallback
): Promise<void> {
  const pageElements = Array.from(document.querySelectorAll<HTMLElement>('.solfa-sheet-page'));
  if (pageElements.length === 0) {
    throw new Error('No Tonic Sol-Fa sheet pages found to export.');
  }

  onProgress?.('Preparing PDF document...');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pageElements.length; i++) {
    onProgress?.(`Rendering page ${i + 1} of ${pageElements.length}...`);
    if (i > 0) pdf.addPage();

    const canvas = await captureElementToCanvas(pageElements[i], 2);
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  }

  onProgress?.('Finalizing PDF download...');
  pdf.save(`${baseFilename} - MUSIQ Solfa.pdf`);
}

/**
 * 2. Export Single Page of Tonic Sol-Fa to High-Res PNG (2x)
 */
export async function exportSolfaPageToPng(
  pageNumber: number,
  baseFilename: string,
  onProgress?: ExportProgressCallback
): Promise<void> {
  const element = document.getElementById(`solfa-sheet-page-${pageNumber}`) 
    || document.querySelector<HTMLElement>('.solfa-sheet-page');

  if (!element) {
    throw new Error(`Page ${pageNumber} of Sol-Fa sheet not found.`);
  }

  onProgress?.(`Rendering Page ${pageNumber} at high resolution...`);
  const canvas = await captureElementToCanvas(element, 2);

  canvas.toBlob((blob) => {
    if (!blob) throw new Error('Failed to generate PNG blob.');
    const pageStr = pageNumber.toString().padStart(2, '0');
    triggerDownload(blob, `${baseFilename} - MUSIQ Solfa - Page ${pageStr}.png`);
  }, 'image/png');
}

/**
 * 3. Export All Pages of Tonic Sol-Fa to ZIP Archive
 */
export async function exportSolfaAllPagesZip(
  baseFilename: string,
  onProgress?: ExportProgressCallback
): Promise<void> {
  const pageElements = Array.from(document.querySelectorAll<HTMLElement>('.solfa-sheet-page'));
  if (pageElements.length === 0) {
    throw new Error('No Sol-Fa pages found to export.');
  }

  const zip = new JSZip();

  for (let i = 0; i < pageElements.length; i++) {
    onProgress?.(`Rendering page ${i + 1} of ${pageElements.length} for ZIP...`);
    const canvas = await captureElementToCanvas(pageElements[i], 2);
    const base64Data = canvas.toDataURL('image/png').split(',')[1];
    const pageStr = (i + 1).toString().padStart(2, '0');
    zip.file(`page-${pageStr}.png`, base64Data, { base64: true });
  }

  onProgress?.('Packaging ZIP archive...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(zipBlob, `${baseFilename} - MUSIQ Solfa Pages.zip`);
}

/**
 * 4. Export OSMD Score Document to PDF
 */
export async function exportScoreToPdf(
  baseFilename: string,
  onProgress?: ExportProgressCallback
): Promise<void> {
  const svgElements = Array.from(document.querySelectorAll<SVGElement>('#osmd-notation-canvas svg'));
  if (svgElements.length === 0) {
    throw new Error('No rendered musical notation found in SCORE tab.');
  }

  onProgress?.('Preparing Score PDF...');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < svgElements.length; i++) {
    onProgress?.(`Rendering score page ${i + 1} of ${svgElements.length}...`);
    if (i > 0) pdf.addPage();

    const svg = svgElements[i];
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const bbox = svg.getBoundingClientRect();

    canvas.width = (bbox.width || 1200) * 2;
    canvas.height = (bbox.height || 1600) * 2;

    const img = new window.Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = URL.createObjectURL(svgBlob);

    await new Promise((resolve, reject) => {
      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        URL.revokeObjectURL(blobURL);
        resolve(true);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(blobURL);
        reject(new Error('Failed to rasterize score SVG'));
      };
      img.src = blobURL;
    });

    const imgData = canvas.toDataURL('image/png');
    const margin = 20;
    const renderWidth = pdfWidth - (margin * 2);
    const renderHeight = (canvas.height * renderWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', margin, margin, renderWidth, Math.min(renderHeight, pdfHeight - (margin * 2)));
  }

  onProgress?.('Finalizing Score PDF download...');
  pdf.save(`${baseFilename} - MUSIQ Score.pdf`);
}

/**
 * 5. Export OSMD Score Document to High-Res PNG
 */
export async function exportScoreToPng(
  baseFilename: string,
  onProgress?: ExportProgressCallback
): Promise<void> {
  const svg = document.querySelector<SVGElement>('#osmd-notation-canvas svg');
  if (!svg) {
    throw new Error('No rendered notation canvas available to export.');
  }

  onProgress?.('Capturing score notation image...');
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const bbox = svg.getBoundingClientRect();

  canvas.width = (bbox.width || 1200) * 2;
  canvas.height = (bbox.height || 1600) * 2;

  const img = new window.Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const blobURL = URL.createObjectURL(svgBlob);

  await new Promise((resolve, reject) => {
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      URL.revokeObjectURL(blobURL);
      resolve(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobURL);
      reject(new Error('Failed to rasterize notation SVG'));
    };
    img.src = blobURL;
  });

  canvas.toBlob((blob) => {
    if (!blob) throw new Error('Failed to create PNG blob.');
    triggerDownload(blob, `${baseFilename} - MUSIQ Score.png`);
  }, 'image/png');
}
