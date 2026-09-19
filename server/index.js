import express from 'express';
import cors from 'cors';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import crypto from 'crypto';
import {
  isSupabaseEnabled,
  createScoreProject,
  updateScoreProjectStatus,
  createTranscriptionJob,
  updateTranscriptionJob,
  createTranscriptionResult,
  uploadToStorage
} from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);
const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS || '3', 10);
const JOB_CLEANUP_MINUTES = parseInt(process.env.JOB_CLEANUP_MINUTES || '60', 10);

// ============================================================
// Security Middleware
// ============================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS — configurable origin for production
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const corsOrigins = CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map(s => s.trim());

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

app.use(express.json({ limit: '1mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload rate limit exceeded. Please try again later.' }
});

app.use('/health', apiLimiter);
app.use('/jobs', uploadLimiter);

// ============================================================
// Base Directories
// ============================================================

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const JOBS_DIR = path.join(__dirname, 'jobs');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(JOBS_DIR, { recursive: true });

// ============================================================
// Audiveris Detection — uses -help (not -version which doesn't exist)
// ============================================================

let audiverisAvailable = false;
let audiverisVersion = 'unknown';
const AUDIVERIS_BIN = process.env.AUDIVERIS_BIN || 'audiveris';

function detectAudiveris() {
  try {
    // Audiveris has no -version flag. -help prints version info and exits.
    const helpOutput = execSync(`"${AUDIVERIS_BIN}" -help`, {
      encoding: 'utf-8',
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Parse version from help output — typically contains "Audiveris X.Y.Z" or version number
    audiverisAvailable = true;
    const versionMatch = helpOutput.match(/[Aa]udiveris\s+(\d+\.\d+(?:\.\d+)?)/i)
      || helpOutput.match(/(\d+\.\d+\.\d+)/);
    audiverisVersion = versionMatch ? versionMatch[1] : 'detected';
    log('info', `Audiveris detected: v${audiverisVersion}`);
  } catch (err) {
    // -help may exit with code 1 on some builds but still print version
    const output = (err.stdout || '') + (err.stderr || '');
    if (output.toLowerCase().includes('audiveris') || output.match(/\d+\.\d+/)) {
      audiverisAvailable = true;
      const versionMatch = output.match(/[Aa]udiveris\s+(\d+\.\d+(?:\.\d+)?)/i)
        || output.match(/(\d+\.\d+\.\d+)/);
      audiverisVersion = versionMatch ? versionMatch[1] : 'detected';
      log('info', `Audiveris detected (from stderr): v${audiverisVersion}`);
    } else {
      audiverisAvailable = false;
      audiverisVersion = 'not found';
      log('warn', 'Audiveris binary not found. Container deployment required.');
    }
  }
}

detectAudiveris();

// ============================================================
// Structured Logging
// ============================================================

function log(level, message, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'musiq-omr-backend',
    message,
    ...data
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// ============================================================
// In-Memory Job Store
// Job statuses: 'queued' | 'processing' | 'completed' | 'failed'
// ============================================================

const jobs = new Map();
let activeJobCount = 0;

// ============================================================
// File Type Validation
// ============================================================

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
];

// Magic byte signatures
const MAGIC_BYTES = {
  pdf: Buffer.from([0x25, 0x50, 0x44, 0x46]),     // %PDF
  png: Buffer.from([0x89, 0x50, 0x4E, 0x47]),     // .PNG
  jpg: Buffer.from([0xFF, 0xD8, 0xFF])              // JPEG SOI
};

function validateFileType(filePath, declaredMimeType) {
  try {
    const header = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, header, 0, 8, 0);
    fs.closeSync(fd);

    if (header.subarray(0, 4).equals(MAGIC_BYTES.pdf)) return 'application/pdf';
    if (header.subarray(0, 4).equals(MAGIC_BYTES.png)) return 'image/png';
    if (header.subarray(0, 3).equals(MAGIC_BYTES.jpg)) return 'image/jpeg';

    // If magic bytes don't match any known type, reject
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// Multer Configuration — Safe File Upload
// ============================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // NEVER use user-provided filenames — always generate safe UUID
    const unique = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    // Validate extension is allowed
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Unsupported file extension: ${ext}`));
    }
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Accepted: PDF, PNG, JPG/JPEG.`));
    }
  }
});

// ============================================================
// Recursive output file search
// Audiveris creates: {outputDir}/{inputFileStem}/ containing .mxl/.xml files
// ============================================================

function findOutputFiles(dir) {
  const results = { mxl: null, xml: null };

  function walk(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        if (lower.endsWith('.mxl') && !results.mxl) {
          results.mxl = fullPath;
        } else if ((lower.endsWith('.musicxml') || lower.endsWith('.xml')) && !results.xml) {
          // Skip container.xml (found inside MXL archives, not standalone output)
          if (!lower.includes('container.xml') && !lower.includes('meta-inf')) {
            results.xml = fullPath;
          }
        }
      }
    }
  }

  walk(dir);
  return results;
}

// ============================================================
// Safe Cleanup
// ============================================================

function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    log('warn', `Cleanup failed: ${filePath}`, { error: err.message });
  }
}

function cleanupDir(dirPath) {
  try {
    if (dirPath && fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    log('warn', `Dir cleanup failed: ${dirPath}`, { error: err.message });
  }
}

// Periodic cleanup of completed/failed jobs older than threshold
if (JOB_CLEANUP_MINUTES > 0) {
  setInterval(() => {
    const cutoff = Date.now() - (JOB_CLEANUP_MINUTES * 60 * 1000);
    for (const [jobId, job] of jobs.entries()) {
      if ((job.status === 'completed' || job.status === 'failed') &&
          new Date(job.createdAt).getTime() < cutoff) {
        // Clean files
        cleanupFile(job.inputFilePath);
        cleanupDir(job.outputDir);
        jobs.delete(jobId);
        log('info', `Cleaned up job ${jobId}`);
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
}

// ============================================================
// Error Handler — strips stack traces in production
// ============================================================

function sanitizeError(err) {
  if (NODE_ENV === 'production') {
    return { error: err.message || 'Internal server error' };
  }
  return { error: err.message, stack: err.stack };
}

// ============================================================
// ROUTES
// ============================================================

// 1. GET /health — Verify API + Audiveris availability
app.get('/health', (req, res) => {
  // Re-check Audiveris on every health call to detect runtime changes
  detectAudiveris();

  const status = audiverisAvailable ? 'ok' : 'unhealthy';
  const httpCode = audiverisAvailable ? 200 : 503;

  res.status(httpCode).json({
    status,
    service: 'musiq-omr-backend',
    omr: 'audiveris',
    audiverisAvailable,
    audiverisVersion,
    supabaseConnected: isSupabaseEnabled(),
    activeJobs: activeJobCount,
    maxConcurrentJobs: MAX_CONCURRENT_JOBS,
    timestamp: new Date().toISOString()
  });
});

// 2. POST /jobs — Accept multipart score file, start real OMR
app.post('/jobs', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No score file uploaded. Field "file" is required.' });
    }

    const inputFilePath = req.file.path;

    // Validate magic bytes match declared type
    const actualType = validateFileType(inputFilePath, req.file.mimetype);
    if (!actualType) {
      cleanupFile(inputFilePath);
      return res.status(400).json({
        error: 'File content does not match a supported type (PDF, PNG, JPG). File rejected.'
      });
    }

    // Concurrency check
    if (activeJobCount >= MAX_CONCURRENT_JOBS) {
      cleanupFile(inputFilePath);
      return res.status(429).json({
        error: `Server is processing ${activeJobCount} jobs. Maximum is ${MAX_CONCURRENT_JOBS}. Try again shortly.`
      });
    }

    // If Audiveris is not available, reject immediately — no faking
    if (!audiverisAvailable) {
      cleanupFile(inputFilePath);
      return res.status(503).json({
        error: 'Audiveris OMR engine is not installed on this host. Deploy the containerized backend via Docker.',
        audiverisAvailable: false
      });
    }

    const jobId = crypto.randomUUID();
    const originalFilename = path.basename(req.file.originalname);
    const mimeType = actualType;
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
      status: 'queued',
      stageMessage: 'Job queued for Audiveris processing',
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      musicXml: null,
      supabaseProjectId: null,
      supabaseJobId: null
    };

    jobs.set(jobId, jobRecord);

    log('info', `Job created: ${jobId}`, {
      jobId,
      filename: originalFilename,
      mimeType,
      fileSize
    });

    // Supabase integration (optional — fires and doesn't block response)
    if (isSupabaseEnabled()) {
      try {
        const project = await createScoreProject({
          title: originalFilename.replace(/\.[^/.]+$/, ''),
          originalFilename,
          mimeType,
          fileSize,
          pageCount: 1
        });

        if (project) {
          jobRecord.supabaseProjectId = project.id;

          // Upload original file to Supabase Storage
          const fileBuffer = fs.readFileSync(inputFilePath);
          const ext = path.extname(originalFilename).toLowerCase();
          const storagePath = `uploads/${project.id}/original${ext}`;
          await uploadToStorage('original-scores', storagePath, fileBuffer, mimeType);

          const job = await createTranscriptionJob(project.id);
          if (job) {
            jobRecord.supabaseJobId = job.id;
          }
        }
      } catch (err) {
        log('warn', 'Supabase integration failed (non-blocking)', { error: err.message });
      }
    }

    // Launch Audiveris
    startAudiverisJob(jobRecord);

    res.status(201).json({
      jobId,
      status: 'queued'
    });
  } catch (err) {
    log('error', 'POST /jobs error', { error: err.message });
    res.status(500).json(sanitizeError(err));
  }
});

// 3. GET /jobs/:id — Poll job status
app.get('/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    id: job.id,
    originalFilename: job.originalFilename,
    status: job.status,
    stageMessage: job.stageMessage,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  });
});

// 4. GET /jobs/:id/result — Retrieve completed MusicXML
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

// ============================================================
// Audiveris Job Execution
// ============================================================

function startAudiverisJob(jobRecord) {
  activeJobCount++;

  jobRecord.status = 'processing';
  jobRecord.stageMessage = 'Audiveris OMR engine processing...';
  jobRecord.updatedAt = new Date().toISOString();

  // Update Supabase if connected
  if (jobRecord.supabaseJobId) {
    updateTranscriptionJob(jobRecord.supabaseJobId, {
      status: 'processing',
      started_at: new Date().toISOString()
    }).catch(() => {});
  }

  log('info', `Starting Audiveris for job ${jobRecord.id}`);

  // Spawn Audiveris with argument array — NO shell interpolation
  const child = spawn(AUDIVERIS_BIN, [
    '-batch',
    '-export',
    '-output', jobRecord.outputDir,
    jobRecord.inputFilePath
  ], {
    // Do NOT use shell: true — prevents command injection
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 300000 // 5 minute timeout
  });

  let stdoutLog = '';
  let stderrLog = '';

  child.stdout.on('data', (data) => {
    const text = data.toString();
    stdoutLog += text;
    log('info', `[Audiveris stdout] ${jobRecord.id}`, { output: text.trim() });

    // Update stage based on Audiveris output — do NOT fabricate progress
    if (text.includes('Loading') || text.includes('LOAD')) {
      jobRecord.stageMessage = 'Loading score pages...';
    } else if (text.includes('BINARY') || text.includes('binariz')) {
      jobRecord.stageMessage = 'Binarizing image...';
    } else if (text.includes('GRID') || text.includes('stave') || text.includes('staff')) {
      jobRecord.stageMessage = 'Detecting staves and grid...';
    } else if (text.includes('SYMBOLS') || text.includes('HEADS') || text.includes('note')) {
      jobRecord.stageMessage = 'Recognizing musical symbols...';
    } else if (text.includes('PAGE') || text.includes('page')) {
      jobRecord.stageMessage = 'Processing score pages...';
    } else if (text.includes('export') || text.includes('MusicXML') || text.includes('OUTPUT')) {
      jobRecord.stageMessage = 'Exporting MusicXML...';
    }
    jobRecord.updatedAt = new Date().toISOString();
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    stderrLog += text;
    // Audiveris logs a lot to stderr — this is normal Java behavior
    log('info', `[Audiveris stderr] ${jobRecord.id}`, { output: text.trim() });
  });

  child.on('close', async (code) => {
    activeJobCount = Math.max(0, activeJobCount - 1);
    jobRecord.updatedAt = new Date().toISOString();

    log('info', `Audiveris exited for job ${jobRecord.id}`, { exitCode: code });

    if (code !== 0 && code !== null) {
      // Audiveris can exit non-zero but still produce output
      // Check for output first before declaring failure
      const outputFiles = findOutputFiles(jobRecord.outputDir);

      if (!outputFiles.mxl && !outputFiles.xml) {
        jobRecord.status = 'failed';
        jobRecord.error = `Audiveris exited with code ${code}. No MusicXML output produced.`;
        jobRecord.stageMessage = 'Recognition failed';

        if (jobRecord.supabaseJobId) {
          await updateTranscriptionJob(jobRecord.supabaseJobId, {
            status: 'failed',
            error_code: `EXIT_${code}`,
            error_message: jobRecord.error,
            completed_at: new Date().toISOString()
          }).catch(() => {});
        }
        if (jobRecord.supabaseProjectId) {
          await updateScoreProjectStatus(jobRecord.supabaseProjectId, 'failed').catch(() => {});
        }

        // Cleanup input file (keep output dir briefly for debugging)
        cleanupFile(jobRecord.inputFilePath);
        return;
      }
      // Fall through — output exists despite non-zero exit
    }

    // Locate generated output files — recursively search subdirectories
    try {
      const outputFiles = findOutputFiles(jobRecord.outputDir);

      log('info', `Output scan for job ${jobRecord.id}`, {
        mxl: outputFiles.mxl || 'not found',
        xml: outputFiles.xml || 'not found'
      });

      let musicXml = null;

      // Prefer .mxl (compressed MusicXML) — extract XML from inside
      if (outputFiles.mxl) {
        try {
          const zip = new AdmZip(outputFiles.mxl);
          const entries = zip.getEntries();
          const scoreEntry = entries.find(e =>
            e.entryName.endsWith('.xml') &&
            !e.entryName.toLowerCase().includes('container.xml') &&
            !e.entryName.toLowerCase().includes('meta-inf')
          );
          if (scoreEntry) {
            musicXml = scoreEntry.getData().toString('utf-8');
          }
        } catch (mxlErr) {
          log('warn', `Failed to extract MXL: ${mxlErr.message}`, { jobId: jobRecord.id });
        }
      }

      // Fallback to raw .xml / .musicxml
      if (!musicXml && outputFiles.xml) {
        musicXml = fs.readFileSync(outputFiles.xml, 'utf-8');
      }

      if (musicXml && musicXml.includes('<score-partwise')) {
        jobRecord.musicXml = musicXml;
        jobRecord.status = 'completed';
        jobRecord.stageMessage = 'Recognition complete';

        log('info', `Job ${jobRecord.id} completed successfully`, {
          xmlLength: musicXml.length
        });

        // Supabase: store result
        if (jobRecord.supabaseProjectId) {
          try {
            // Upload MusicXML to Supabase Storage
            const xmlBuffer = Buffer.from(musicXml, 'utf-8');
            const xmlPath = `results/${jobRecord.supabaseProjectId}/score.musicxml`;
            await uploadToStorage('transcriptions', xmlPath, xmlBuffer, 'application/xml');

            // Upload MXL if we have it
            let mxlPath = null;
            if (outputFiles.mxl) {
              const mxlBuffer = fs.readFileSync(outputFiles.mxl);
              mxlPath = `results/${jobRecord.supabaseProjectId}/score.mxl`;
              await uploadToStorage('transcriptions', mxlPath, mxlBuffer, 'application/vnd.recordare.musicxml');
            }

            await createTranscriptionResult({
              scoreProjectId: jobRecord.supabaseProjectId,
              musicxmlStoragePath: xmlPath,
              mxlStoragePath: mxlPath,
              metadata: {
                originalFilename: jobRecord.originalFilename,
                xmlLength: musicXml.length,
                audiverisVersion
              }
            });

            await updateTranscriptionJob(jobRecord.supabaseJobId, {
              status: 'completed',
              completed_at: new Date().toISOString()
            });

            await updateScoreProjectStatus(jobRecord.supabaseProjectId, 'completed');
          } catch (err) {
            log('warn', 'Supabase result storage failed (non-blocking)', { error: err.message });
          }
        }
      } else {
        jobRecord.status = 'failed';
        jobRecord.error = 'Audiveris completed but no valid MusicXML output was produced.';
        jobRecord.stageMessage = 'No valid output';

        if (jobRecord.supabaseJobId) {
          await updateTranscriptionJob(jobRecord.supabaseJobId, {
            status: 'failed',
            error_code: 'NO_OUTPUT',
            error_message: jobRecord.error,
            completed_at: new Date().toISOString()
          }).catch(() => {});
        }
        if (jobRecord.supabaseProjectId) {
          await updateScoreProjectStatus(jobRecord.supabaseProjectId, 'failed').catch(() => {});
        }
      }

      // Cleanup input file after processing
      cleanupFile(jobRecord.inputFilePath);

    } catch (err) {
      jobRecord.status = 'failed';
      jobRecord.error = `Failed reading OMR output: ${err.message}`;
      jobRecord.stageMessage = 'Output read error';
      log('error', `Job ${jobRecord.id} output read failed`, { error: err.message });

      cleanupFile(jobRecord.inputFilePath);
    }
  });

  child.on('error', async (err) => {
    activeJobCount = Math.max(0, activeJobCount - 1);
    jobRecord.status = 'failed';
    jobRecord.error = `Failed to spawn Audiveris: ${err.message}`;
    jobRecord.stageMessage = 'Engine spawn failed';
    jobRecord.updatedAt = new Date().toISOString();

    log('error', `Audiveris spawn failed for job ${jobRecord.id}`, { error: err.message });

    cleanupFile(jobRecord.inputFilePath);

    if (jobRecord.supabaseJobId) {
      await updateTranscriptionJob(jobRecord.supabaseJobId, {
        status: 'failed',
        error_code: 'SPAWN_FAILED',
        error_message: jobRecord.error,
        completed_at: new Date().toISOString()
      }).catch(() => {});
    }
  });
}

// ============================================================
// Global Error Handler
// ============================================================

app.use((err, req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`
      });
    }
    return res.status(400).json({ error: err.message });
  }

  log('error', 'Unhandled error', { error: err.message, path: req.path });
  res.status(500).json(sanitizeError(err));
});

// ============================================================
// Graceful Shutdown
// ============================================================

let server;

function gracefulShutdown(signal) {
  log('info', `Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(() => {
      log('info', 'HTTP server closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      log('warn', 'Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================================
// Start Server
// ============================================================

server = app.listen(PORT, () => {
  log('info', `MUSIQ OMR Server started`, {
    port: PORT,
    environment: NODE_ENV,
    audiverisAvailable,
    audiverisVersion,
    supabaseEnabled: isSupabaseEnabled(),
    corsOrigin: CORS_ORIGIN,
    maxFileSizeMB: MAX_FILE_SIZE_MB,
    maxConcurrentJobs: MAX_CONCURRENT_JOBS
  });
});
