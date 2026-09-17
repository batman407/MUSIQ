import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Base directories
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const JOBS_DIR = path.join(__dirname, 'jobs');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(JOBS_DIR, { recursive: true });

// Check Audiveris availability
let audiverisAvailable = false;
let audiverisVersion = 'unknown';
const AUDIVERIS_BIN = process.env.AUDIVERIS_BIN || 'audiveris';

try {
  const check = execSync(`${AUDIVERIS_BIN} -version`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  audiverisAvailable = true;
  audiverisVersion = check.trim();
} catch {
  audiverisAvailable = false;
  audiverisVersion = 'Audiveris binary not found on host PATH. Container deployment required.';
}

// Memory / disk job store
// Job statuses: 'uploaded' | 'preprocessing' | 'recognizing' | 'exporting' | 'completed' | 'failed'
const jobs = new Map();

// Configure Multer for binary file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const unique = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.xml', '.musicxml', '.mxl'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.includes('pdf') || file.mimetype.includes('image')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Expected PDF, PNG, or JPG.`));
    }
  }
});

// 1. GET /health
app.get('/health', (req, res) => {
  res.json({
    status: audiverisAvailable ? 'ok' : 'degraded',
    service: 'musiq-omr-backend',
    engine: 'Audiveris',
    audiverisAvailable,
    audiverisVersion,
    timestamp: new Date().toISOString()
  });
});

// 2. POST /jobs - accepts PDF, PNG, JPG/JPEG
app.post('/jobs', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No score file uploaded. Field "file" is required.' });
  }

  const jobId = crypto.randomUUID();
  const originalFilename = req.file.originalname;
  const inputFilePath = req.file.path;
  const mimeType = req.file.mimetype;
  const fileSize = req.file.size;
  const jobOutputDir = path.join(JOBS_DIR, jobId, 'output');
  fs.mkdirSync(jobOutputDir, { recursive: true });

  const jobRecord = {
    id: jobId,
    originalFilename,
    mimeType,
    fileSize,
    inputFilePath,
    outputDir: jobOutputDir,
    status: 'uploaded',
    progress: 0,
    stageMessage: 'File received by OMR backend',
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    musicXml: null
  };

  jobs.set(jobId, jobRecord);

  // If user uploaded a direct MusicXML / XML file, parse immediately
  const ext = path.extname(originalFilename).toLowerCase();
  if (ext === '.xml' || ext === '.musicxml') {
    try {
      const xmlContent = fs.readFileSync(inputFilePath, 'utf-8');
      jobRecord.status = 'completed';
      jobRecord.progress = 100;
      jobRecord.stageMessage = 'Structured MusicXML extracted';
      jobRecord.musicXml = xmlContent;
      jobRecord.updatedAt = new Date().toISOString();
      return res.status(201).json({ jobId, status: 'uploaded' });
    } catch (err) {
      jobRecord.status = 'failed';
      jobRecord.error = err.message;
      return res.status(201).json({ jobId, status: 'uploaded' });
    }
  }

  if (ext === '.mxl') {
    try {
      const zip = new AdmZip(inputFilePath);
      const zipEntries = zip.getEntries();
      let xmlEntry = zipEntries.find(e => e.entryName.endsWith('.xml') && !e.entryName.includes('container.xml'));
      if (!xmlEntry && zipEntries.length > 0) {
        xmlEntry = zipEntries.find(e => e.entryName.endsWith('.xml'));
      }
      if (xmlEntry) {
        jobRecord.status = 'completed';
        jobRecord.progress = 100;
        jobRecord.stageMessage = 'Compressed MusicXML (MXL) extracted';
        jobRecord.musicXml = xmlEntry.getData().toString('utf-8');
        jobRecord.updatedAt = new Date().toISOString();
        return res.status(201).json({ jobId, status: 'uploaded' });
      }
    } catch (err) {
      // Fall through to standard recognition
    }
  }

  // If Audiveris engine is not installed on host, report honestly
  if (!audiverisAvailable) {
    jobRecord.status = 'failed';
    jobRecord.error = 'Audiveris OMR engine binary is not installed or available on this host. Run containerized backend via Docker.';
    jobRecord.updatedAt = new Date().toISOString();
    return res.status(201).json({ jobId, status: 'uploaded' });
  }

  // Launch genuine Audiveris headless batch process
  // audiveris -batch -export -output <outputDir> <inputFile>
  jobRecord.status = 'preprocessing';
  jobRecord.stageMessage = 'Preparing document pages and contrast normalizing...';
  jobRecord.updatedAt = new Date().toISOString();

  const child = spawn(AUDIVERIS_BIN, [
    '-batch',
    '-export',
    '-output', jobOutputDir,
    inputFilePath
  ]);

  child.stdout.on('data', (data) => {
    const text = data.toString();
    console.log(`[Audiveris ${jobId}]`, text);
    if (text.includes('Page') || text.includes('step')) {
      jobRecord.status = 'recognizing';
      jobRecord.stageMessage = 'Recognizing staves, clefs, barlines and pitches...';
    } else if (text.includes('export') || text.includes('MusicXML')) {
      jobRecord.status = 'exporting';
      jobRecord.stageMessage = 'Exporting structured MusicXML...';
    }
    jobRecord.updatedAt = new Date().toISOString();
  });

  child.stderr.on('data', (data) => {
    console.warn(`[Audiveris ERR ${jobId}]`, data.toString());
  });

  child.on('close', (code) => {
    jobRecord.updatedAt = new Date().toISOString();
    if (code !== 0) {
      jobRecord.status = 'failed';
      jobRecord.error = `Audiveris process exited with non-zero exit code: ${code}`;
      return;
    }

    // Locate the generated .mxl or .xml file in jobOutputDir
    try {
      const files = fs.readdirSync(jobOutputDir);
      const mxlFile = files.find(f => f.endsWith('.mxl'));
      const xmlFile = files.find(f => f.endsWith('.xml') || f.endsWith('.musicxml'));

      if (mxlFile) {
        const zip = new AdmZip(path.join(jobOutputDir, mxlFile));
        const entries = zip.getEntries();
        const scoreEntry = entries.find(e => e.entryName.endsWith('.xml') && !e.entryName.includes('container.xml'));
        if (scoreEntry) {
          jobRecord.musicXml = scoreEntry.getData().toString('utf-8');
          jobRecord.status = 'completed';
          jobRecord.progress = 100;
          jobRecord.stageMessage = 'Recognition complete';
          return;
        }
      }

      if (xmlFile) {
        jobRecord.musicXml = fs.readFileSync(path.join(jobOutputDir, xmlFile), 'utf-8');
        jobRecord.status = 'completed';
        jobRecord.progress = 100;
        jobRecord.stageMessage = 'Recognition complete';
        return;
      }

      jobRecord.status = 'failed';
      jobRecord.error = 'Audiveris completed but no MusicXML output was produced.';
    } catch (err) {
      jobRecord.status = 'failed';
      jobRecord.error = `Failed reading OMR output: ${err.message}`;
    }
  });

  child.on('error', (err) => {
    jobRecord.status = 'failed';
    jobRecord.error = `Failed to spawn Audiveris: ${err.message}`;
    jobRecord.updatedAt = new Date().toISOString();
  });

  res.status(201).json({
    jobId,
    status: 'uploaded'
  });
});

// 3. GET /jobs/:id
app.get('/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    id: job.id,
    originalFilename: job.originalFilename,
    status: job.status,
    progress: job.progress,
    stageMessage: job.stageMessage,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  });
});

// 4. GET /jobs/:id/result
app.get('/jobs/:id/result', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status !== 'completed' || !job.musicXml) {
    return res.status(400).json({
      error: 'Job has not completed successfully',
      status: job.status,
      detail: job.error || job.stageMessage
    });
  }

  res.json({
    jobId: job.id,
    originalFilename: job.originalFilename,
    format: 'musicxml',
    musicXml: job.musicXml
  });
});

app.listen(PORT, () => {
  console.log(`[MUSIQ OMR Server] Running on port ${PORT}`);
  console.log(`[MUSIQ OMR Server] Audiveris status: ${audiverisAvailable ? 'AVAILABLE' : 'NOT CONNECTED'}`);
});
