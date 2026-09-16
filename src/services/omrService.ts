import { ScoreProject, StudioProject, StudioTrack } from '../types';
import { DEMO_SCORE } from './mockData';

export type OMRStage = 
  | 'idle'
  | 'preparing'       // Preparing score
  | 'reading'         // Reading notation
  | 'identifying'     // Identifying parts
  | 'building'        // Building performance
  | 'complete';

export interface OMRProgress {
  stage: OMRStage;
  stageName: string;
  detail: string;
}

export const OMR_STAGES_INFO: Record<OMRStage, { name: string; detail: string }> = {
  idle: { name: 'Ready', detail: 'Waiting for score image' },
  preparing: { name: 'Preparing score', detail: 'Normalizing image contrast and detecting staff lines...' },
  reading: { name: 'Reading notation', detail: 'Parsing clefs, key signature, barlines, and noteheads...' },
  identifying: { name: 'Identifying parts', detail: 'Separating Soprano, Alto, Tenor, and Bass polyphonic voices...' },
  building: { name: 'Building performance', detail: 'Generating structured measures, pitch frequencies, and tonic sol-fa...' },
  complete: { name: 'Score Ready', detail: 'Recognition complete' }
};

class OMRService {
  /**
   * Process score image/PDF through OMR stages.
   * Isolates real computer-vision / OMR server backends from the frontend prototype.
   */
  public async processScore(
    fileOrDataUrl: string,
    onProgress?: (progress: OMRProgress) => void
  ): Promise<ScoreProject> {
    // 1. Preparing score
    onProgress?.({
      stage: 'preparing',
      stageName: OMR_STAGES_INFO.preparing.name,
      detail: OMR_STAGES_INFO.preparing.detail
    });
    await new Promise(r => setTimeout(r, 750));

    // 2. Reading notation
    onProgress?.({
      stage: 'reading',
      stageName: OMR_STAGES_INFO.reading.name,
      detail: OMR_STAGES_INFO.reading.detail
    });
    await new Promise(r => setTimeout(r, 850));

    // 3. Identifying parts
    onProgress?.({
      stage: 'identifying',
      stageName: OMR_STAGES_INFO.identifying.name,
      detail: OMR_STAGES_INFO.identifying.detail
    });
    await new Promise(r => setTimeout(r, 800));

    // 4. Building performance
    onProgress?.({
      stage: 'building',
      stageName: OMR_STAGES_INFO.building.name,
      detail: OMR_STAGES_INFO.building.detail
    });
    await new Promise(r => setTimeout(r, 700));

    return {
      ...DEMO_SCORE,
      id: 'score-' + Date.now(),
      createdAt: new Date().toISOString(),
      originalScanUrl: fileOrDataUrl.startsWith('data:') || fileOrDataUrl.startsWith('blob:') 
        ? fileOrDataUrl 
        : DEMO_SCORE.originalScanUrl
    };
  }

  /**
   * Converts a structured ScoreProject (e.g. SATB choir) into a multitrack StudioProject.
   * Maps:
   * Soprano -> Track 1
   * Alto -> Track 2
   * Tenor -> Track 3
   * Bass -> Track 4
   */
  public convertScoreToStudioProject(score: ScoreProject): StudioProject {
    const tracks: StudioTrack[] = score.parts.map(part => {
      return {
        id: `trk-${part.id}`,
        name: `${score.title} — ${part.name}`,
        type: 'choir',
        color: part.color,
        muted: false,
        soloed: false,
        volume: 0.85,
        pan: part.shortName === 'S' ? -0.25 : part.shortName === 'A' ? -0.1 : part.shortName === 'T' ? 0.1 : 0.25,
        clips: [
          {
            id: `clip-${part.id}-m1-4`,
            trackId: `trk-${part.id}`,
            name: `${part.name} (Measures 1–${score.measuresCount})`,
            startMeasure: 1,
            lengthMeasures: score.measuresCount,
            color: part.color
          }
        ]
      };
    });

    return {
      id: `studio-score-${score.id}`,
      title: `${score.title} (Production Session)`,
      bpm: score.tempoBpm,
      key: score.keySignature,
      timeSignature: score.timeSignature,
      tracks,
      sourceType: 'vision',
      sourceId: score.id,
      updatedAt: new Date().toISOString(),
      effects: {
        eqLow: 0,
        eqMid: 1,
        eqHigh: 2,
        reverbMix: 0.35, // Cathedral/choral reverb
        delayTime: 0.25,
        delayFeedback: 0.2,
        compression: 0.3
      }
    };
  }
}

export const omrService = new OMRService();
