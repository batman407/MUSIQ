import { GeneratedSong, ScoreProject, StudioProject, LibraryItem, User } from '../types';
import { DEMO_SONG, DEMO_SCORE, DEMO_STUDIO_PROJECT, INITIAL_LIBRARY_ITEMS } from './mockData';

const STORAGE_KEYS = {
  INTRO_SEEN: 'musiq_intro_seen_v1',
  USER: 'musiq_user',
  SONGS: 'musiq_songs',
  SCORES: 'musiq_scores',
  STUDIO: 'musiq_studio_projects',
  LIBRARY: 'musiq_library_items',
  SETTINGS: 'musiq_settings'
};

export interface MusiqSettings {
  paperScoreMode: boolean;
  defaultInstrument: 'piano' | 'synth' | 'choir';
  metronomeSound: 'click' | 'woodblock';
  showMeasureNumbers: boolean;
}

const DEFAULT_SETTINGS: MusiqSettings = {
  paperScoreMode: false,
  defaultInstrument: 'piano',
  metronomeSound: 'click',
  showMeasureNumbers: true
};

export const storageService = {
  hasSeenIntro(): boolean {
    return localStorage.getItem(STORAGE_KEYS.INTRO_SEEN) === 'true';
  },

  setIntroSeen(): void {
    localStorage.setItem(STORAGE_KEYS.INTRO_SEEN, 'true');
  },

  getUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getLibraryItems(): LibraryItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.LIBRARY);
    if (!data) {
      this.saveLibraryItems(INITIAL_LIBRARY_ITEMS);
      return INITIAL_LIBRARY_ITEMS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_LIBRARY_ITEMS;
    }
  },

  saveLibraryItems(items: LibraryItem[]): void {
    localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(items));
  },

  getSongs(): GeneratedSong[] {
    const data = localStorage.getItem(STORAGE_KEYS.SONGS);
    if (!data) return [DEMO_SONG];
    try {
      return JSON.parse(data);
    } catch {
      return [DEMO_SONG];
    }
  },

  saveSong(song: GeneratedSong): void {
    const current = this.getSongs();
    const updated = [song, ...current.filter(s => s.id !== song.id)];
    localStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(updated));

    // Update library
    const libItems = this.getLibraryItems();
    const newLibItem: LibraryItem = {
      id: `lib-${song.id}`,
      title: song.title,
      type: 'song',
      subtitle: `${song.genre} • ${song.mood} • ${song.tempo} BPM`,
      meta: `${Math.floor(song.durationSeconds / 60)}:${(song.durationSeconds % 60).toString().padStart(2, '0')} • ${song.key}`,
      tags: [song.genre, song.mood, `${song.voice} Voice`],
      favorite: false,
      date: 'Just now',
      originalRefId: song.id
    };
    this.saveLibraryItems([newLibItem, ...libItems.filter(i => i.originalRefId !== song.id)]);
  },

  getScores(): ScoreProject[] {
    const data = localStorage.getItem(STORAGE_KEYS.SCORES);
    if (!data) return [DEMO_SCORE];
    try {
      return JSON.parse(data);
    } catch {
      return [DEMO_SCORE];
    }
  },

  saveScore(score: ScoreProject): void {
    const current = this.getScores();
    const updated = [score, ...current.filter(s => s.id !== score.id)];
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(updated));

    // Update library
    const libItems = this.getLibraryItems();
    const newLibItem: LibraryItem = {
      id: `lib-${score.id}`,
      title: score.title,
      type: 'score',
      subtitle: `${score.arrangementType} Choir • ${score.parts.length} Parts`,
      meta: `${score.measuresCount} Measures • ${score.keySignature} • ${score.tempoBpm} BPM`,
      tags: [score.arrangementType, 'Choir', 'Sheet Music'],
      favorite: false,
      date: 'Just now',
      originalRefId: score.id
    };
    this.saveLibraryItems([newLibItem, ...libItems.filter(i => i.originalRefId !== score.id)]);
  },

  getStudioProjects(): StudioProject[] {
    const data = localStorage.getItem(STORAGE_KEYS.STUDIO);
    if (!data) return [DEMO_STUDIO_PROJECT];
    try {
      return JSON.parse(data);
    } catch {
      return [DEMO_STUDIO_PROJECT];
    }
  },

  saveStudioProject(project: StudioProject): void {
    const current = this.getStudioProjects();
    const updated = [project, ...current.filter(p => p.id !== project.id)];
    localStorage.setItem(STORAGE_KEYS.STUDIO, JSON.stringify(updated));

    // Update library
    const libItems = this.getLibraryItems();
    const newLibItem: LibraryItem = {
      id: `lib-${project.id}`,
      title: project.title,
      type: 'studio',
      subtitle: `${project.tracks.length} Tracks • Studio Production`,
      meta: `${project.bpm} BPM • ${project.key}`,
      tags: ['Studio', 'Production', `${project.tracks.length} Tracks`],
      favorite: false,
      date: 'Just now',
      originalRefId: project.id
    };
    this.saveLibraryItems([newLibItem, ...libItems.filter(i => i.originalRefId !== project.id)]);
  },

  getSettings(): MusiqSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: MusiqSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
};
