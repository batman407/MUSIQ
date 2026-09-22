import fs from 'fs';
import path from 'path';
import jspdfPkg from 'jspdf';
const jsPDF = jspdfPkg.jsPDF || jspdfPkg;
import JSZip from 'jszip';

console.log('--- RUNNING VISUAL EXPORT PIPELINE TESTS ---\n');

let passed = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(msg);
  } else {
    passed++;
    console.log(`✅ PASS: ${msg}`);
  }
}

// 1. TEST MULTI-PAGE PDF GENERATION WITH jsPDF
const pdf = new jsPDF({
  orientation: 'portrait',
  unit: 'pt',
  format: 'a4'
});

const pageWidth = pdf.internal.pageSize.getWidth();
const pageHeight = pdf.internal.pageSize.getHeight();
assert(Math.round(pageWidth) === 595, 'A4 width in pt is ~595');
assert(Math.round(pageHeight) === 842, 'A4 height in pt is ~842');

pdf.setFont('times', 'bold');
pdf.setFontSize(22);
pdf.text('AUDIVERIS TEST SYMPHONY', pageWidth / 2, 60, { align: 'center' });

pdf.setFont('helvetica', 'normal');
pdf.setFontSize(12);
pdf.text('Tonic Sol-fa Transcription', pageWidth / 2, 80, { align: 'center' });
pdf.text('Key: G Major (Doh is G)  •  Time: 4/4', 50, 110);
pdf.text('Composer: W. A. Mozart', pageWidth - 50, 110, { align: 'right' });

// Add page 2
pdf.addPage();
pdf.text('Audiveris Test Symphony - Page 2', 50, 50);

const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
assert(pdfBuffer.length > 1000, `PDF generated with size ${pdfBuffer.length} bytes (>1KB)`);
assert(pdfBuffer.toString('utf-8', 0, 5) === '%PDF-', 'PDF file has valid %PDF- header');

const testPdfPath = path.resolve('scripts/test-output.pdf');
fs.writeFileSync(testPdfPath, pdfBuffer);
assert(fs.existsSync(testPdfPath), 'test-output.pdf successfully written to disk');

// 2. TEST ZIP GENERATION WITH JSZip
const zip = new JSZip();
zip.file('page-01.png', Buffer.from('fake-png-data-page-1'));
zip.file('page-02.png', Buffer.from('fake-png-data-page-2'));

const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
assert(zipBuffer.length > 200, `ZIP archive generated with size ${zipBuffer.length} bytes`);
assert(zipBuffer.toString('utf-8', 0, 4) === 'PK\x03\x04', 'ZIP file has valid PK header');

const testZipPath = path.resolve('scripts/test-output.zip');
fs.writeFileSync(testZipPath, zipBuffer);
assert(fs.existsSync(testZipPath), 'test-output.zip successfully written to disk');

// Clean up test outputs
fs.unlinkSync(testPdfPath);
fs.unlinkSync(testZipPath);

console.log(`\n🎉 ALL ${passed}/${total} EXPORT PIPELINE TESTS PASSED!\n`);
