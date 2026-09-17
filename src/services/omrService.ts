import { ScoreProject, StudioProject, StudioTrack, MusicalPart, ScoreMeasure, DetectedNote } from '../types';

export interface OMRHealthStatus {
  connected: boolean;
  audiverisAvailable: boolean;
  engine: string;
  message: string;
}

export interface OMRJobProgress {
  status: 'idle' | 'uploading' | 'preprocessing' | 'recognizing' | 'exporting' | 'completed' | 'failed' | 'unconnected';
  stageMessage: string;
  progressPercent?: number;
  error?: string;
}

const OMR_API_BASE = import.meta.env.VITE_OMR_API_URL || 'http://localhost:3001';

class OMRService {
  /**
   * Check if real OMR backend is accessible and whether Audiveris is connected
   */
  public async checkHealth(): Promise<OMRHealthStatus> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      
      const response = await fetch(`${OMR_API_BASE}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          connected: false,
          audiverisAvailable: false,
          engine: 'Unknown',
          message: 'OMR service returned non-200 status.'
        };
      }

      const data = await response.json();
      return {
        connected: true,
        audiverisAvailable: Boolean(data.audiverisAvailable),
        engine: data.engine || 'Audiveris',
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
   * If backend is not connected, throws clear honest error.
   */
  public async processScore(
    file: File,
    pageUrls: string[],
    onProgress?: (progress: OMRJobProgress) => void
  ): Promise<ScoreProject> {
    onProgress?.({
      status: 'uploading',
      stageMessage: `Connecting to OMR backend: ${OMR_API_BASE}...`,
      progressPercent: 10
    });

    // 1. Submit binary file via multipart/form-data
    const formData = new FormData();
    formData.append('file', file);

    let jobId: string;
    try {
      const uploadRes = await fetch(`${OMR_API_BASE}/jobs`, {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        throw new Error(errorData.error || `OMR service rejected upload with HTTP ${uploadRes.status}`);
      }

      const uploadData = await uploadRes.json();
      jobId = uploadData.jobId;
    } catch (err: any) {
      const failureMsg = 'OMR service is not connected. Transcription service unavailable.';
      onProgress?.({
        status: 'unconnected',
        stageMessage: failureMsg,
        error: err.message || failureMsg
      });
      throw new Error(failureMsg);
    }

    // 2. Poll real OMR job status
    let completed = false;
    let attempts = 0;
    const maxAttempts = 180; // 3 minutes timeout

    while (!completed && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 1000));
      attempts++;

      try {
        const statusRes = await fetch(`${OMR_API_BASE}/jobs/${jobId}`);
        if (!statusRes.ok) continue;

        const job = await statusRes.json();
        onProgress?.({
          status: job.status,
          stageMessage: job.stageMessage || `Recognizing notation (${job.status})...`,
          progressPercent: job.progress
        });

        if (job.status === 'completed') {
          completed = true;
          break;
        }

        if (job.status === 'failed') {
          throw new Error(job.error || 'Optical Music Recognition failed on this score.');
        }
      } catch (pollErr: any) {
        if (pollErr.message.includes('failed')) throw pollErr;
      }
    }

    if (!completed) {
      throw new Error('Recognition timed out while processing score.');
    }

    // 3. Fetch real generated MusicXML
    onProgress?.({
      status: 'exporting',
      stageMessage: 'Retrieving recognized MusicXML transcription...',
      progressPercent: 95
    });

    const resultRes = await fetch(`${OMR_API_BASE}/jobs/${jobId}/result`);
    if (!resultRes.ok) {
      throw new Error('Failed to retrieve MusicXML result from OMR service.');
    }

    const resultData = await resultRes.json();
    const rawXml = resultData.musicXml;

    if (!rawXml || typeof rawXml !== 'string' || !rawXml.includes('<score-partwise')) {
      throw new Error('Invalid or empty MusicXML returned by recognition engine.');
    }

    // 4. Parse MusicXML to structured ScoreProject
    return this.parseMusicXmlToScore(
      rawXml,
      file.name,
      pageUrls[0] || URL.createObjectURL(file),
      pageUrls,
      file.type,
      file.size
    );
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
      
      // Derive short name (e.g. Trumpet in Bb -> Tpt 1, Soprano -> S)
      let shortName = fullName.split(' ')[0] || `P${pIndex + 1}`;
      if (fullName.toLowerCase() === 'soprano') shortName = 'S';
      else if (fullName.toLowerCase() === 'alto') shortName = 'A';
      else if (fullName.toLowerCase() === 'tenor') shortName = 'T';
      else if (fullName.toLowerCase() === 'bass') shortName = 'B';
      else if (fullName.length > 5) shortName = fullName.slice(0, 4);

      const measureElems = Array.from(partElem.querySelectorAll('measure'));
      if (measureElems.length > maxMeasures) maxMeasures = measureElems.length;

      // Clef check
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

    // Detect general arrangement type
    let arrangementType = 'Score';
    const names = parts.map(p => p.name.toLowerCase());
    if (names.some(n => n.includes('soprano')) && names.some(n => n.includes('bass'))) {
      arrangementType = 'SATB Choir';
    } else if (names.some(n => n.includes('trumpet') || n.includes('horn') || n.includes('trombone') || n.includes('tuba'))) {
      arrangementType = 'Brass / Ensemble';
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

  /**
   * Convert dynamic score project to multi-track studio project
   */
  public convertScoreToStudioProject(score: ScoreProject): StudioProject {
    const tracks: StudioTrack[] = (score.parts || []).map((part, idx) => {
      const panStep = score.parts.length > 1 ? -0.5 + (idx / (score.parts.length - 1)) : 0;
      return {
        id: `trk-${part.id}`,
        name: `${score.title} — ${part.name}`,
        type: 'choir',
        color: part.color,
        muted: false,
        soloed: false,
        volume: 0.85,
        pan: parseFloat(panStep.toFixed(2)),
        clips: [
          {
            id: `clip-${part.id}-full`,
            trackId: `trk-${part.id}`,
            name: `${part.name} (${score.measuresCount} Meas)`,
            startMeasure: 1,
            lengthMeasures: score.measuresCount || 4,
            color: part.color
          }
        ]
      };
    });

    return {
      id: `studio-score-${score.id}`,
      title: `${score.title} (Production Session)`,
      bpm: score.tempoBpm || 100,
      key: score.keySignature || 'C Major',
      timeSignature: score.timeSignature || '4/4',
      tracks,
      sourceType: 'vision',
      sourceId: score.id,
      updatedAt: new Date().toISOString(),
      effects: {
        eqLow: 0,
        eqMid: 1,
        eqHigh: 2,
        reverbMix: 0.3,
        delayTime: 0.25,
        delayFeedback: 0.2,
        compression: 0.3
      }
    };
  }
}

export const omrService = new OMRService();
