import { createClient } from '@supabase/supabase-js';

// ============================================================
// Server-side Supabase Client
// Uses SUPABASE_SERVICE_ROLE_KEY — NEVER expose to browser
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let supabaseEnabled = false;

const hasConfig = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
console.log(`[Supabase] Configuration present: ${hasConfig ? 'yes' : 'no'}`);

if (hasConfig) {
  try {
    // Supabase Realtime is not needed for backend OMR batch processing (PostgreSQL & Storage only).
    // In Node 22 LTS, native WebSocket is available. Providing a fallback transport ensures
    // that the realtime client constructor never throws, even if run in an environment without WebSockets.
    const wsTransport = typeof WebSocket !== 'undefined'
      ? WebSocket
      : class NoOpWebSocket {
          constructor() {}
          addEventListener() {}
          removeEventListener() {}
          send() {}
          close() {}
        };

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      realtime: {
        transport: wsTransport
      }
    });

    supabaseEnabled = true;
    console.log('[Supabase] Client initialized: yes');
    console.log('[Supabase] Endpoint:', SUPABASE_URL.replace(/:\/\/.*@/, '://'));
  } catch (err) {
    supabaseEnabled = false;
    console.error('[Supabase] Client initialized: no');
    console.error('[Supabase] Initialization error:', err.message);
  }
} else {
  console.log('[Supabase] Client initialized: no (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — running in local memory-only mode)');
}

export function isSupabaseEnabled() {
  return supabaseEnabled;
}

export function getSupabaseClient() {
  return supabase;
}

// ============================================================
// Score Projects
// ============================================================

export async function createScoreProject({
  id,
  userId,
  title,
  originalFilename,
  mimeType,
  fileSize,
  pageCount,
  originalStoragePath
}) {
  if (!supabaseEnabled) return null;

  const insertPayload = {
    user_id: userId || null,
    title: title || originalFilename.replace(/\.[^/.]+$/, ''),
    original_filename: originalFilename,
    mime_type: mimeType,
    file_size: fileSize,
    page_count: pageCount || 1,
    original_storage_path: originalStoragePath || null,
    status: 'uploaded'
  };
  if (id) {
    insertPayload.id = id;
  }

  const { data, error } = await supabase
    .from('score_projects')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Failed to create score_project:', error.message);
    return null;
  }
  return data;
}

export async function updateScoreProjectStatus(projectId, status) {
  if (!supabaseEnabled || !projectId) return;

  const { error } = await supabase
    .from('score_projects')
    .update({ status })
    .eq('id', projectId);

  if (error) {
    console.error('[Supabase] Failed to update score_project status:', error.message);
  }
}

export async function updateScoreProjectStoragePath(projectId, storagePath) {
  if (!supabaseEnabled || !projectId) return;

  const { error } = await supabase
    .from('score_projects')
    .update({ original_storage_path: storagePath })
    .eq('id', projectId);

  if (error) {
    console.error('[Supabase] Failed to update score_project storage path:', error.message);
  }
}

// ============================================================
// Transcription Jobs
// ============================================================

export async function createTranscriptionJob({
  id,
  scoreProjectId,
  status = 'queued',
  stageMessage = 'Job queued for Audiveris processing'
}) {
  if (!supabaseEnabled || !scoreProjectId) return null;

  const insertPayload = {
    score_project_id: scoreProjectId,
    status
  };
  if (id) {
    insertPayload.id = id;
  }
  if (stageMessage) {
    insertPayload.stage_message = stageMessage;
  }

  let { data, error } = await supabase
    .from('transcription_jobs')
    .insert(insertPayload)
    .select()
    .single();

  // If stage_message column doesn't exist yet in the database, retry without it
  if (error && error.message && error.message.includes('stage_message')) {
    delete insertPayload.stage_message;
    const retry = await supabase
      .from('transcription_jobs')
      .insert(insertPayload)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('[Supabase] Failed to create transcription_job:', error.message);
    return null;
  }
  return data;
}

export async function updateTranscriptionJob(jobId, updates) {
  if (!supabaseEnabled || !jobId) return;

  const payload = {
    ...updates,
    updated_at: updates.updated_at || new Date().toISOString()
  };

  let { error } = await supabase
    .from('transcription_jobs')
    .update(payload)
    .eq('id', jobId);

  // Gracefully handle missing columns if migrations haven't run yet
  if (error && error.message && (error.message.includes('stage_message') || error.message.includes('updated_at'))) {
    delete payload.stage_message;
    delete payload.updated_at;
    const retry = await supabase
      .from('transcription_jobs')
      .update(payload)
      .eq('id', jobId);
    error = retry.error;
  }

  if (error) {
    console.error(`[Supabase] Failed to update transcription_job ${jobId}:`, error.message);
  }
}

export async function getTranscriptionJob(jobId) {
  if (!supabaseEnabled || !jobId) return null;

  const { data, error } = await supabase
    .from('transcription_jobs')
    .select(`
      id,
      score_project_id,
      status,
      stage_message,
      progress_page,
      error_code,
      error_message,
      started_at,
      completed_at,
      created_at,
      updated_at,
      score_projects (
        id,
        title,
        original_filename,
        mime_type,
        file_size,
        original_storage_path,
        status
      )
    `)
    .eq('id', jobId)
    .maybeSingle();

  if (error) {
    console.error(`[Supabase] Failed to fetch transcription_job ${jobId}:`, error.message);
    return null;
  }

  if (!data) return null;

  const scoreProject = data.score_projects || {};

  return {
    id: data.id,
    scoreProjectId: data.score_project_id,
    originalFilename: scoreProject.original_filename || 'score',
    mimeType: scoreProject.mime_type || 'application/octet-stream',
    fileSize: scoreProject.file_size || 0,
    originalStoragePath: scoreProject.original_storage_path || null,
    status: data.status,
    stageMessage: data.stage_message || (data.status === 'completed' ? 'Recognition complete' : data.status === 'processing' ? 'Audiveris OMR engine processing...' : data.status),
    error: data.error_message || null,
    errorCode: data.error_code || null,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.completed_at || data.started_at || data.created_at
  };
}

// Mark interrupted jobs on server startup
export async function markInterruptedJobsFailed() {
  if (!supabaseEnabled) return;

  try {
    const { data, error } = await supabase
      .from('transcription_jobs')
      .update({
        status: 'failed',
        error_code: 'SERVER_RESTARTED',
        error_message: 'Processing was interrupted by a backend server restart or deployment. Please re-submit the score file.',
        completed_at: new Date().toISOString()
      })
      .in('status', ['queued', 'processing'])
      .select('id, score_project_id');

    if (error) {
      console.warn('[Supabase] Note on startup recovery check:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log(`[Supabase] Cleaned up ${data.length} interrupted job(s) from prior instance:`, data.map(j => j.id));
      // Also mark corresponding score_projects as failed
      for (const job of data) {
        if (job.score_project_id) {
          await updateScoreProjectStatus(job.score_project_id, 'failed').catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('[Supabase] Startup check error:', err.message);
  }
}

// ============================================================
// Transcription Results
// ============================================================

export async function createTranscriptionResult({
  scoreProjectId,
  musicxmlStoragePath,
  mxlStoragePath,
  pdfStoragePath,
  metadata
}) {
  if (!supabaseEnabled || !scoreProjectId) return null;

  const { data, error } = await supabase
    .from('transcription_results')
    .insert({
      score_project_id: scoreProjectId,
      musicxml_storage_path: musicxmlStoragePath || null,
      mxl_storage_path: mxlStoragePath || null,
      pdf_storage_path: pdfStoragePath || null,
      metadata: metadata || {}
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Failed to create transcription_result:', error.message);
    return null;
  }
  return data;
}

export async function getTranscriptionResult(scoreProjectId) {
  if (!supabaseEnabled || !scoreProjectId) return null;

  const { data, error } = await supabase
    .from('transcription_results')
    .select('*')
    .eq('score_project_id', scoreProjectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`[Supabase] Failed to fetch transcription_result for project ${scoreProjectId}:`, error.message);
    return null;
  }
  return data;
}

// ============================================================
// Storage — Private Buckets
// ============================================================

/**
 * Upload a file buffer to a private Supabase Storage bucket.
 * @param {string} bucket - 'original-scores' or 'transcriptions'
 * @param {string} storagePath - e.g. 'scores/{projectId}/original.pdf'
 * @param {Buffer} fileBuffer - file contents
 * @param {string} contentType - MIME type
 * @returns {string|null} storage path on success
 */
export async function uploadToStorage(bucket, storagePath, fileBuffer, contentType) {
  if (!supabaseEnabled) return null;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true
    });

  if (error) {
    console.error(`[Supabase Storage] Upload failed (${bucket}/${storagePath}):`, error.message);
    return null;
  }

  return storagePath;
}

/**
 * Download a file buffer from a private Supabase Storage bucket.
 * @param {string} bucket - 'original-scores' or 'transcriptions'
 * @param {string} storagePath - e.g. 'results/{projectId}/score.musicxml'
 * @returns {Buffer|null} Buffer on success
 */
export async function downloadFromStorage(bucket, storagePath) {
  if (!supabaseEnabled) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .download(storagePath);

  if (error) {
    console.error(`[Supabase Storage] Download failed (${bucket}/${storagePath}):`, error.message);
    return null;
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate a signed URL for private file access.
 * @param {string} bucket
 * @param {string} storagePath
 * @param {number} expiresIn - seconds (default 1 hour)
 * @returns {string|null} signed URL
 */
export async function getSignedUrl(bucket, storagePath, expiresIn = 3600) {
  if (!supabaseEnabled) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error(`[Supabase Storage] Signed URL failed (${bucket}/${storagePath}):`, error.message);
    return null;
  }

  return data.signedUrl;
}
