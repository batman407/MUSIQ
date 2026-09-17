import { ScoreProject, LibraryItem, User } from '../types';

const STORAGE_KEYS = {
  INTRO_SEEN: 'musiq_intro_seen_v1',
  USER: 'musiq_user',
  SCORES: 'musiq_scores',
  LIBRARY: 'musiq_library_items',
  SETTINGS: 'musiq_settings',
  MIGRATION_V3: 'musiq_storage_migration_v3'
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

// Immediate migration on module load:
// Purge any legacy demo scores, obsolete song data, and studio projects
function runStorageMigration() {
  try {
    if (localStorage.getItem(STORAGE_KEYS.MIGRATION_V3) !== 'true') {
      // 1. Audit and clean scores
      const rawScores = localStorage.getItem(STORAGE_KEYS.SCORES);
      if (rawScores) {
        try {
          const parsed = JSON.parse(rawScores);
          if (Array.isArray(parsed)) {
            const sanitized = parsed.filter((s: any) => 
              s && s.id !== 'score-abide-with-me' && !s.title?.includes('Abide With Me')
            );
            localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(sanitized));
          }
        } catch {
          localStorage.removeItem(STORAGE_KEYS.SCORES);
        }
      }

      // 2. Audit and clean library items (keep only valid transcription scores)
      const rawLibrary = localStorage.getItem(STORAGE_KEYS.LIBRARY);
      if (rawLibrary) {
        try {
          const parsedLib = JSON.parse(rawLibrary);
          if (Array.isArray(parsedLib)) {
            const sanitizedLib = parsedLib.filter((item: any) => 
              item && 
              item.type === 'score' &&
              item.id !== 'lib-2' && 
              item.originalRefId !== 'score-abide-with-me' && 
              !item.title?.includes('Abide With Me')
            );
            localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(sanitizedLib));
          }
        } catch {
          localStorage.removeItem(STORAGE_KEYS.LIBRARY);
        }
      }

      // 3. Clean obsolete create/studio storage keys
      localStorage.removeItem('musiq_songs');
      localStorage.removeItem('musiq_studio_projects');

      localStorage.setItem(STORAGE_KEYS.MIGRATION_V3, 'true');
    }
  } catch {
    // localStorage might be restricted
  }
}

runStorageMigration();

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
    if (!data) return [];
    try {
      const items: LibraryItem[] = JSON.parse(data);
      return items.filter(i => 
        i && 
        i.type === 'score' && 
        i.originalRefId !== 'score-abide-with-me' && 
        !i.title.includes('Abide With Me')
      );
    } catch {
      return [];
    }
  },

  saveLibraryItems(items: LibraryItem[]): void {
    localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(items));
  },

  getScores(): ScoreProject[] {
    const data = localStorage.getItem(STORAGE_KEYS.SCORES);
    if (!data) return [];
    try {
      const parsed: ScoreProject[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(s => s && s.id !== 'score-abide-with-me' && !s.title?.includes('Abide With Me'));
    } catch {
      return [];
    }
  },

  saveScore(score: ScoreProject): void {
    const current = this.getScores();
    const updated = [score, ...current.filter(s => s.id !== score.id)];
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(updated));

    // Update transcription library
    const libItems = this.getLibraryItems();
    const arrangementLabel = score.arrangementType || 'Sheet Music';
    const partsCount = score.parts ? score.parts.length : 0;
    const measuresLabel = score.measuresCount ? `${score.measuresCount} Measures` : '';
    const keyLabel = score.keySignature ? ` • ${score.keySignature}` : '';

    const newLibItem: LibraryItem = {
      id: `lib-${score.id}`,
      title: score.title || score.originalFilename || 'Untitled Score',
      type: 'score',
      subtitle: `${arrangementLabel} • ${partsCount} Part${partsCount === 1 ? '' : 's'}`,
      meta: `${measuresLabel}${keyLabel}`,
      tags: [arrangementLabel, 'Sheet Music', `${score.pagesCount || 1} Page${score.pagesCount === 1 ? '' : 's'}`],
      favorite: false,
      date: 'Just now',
      originalRefId: score.id,
      pageCount: score.pagesCount || 1,
      status: score.recognitionStatus === 'completed' ? 'Ready' : score.recognitionStatus === 'failed' ? 'Failed' : 'Processing'
    };
    this.saveLibraryItems([newLibItem, ...libItems.filter(i => i.originalRefId !== score.id)]);
  },

  deleteScore(scoreId: string): void {
    const current = this.getScores();
    const updated = current.filter(s => s.id !== scoreId);
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(updated));

    const libItems = this.getLibraryItems();
    this.saveLibraryItems(libItems.filter(i => i.originalRefId !== scoreId));
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
