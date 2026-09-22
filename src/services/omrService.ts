import { ScoreProject, MusicalPart, ScoreMeasure, DetectedNote } from '../types';
import {
  OMR_API_URL,
  checkOMRHealth,
  submitScoreJob,
  pollJobUntilComplete,
  OMRApiError,
  OMRJobStatusResponse
} from './omr';

export interface OMRHealthStatus {
  connected: boolean;
  audiverisAvailable: boolean;
  engine: string;
  message: string;
}

export interface OMRJobProgress {
  status: 'idle' | 'uploading' | 'queued' | 'processing' | 'completed' | 'failed' | 'unconnected';
  stageMessage: string;
  progressPercent?: number;
  error?: string;
  jobId?: string;
}

class OMRService {
  /**
   * Check if real OMR backend is accessible and whether Audiveris is connected
   */
  public async checkHealth(signal?: AbortSignal): Promise<OMRHealthStatus> {
    try {
      const data = await checkOMRHealth(signal);
      return {
        connected: data.status === 'ok' && data.audiverisAvailable,
        audiverisAvailable: Boolean(data.audiverisAvailable),
        engine: data.omr || 'Audiveris',
        message: data.audiverisAvailable
          ? 'Audiveris OMR service connected.'
          : 'OMR backend reachable, but Audiveris engine is not installed on the server host.'
      };
    } catch {
      return {
        connected: false,
        audiverisAvailable: false,
        engine: 'Audiveris',
        message: 'OMR service is not connected. Transcription service unavailable.'
      };
    }
  }

  /**
   * Submit binary file (PDF / PNG / JPG) to real OMR backend.
   * NO FAKE TIMEOUTS OR DEMO SUBSTITUTION.
   */
  public async processScore(
    file: File | Blob,
    pageUrls: string[],
    filename?: string,
    onProgress?: (progress: OMRJobProgress) => void,
    signal?: AbortSignal
  ): Promise<ScoreProject> {
    const effectiveFilename = (file instanceof File ? file.name : filename) || 'score.pdf';
    const effectiveType = (file instanceof File ? file.type : '') || 'application/pdf';
    const effectiveSize = file instanceof File ? file.size : file.size;

    onProgress?.({
      status: 'uploading',
      stageMessage: 'Uploading score to recognition engine...'
    });

    // 1. Submit file to POST /jobs
    let jobId: string;
    try {
      const uploadData = await submitScoreJob(file, effectiveFilename, signal);
      jobId = uploadData.jobId;
      onProgress?.({
        status: 'queued',
        jobId,
        stageMessage: 'Preparing your score...'
      });
    } catch (err: any) {
      const failureMsg = err.code === 'NETWORK_ERROR'
        ? 'Transcription is temporarily unavailable.'
        : err.message || 'Failed to upload score to recognition engine.';
      onProgress?.({
        status: 'unconnected',
        stageMessage: failureMsg,
        error: failureMsg
      });
      throw new Error(failureMsg);
    }

    // 2. Poll real OMR job status via GET /jobs/:jobId
    const result = await pollJobUntilComplete(
      jobId,
      (job: OMRJobStatusResponse) => {
        let userStage = job.stageMessage;
        if (job.status === 'queued') {
          userStage = 'Preparing your score...';
        } else if (job.status === 'processing' && (!job.stageMessage || job.stageMessage.includes('processing'))) {
          userStage = 'Reading musical notation...';
        }

        onProgress?.({
          status: job.status,
          jobId: job.id,
          stageMessage: userStage || 'Reading musical notation...'
        });
      },
      signal
    );

    const rawXml = result.musicXml;
    if (!rawXml || typeof rawXml !== 'string' || !rawXml.includes('<score-partwise')) {
      throw new Error('Invalid or empty MusicXML returned by recognition engine.');
    }

    onProgress?.({
      status: 'completed',
      jobId,
      stageMessage: 'Transcription complete'
    });

    // 3. Parse MusicXML into complete ScoreProject
    const scoreProject = this.parseMusicXmlToScore(
      rawXml,
      effectiveFilename,
      pageUrls[0] || (file instanceof File ? URL.createObjectURL(file) : ''),
      pageUrls,
      effectiveType,
      effectiveSize
    );

    // Attach real backend jobId
    scoreProject.jobId = jobId;

    return scoreProject;
  }

  /**
   * Parses authentic MusicXML DOM into the generic MUSIQ ScoreProject representation.
   * Supports arbitrary instruments, staves, parts, and measure counts.
   */
  public parseMusicXmlToScore(
    xmlString: string,
    originalFilename: string,
    originalScanUrl: string,
    pages: string[] = [],
    mimeType: string = 'application/pdf',
    fileSize?: number
  ): ScoreProject {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`MusicXML XML Parsing error: ${parserError.textContent}`);
    }

    // Extract title & composer from MusicXML
    const workTitle = doc.querySelector('work > work-title')?.textContent?.trim();
    const movementTitle = doc.querySelector('movement-title')?.textContent?.trim();
    const composer = doc.querySelector('identification > creator[type="composer"]')?.textContent?.trim() || undefined;

    const baseTitle = workTitle || movementTitle || originalFilename.replace(/\.[^/.]+$/, '');

    // Extract key and time signature from first measure attributes
    const firstMeasure = doc.querySelector('measure');
    let keySignature = 'C Major';
    let timeSignature = '4/4';
    let tempoBpm = 100;

    if (firstMeasure) {
      const fifthsElem = firstMeasure.querySelector('attributes > key > fifths');
      if (fifthsElem) {
        const fifths = parseInt(fifthsElem.textContent || '0', 10);
        const keyMap: Record<number, string> = {
          '-7': 'Cb Major', '-6': 'Gb Major', '-5': 'Db Major', '-4': 'Ab Major',
          '-3': 'Eb Major', '-2': 'Bb Major', '-1': 'F Major', '0': 'C Major',
          '1': 'G Major', '2': 'D Major', '3': 'A Major', '4': 'E Major',
          '5': 'B Major', '6': 'F# Major', '7': 'C# Major'
        };
        keySignature = keyMap[fifths] || 'C Major';
      }

      const beats = firstMeasure.querySelector('attributes > time > beats')?.textContent;
      const beatType = firstMeasure.querySelector('attributes > time > beat-type')?.textContent;
      if (beats && beatType) {
        timeSignature = `${beats}/${beatType}`;
      }

      const tempoElem = firstMeasure.querySelector('direction > sound[tempo]');
      if (tempoElem) {
        const t = parseFloat(tempoElem.getAttribute('tempo') || '100');
        if (!isNaN(t) && t > 30) tempoBpm = Math.round(t);
      }
    }

    // Extract parts list
    const partElements = Array.from(doc.querySelectorAll('score-partwise > part'));
    const partListEntries = Array.from(doc.querySelectorAll('part-list > score-part'));
    const partNameMap = new Map<string, string>();
    partListEntries.forEach(pe => {
      const id = pe.getAttribute('id') || '';
      const name = pe.querySelector('part-name')?.textContent?.trim() || 'Instrument';
      partNameMap.set(id, name);
    });

    const palette = ['#8B5CF6', '#67E8F9', '#4ADE80', '#FBBF24', '#F472B6', '#60A5FA', '#34D399', '#A78BFA'];
    let maxMeasures = 0;

    const parts: MusicalPart[] = partElements.map((partElem, pIndex) => {
      const partId = partElem.getAttribute('id') || `P${pIndex + 1}`;
      const fullName = partNameMap.get(partId) || `Part ${pIndex + 1}`;
      
      let shortName = fullName.split(' ')[0] || `P${pIndex + 1}`;
      if (fullName.toLowerCase() === 'soprano') shortName = 'S';
      else if (fullName.toLowerCase() === 'alto') shortName = 'A';
      else if (fullName.toLowerCase() === 'tenor') shortName = 'T';
      else if (fullName.toLowerCase() === 'bass') shortName = 'B';
      else if (fullName.length > 5) shortName = fullName.slice(0, 4);

      const measureElems = Array.from(partElem.querySelectorAll('measure'));
      if (measureElems.length > maxMeasures) maxMeasures = measureElems.length;

      const clefSign = partElem.querySelector('clef > sign')?.textContent?.toLowerCase();
      const clef: 'treble' | 'bass' | 'alto' | 'tenor' = 
        clefSign === 'f' ? 'bass' : clefSign === 'c' ? 'alto' : 'treble';

      const measures: ScoreMeasure[] = measureElems.map((mElem, mIdx) => {
        const mNum = parseInt(mElem.getAttribute('number') || `${mIdx + 1}`, 10);
        const noteElems = Array.from(mElem.querySelectorAll('note'));
        
        let beatTracker = 1;
        const notes: DetectedNote[] = [];

        noteElems.forEach((nElem, nIdx) => {
          const isRest = nElem.querySelector('rest') !== null;
          const step = nElem.querySelector('pitch > step')?.textContent || 'C';
          const alter = nElem.querySelector('pitch > alter')?.textContent;
          const octave = nElem.querySelector('pitch > octave')?.textContent || '4';
          const type = (nElem.querySelector('type')?.textContent || 'quarter') as DetectedNote['duration'];
          const lyric = nElem.querySelector('lyric > text')?.textContent || undefined;

          let pitch = isRest ? 'Rest' : `${step}${alter === '1' ? '#' : alter === '-1' ? 'b' : ''}${octave}`;
          
          let durationBeats = 1;
          if (type === 'whole') durationBeats = 4;
          else if (type === 'half') durationBeats = 2;
          else if (type === 'quarter') durationBeats = 1;
          else if (type === 'eighth') durationBeats = 0.5;
          else if (type === 'sixteenth') durationBeats = 0.25;

          notes.push({
            id: `n-${partId}-m${mNum}-${nIdx}`,
            pitch,
            solfa: '',
            duration: type,
            durationBeats,
            isRest,
            beat: beatTracker,
            lyric,
            confidence: 1.0
          });

          beatTracker += durationBeats;
        });

        return {
          measureNumber: mNum,
          notes,
          confidence: 1.0
        };
      });

      return {
        id: `part-${partId}`,
        name: fullName,
        shortName,
        clef,
        color: palette[pIndex % palette.length],
        measures
      };
    });

    // Detect general arrangement type from genuine instrumentation
    let arrangementType = 'Score';
    const names = parts.map(p => p.name.toLowerCase());
    if (names.some(n => n.includes('soprano')) && names.some(n => n.includes('bass'))) {
      arrangementType = 'SATB Choir';
    } else if (names.some(n => n.includes('trumpet') || n.includes('horn') || n.includes('trombone') || n.includes('tuba'))) {
      arrangementType = 'Brass / Ensemble';
    } else if (names.some(n => n.includes('piano') || n.includes('keyboard') || n.includes('organ'))) {
      arrangementType = 'Keyboard';
    } else if (parts.length > 4) {
      arrangementType = 'Orchestral / Multi-part';
    } else if (parts.length === 1) {
      arrangementType = 'Solo / Melody';
    }

    return {
      id: `score-${Date.now()}`,
      title: baseTitle,
      originalFilename,
      mimeType,
      fileSize,
      composer,
      keySignature,
      timeSignature,
      tempoBpm,
      arrangementType,
      parts,
      measuresCount: maxMeasures || 1,
      pagesCount: pages.length || 1,
      currentPage: 1,
      pages: pages.length > 0 ? pages : [originalScanUrl],
      originalScanUrl,
      rawMusicXml: xmlString,
      recognitionStatus: 'completed',
      createdAt: new Date().toISOString()
    };
  }
}

export const omrService = new OMRService();
export { OMR_API_URL };
