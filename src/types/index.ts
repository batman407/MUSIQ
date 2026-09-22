export type ViewMode = 
  | 'landing' 
  | 'home' 
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
  role: 'Choir Director' | 'Classical Musician' | 'Music Student' | 'Band Director' | 'Composer' | 'Arranger' | 'Other';
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
  confidence: number;
  isFlagged?: boolean;
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
  jobId?: string;
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

// Transcription Library Item
export interface LibraryItem {
  id: string;
  title: string;
  type: 'score';
  subtitle: string;
  meta: string;
  tags: string[];
  favorite: boolean;
  date: string;
  originalRefId: string;
  pageCount?: number;
  status?: 'Ready' | 'Processing' | 'Failed';
}
