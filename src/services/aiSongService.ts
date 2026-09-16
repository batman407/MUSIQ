import { GeneratedSong, GenreType, MoodType, VoiceType } from '../types';
import { DEMO_SONG } from './mockData';

export interface GenerateSongParams {
  title?: string;
  prompt: string;
  genre: GenreType;
  mood: MoodType;
  voice: VoiceType;
  tempo?: number;
  key?: string;
}

export interface GenerationProgress {
  stage: 'analyzing' | 'composing' | 'synthesizing' | 'mixing' | 'complete';
  message: string;
}

class AISongService {
  /**
   * Generates a song from concept, title, prompt, or feeling.
   * Isolates real AI API endpoints from prototype mock implementation.
   */
  public async generateSong(
    params: GenerateSongParams,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<GeneratedSong> {
    // Stage 1: Analyze prompt & musical structure
    onProgress?.({ stage: 'analyzing', message: 'Analyzing lyrical rhythm and genre aesthetics...' });
    await new Promise(r => setTimeout(r, 600));

    // Stage 2: Compose harmony & melody
    onProgress?.({ stage: 'composing', message: `Composing ${params.mood.toLowerCase()} ${params.genre} progressions...` });
    await new Promise(r => setTimeout(r, 700));

    // Stage 3: Synthesize voice
    onProgress?.({ stage: 'synthesizing', message: `Arranging ${params.voice.toLowerCase()} vocal phrasing and meter...` });
    await new Promise(r => setTimeout(r, 700));

    // Stage 4: Production mix & mastering
    onProgress?.({ stage: 'mixing', message: 'Finalizing stem tracks and dynamics...' });
    await new Promise(r => setTimeout(r, 500));

    // Construct generated song object
    const title = params.title?.trim() || (params.prompt.length > 28 ? params.prompt.slice(0, 26) + '...' : params.prompt);
    
    return {
      ...DEMO_SONG,
      id: 'song-' + Date.now(),
      title: title || 'Untitled Inspiration',
      prompt: params.prompt,
      genre: params.genre,
      mood: params.mood,
      voice: params.voice,
      tempo: params.tempo || 104,
      key: params.key || 'F# Minor',
      createdAt: new Date().toISOString()
    };
  }
}

export const aiSongService = new AISongService();
