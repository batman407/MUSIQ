/**
 * MUSIQ OMR API Service
 * Connects frontend directly to the Railway Audiveris OMR production backend.
 * Endpoints:
 *   GET  /health
 *   POST /jobs
 *   GET  /jobs/:id
 *   GET  /jobs/:id/result
 */

export const OMR_API_URL = (
  import.meta.env.VITE_OMR_API_URL || 'https://musiq-production-3253.up.railway.app'
).replace(/\/$/, '');

export type OMRJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface OMRHealthResponse {
  status: 'ok' | 'unhealthy';
  service: string;
  omr: string;
  audiverisAvailable: boolean;
  audiverisVersion?: string;
  supabaseConnected: boolean;
  activeJobs: number;
  maxConcurrentJobs: number;
  timestamp: string;
}

export interface OMRJobCreationResponse {
  jobId: string;
  status: OMRJobStatus;
}

export interface OMRJobStatusResponse {
  id: string;
  originalFilename: string;
  status: OMRJobStatus;
  stageMessage: string;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OMRJobResultResponse {
  jobId: string;
  originalFilename: string;
  format: string;
  musicXml: string;
}

export class OMRApiError extends Error {
  public status?: number;
  public code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'OMRApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Check backend health & Audiveris availability
 */
export async function checkOMRHealth(signal?: AbortSignal): Promise<OMRHealthResponse> {
  try {
    const res = await fetch(`${OMR_API_URL}/health`, {
      signal: signal || AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      throw new OMRApiError(`OMR backend responded with status ${res.status}`, res.status);
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof OMRApiError) throw err;
    throw new OMRApiError(
      err.name === 'TimeoutError'
        ? 'Connection to OMR service timed out.'
        : 'Could not connect to OMR service.',
      undefined,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Submit score file (PDF, PNG, JPG, JPEG) to POST /jobs
 */
export async function submitScoreJob(
  file: File | Blob,
  filename?: string,
  signal?: AbortSignal
): Promise<OMRJobCreationResponse> {
  const formData = new FormData();
  if (file instanceof File) {
    formData.append('file', file);
  } else {
    formData.append('file', file, filename || 'score.jpg');
  }

  try {
    // Note: Do NOT set Content-Type header; let the browser generate the multipart boundary
    const res = await fetch(`${OMR_API_URL}/jobs`, {
      method: 'POST',
      body: formData,
      signal
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const message = errorJson.error || `Upload rejected with status ${res.status}`;
      throw new OMRApiError(message, res.status);
    }

    const data: OMRJobCreationResponse = await res.json();
    if (!data.jobId) {
      throw new OMRApiError('Backend did not return a valid jobId');
    }

    return data;
  } catch (err: any) {
    if (err instanceof OMRApiError) throw err;
    throw new OMRApiError(err.message || 'Failed to submit score for recognition.');
  }
}

/**
 * Poll job status via GET /jobs/:jobId
 */
export async function getJobStatus(
  jobId: string,
  signal?: AbortSignal
): Promise<OMRJobStatusResponse> {
  const res = await fetch(`${OMR_API_URL}/jobs/${jobId}`, { signal });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new OMRApiError(errorJson.error || `Failed to fetch job status (${res.status})`, res.status);
  }

  return await res.json();
}

/**
 * Retrieve completed MusicXML via GET /jobs/:jobId/result
 */
export async function getJobResult(
  jobId: string,
  signal?: AbortSignal
): Promise<OMRJobResultResponse> {
  const res = await fetch(`${OMR_API_URL}/jobs/${jobId}/result`, { signal });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new OMRApiError(
      errorJson.error || `Failed to retrieve transcription result (${res.status})`,
      res.status
    );
  }

  const data: OMRJobResultResponse = await res.json();
  if (!data.musicXml || typeof data.musicXml !== 'string' || !data.musicXml.includes('<score-partwise')) {
    throw new OMRApiError('Invalid or empty MusicXML returned by transcription engine.');
  }

  return data;
}

/**
 * Polls job status until 'completed' or 'failed', calling onProgress callback.
 * Frequency: every 2000-2500ms.
 */
export async function pollJobUntilComplete(
  jobId: string,
  onProgress?: (status: OMRJobStatusResponse) => void,
  signal?: AbortSignal,
  maxMinutes = 5
): Promise<OMRJobResultResponse> {
  const startTime = Date.now();
  const timeoutMs = maxMinutes * 60 * 1000;
  const pollIntervalMs = 2500;

  while (!signal?.aborted) {
    if (Date.now() - startTime > timeoutMs) {
      throw new OMRApiError('Transcription timed out. The score is taking longer than expected to process.');
    }

    const job = await getJobStatus(jobId, signal);
    onProgress?.(job);

    if (job.status === 'completed') {
      return await getJobResult(jobId, signal);
    }

    if (job.status === 'failed') {
      throw new OMRApiError(job.error || "We couldn't transcribe this score.");
    }

    // Wait before next poll
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, pollIntervalMs);
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new OMRApiError('Transcription cancelled by user.'));
        });
      }
    });
  }

  throw new OMRApiError('Transcription aborted.');
}
