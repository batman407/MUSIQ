import { createClient } from '@supabase/supabase-js';

// ============================================================
// Server-side Supabase Client
// Uses SUPABASE_SERVICE_ROLE_KEY — NEVER expose to browser
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let supabaseEnabled = false;

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  supabaseEnabled = true;
  console.log('[Supabase] Connected to', SUPABASE_URL);
} else {
  console.log('[Supabase] Not configured — running in local-only mode');
}

export function isSupabaseEnabled() {
  return supabaseEnabled;
}

// ============================================================
// Score Projects
// ============================================================

export async function createScoreProject({
  userId,
  title,
  originalFilename,
  mimeType,
  fileSize,
  pageCount,
  originalStoragePath
}) {
  if (!supabaseEnabled) return null;

  const { data, error } = await supabase
    .from('score_projects')
    .insert({
      user_id: userId || null,
      title: title || originalFilename.replace(/\.[^/.]+$/, ''),
      original_filename: originalFilename,
      mime_type: mimeType,
      file_size: fileSize,
      page_count: pageCount || 1,
      original_storage_path: originalStoragePath || null,
      status: 'uploaded'
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Failed to create score_project:', error.message);
    return null;
  }
  return data;
}

export async function updateScoreProjectStatus(projectId, status) {
  if (!supabaseEnabled) return;

  const { error } = await supabase
    .from('score_projects')
    .update({ status })
    .eq('id', projectId);

  if (error) {
    console.error('[Supabase] Failed to update score_project status:', error.message);
  }
}

// ============================================================
// Transcription Jobs
// ============================================================

export async function createTranscriptionJob(scoreProjectId) {
  if (!supabaseEnabled) return null;

  const { data, error } = await supabase
    .from('transcription_jobs')
    .insert({
      score_project_id: scoreProjectId,
      status: 'queued'
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Failed to create transcription_job:', error.message);
    return null;
  }
  return data;
}

export async function updateTranscriptionJob(jobId, updates) {
  if (!supabaseEnabled) return;

  const { error } = await supabase
    .from('transcription_jobs')
    .update(updates)
    .eq('id', jobId);

  if (error) {
    console.error('[Supabase] Failed to update transcription_job:', error.message);
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
  if (!supabaseEnabled) return null;

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

// ============================================================
// Storage — Upload Files to Private Buckets
// ============================================================

/**
 * Upload a file to Supabase Storage.
 * @param {string} bucket - 'original-scores' or 'transcriptions'
 * @param {string} storagePath - e.g. '{userId}/{projectId}/original.pdf'
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
