export type ViewMode = 
  | 'landing' 
  | 'home' 
  | 'create' 
  | 'studio' 
  | 'vision' 
  | 'vision-capture' 
  | 'vision-result' 
  | 'library' 
  | 'settings';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'Artist' | 'Producer' | 'Musician' | 'Choir / Singer' | 'Student' | 'Composer' | 'Other';
}

export type GenreType = 
  | 'Afrobeats' 
  | 'R&B' 
  | 'Hip-Hop' 
  | 'Rap' 
  | 'Pop' 
  | 'Amapiano' 
  | 'Gospel' 
  | 'Dancehall' 
  | 'Trap' 
  | 'Phonk' 
  | 'Highlife' 
  | 'Reggae' 
  | 'Rock' 
  | 'Jazz' 
  | 'Classical' 
  | 'Electronic'
  | 'Soul';

export type MoodType = 
  | 'Emotional' 
  | 'Dark' 
  | 'Happy' 
  | 'Romantic' 
  | 'Energetic' 
  | 'Melancholic' 
  | 'Aggressive' 
  | 'Peaceful' 
  | 'Inspirational';

export type VoiceType = 
  | 'Male' 
  | 'Female' 
  | 'Duet' 
  | 'Choir' 
  | 'Instrumental';

export interface SongSection {
  id: string;
  name: string; // 'Intro' | 'Verse 1' | 'Pre-Chorus' | 'Chorus' | 'Verse 2' | 'Bridge' | 'Outro'
  startTime: number; // in seconds
  endTime: number;
  lyrics: string[];
  chords?: string[];
}

export interface GeneratedSong {
  id: string;
  title: string;
  prompt: string;
  genre: GenreType;
  mood: MoodType;
  voice: VoiceType;
  tempo: number;
  key: string;
  artworkUrl: string;
  durationSeconds: number;
  sections: SongSection[];
  waveformPeaks: number[];
  createdAt: string;
  isFavorite?: boolean;
}

// Studio Production Types
export interface ClipNote {
  pitch: string; // e.g. 'C4'
  startBeat: number;
  durationBeats: number;
  velocity: number;
}

export interface StudioClip {
  id: string;
  trackId: string;
  name: string;
  startMeasure: number;
  lengthMeasures: number;
  color?: string;
  notes?: ClipNote[];
}

export interface StudioTrack {
  id: string;
  name: string;
  type: 'drums' | 'bass' | 'piano' | 'synth' | 'vocals' | 'choir' | 'guitar' | 'strings' | 'brass' | 'samples';
  color: string;
  muted: boolean;
  soloed: boolean;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  clips: StudioClip[];
}

export interface StudioEffects {
  eqLow: number; // -12 to 12 dB
  eqMid: number;
  eqHigh: number;
  reverbMix: number; // 0 to 1
  delayTime: number; // 0.1 to 1.0s
  delayFeedback: number; // 0 to 0.9
  compression: number; // 0 to 1
}

export interface StudioProject {
  id: string;
  title: string;
  bpm: number;
  key: string;
  timeSignature: string;
  tracks: StudioTrack[];
  effects: StudioEffects;
  sourceType?: 'original' | 'create' | 'vision';
  sourceId?: string;
  updatedAt: string;
}

// Vision OMR Score Types
export type ScoreViewMode = 'score' | 'notes' | 'solfa';

export interface DetectedNote {
  id: string;
  pitch: string; // e.g. 'G4', 'D5', 'F#3'
  solfa: string; // e.g. 'd', 'r', 'm', 'f', 's', 'l', 't'
  duration: 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';
  durationBeats: number; // 4, 2, 1, 0.5, etc.
  isRest: boolean;
  beat: number; // beat within measure 1, 2, 3, 4
  lyric?: string;
  confidence: number; // 0 to 1
}

export interface ScoreMeasure {
  measureNumber: number;
  notes: DetectedNote[];
  confidence: number; // average confidence for this measure
  isFlagged?: boolean; // uncertain area flagged for correction
  warningReason?: string;
}

export interface MusicalPart {
  id: string;
  name: string; // Dynamic instrument/part: 'Trumpet in Bb', 'Horn in F', 'Trombone', 'Tuba', 'Organ', 'Soprano', etc.
  shortName: string; // 'Tpt 1', 'Hn', 'Tbn', 'Tba', 'Org', 'S', 'A', 'T', 'B', etc.
  clef: 'treble' | 'bass' | 'alto' | 'tenor';
  color: string;
  defaultMidiProgram?: number;
  measures: ScoreMeasure[];
}

export type PlaybackMixMode = 'full' | 'solo' | 'my-part-plus-bg' | 'custom';

export interface PlaybackMix {
  mode: PlaybackMixMode;
  activePartId: string;
  partVolumes: Record<string, number>; // 0 to 1
  isMuted: Record<string, boolean>;
}

export interface ScoreProject {
  id: string;
  title: string;
  originalFilename: string;
  mimeType: string;
  fileSize?: number;
  composer?: string;
  keySignature?: string;
  timeSignature?: string;
  tempoBpm?: number;
  arrangementType?: string;
  parts: MusicalPart[];
  measuresCount: number;
  pagesCount: number;
  currentPage?: number;
  pages: string[]; // URLs or base64 data URLs of all uploaded pages
  originalScanUrl: string; // Primary scan or first page
  rawMusicXml?: string; // Genuine MusicXML from OMR
  recognitionStatus: 'idle' | 'uploading' | 'recognizing' | 'completed' | 'failed' | 'unconnected';
  errorMessage?: string;
  confidenceOverall?: number;
  createdAt: string;
  isFavorite?: boolean;
}

// Library item
export interface LibraryItem {
  id: string;
  title: string;
  type: 'song' | 'studio' | 'score';
  subtitle: string;
  meta: string;
  tags: string[];
  favorite: boolean;
  date: string;
  originalRefId: string;
}
