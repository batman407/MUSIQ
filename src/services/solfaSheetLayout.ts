/**
 * MUSIQ Tonic Sol-Fa Sheet Layout Engine
 * Formats ParsedScore into traditional choral tonic sol-fa notation:
 * - Systems, Measures, Voices, and Beats
 * - Colons (:) for beat delimiters, bar lines (|) for measure boundaries
 * - Subdivisions (. for eighth notes, , for sixteenths)
 * - Sustained notes (-) for held durations
 * - Octave marks (d' for high, d, for low)
 * - Aligned vertical voices (S, A, T, B or Voice 1, 2...)
 * - Synchronized lyrics underneath musical events
 * - Print-safe A4 pagination with no measure splits
 */

import type { ParsedScore, ParsedPart, ParsedMeasure, ParsedEvent, KeySignatureInfo, ParsedNote } from './musicXmlParser.ts';
import { noteToSolfa } from './solfaEngine.ts';

export interface SolfaBeatCell {
  text: string; // e.g. "d", "d .r", "-", " "
  isSustained: boolean;
  isRest: boolean;
  lyric?: string;
  notes: ParsedNote[];
}

export interface SolfaMeasureCell {
  measureNumber: number;
  timeSignature: string;
  keySignature: KeySignatureInfo;
  beats: SolfaBeatCell[];
  isEndBar?: boolean;
}

export interface SolfaVoiceSystemRow {
  partId: string;
  partName: string;
  shortLabel: string; // e.g. "S", "A", "T", "B", "V1"
  clef: string;
  measures: SolfaMeasureCell[];
}

export interface SolfaSystem {
  systemIndex: number;
  measuresRange: [number, number]; // [startMeasure, endMeasure]
  voiceRows: SolfaVoiceSystemRow[];
  lyricsRow?: Array<{ measureNumber: number; lyricTexts: string[] }>;
}

export interface SolfaSheetPage {
  pageNumber: number;
  totalPages: number;
  isFirstPage: boolean;
  header: {
    title: string;
    subtitle: string;
    composer?: string;
    keySignature: string;
    dohPitch: string;
    timeSignature: string;
    tempo?: number;
  };
  systems: SolfaSystem[];
}

/**
 * Returns concise traditional Sol-fa syllable with octave marks:
 * e.g. d, r, m, f, s, l, t
 * Octaves: d' for octave 5+, d, for octave 3-
 */
export function formatSolfaLetter(note: ParsedNote, key: KeySignatureInfo): string {
  if (note.isRest) return '';

  const fullSyllable = noteToSolfa(note, key);
  const letterMap: Record<string, string> = {
    do: 'd', re: 'r', mi: 'm', fa: 'f', sol: 's', la: 'l', ti: 't',
    di: 'di', ri: 'ri', fi: 'fi', si: 'si', li: 'li',
    ra: 'ra', me: 'me', se: 'se', le: 'le', te: 'te'
  };

  const base = letterMap[fullSyllable] || fullSyllable;

  // Add octave marks relative to octave 4
  if (note.octave >= 5) {
    const primes = "'".repeat(note.octave - 4);
    return `${base}${primes}`;
  } else if (note.octave <= 3) {
    const commas = ",".repeat(4 - note.octave);
    return `${base}${commas}`;
  }

  return base;
}

/**
 * Formats a single event's pitch content into solfa text:
 * single note -> "d'", chord -> "[d m s]"
 */
export function formatEventSolfaText(event: ParsedEvent, key: KeySignatureInfo): string {
  if (event.isRest || event.notes.length === 0) return '';
  if (event.notes.length === 1) {
    return formatSolfaLetter(event.notes[0], key);
  }
  // Chords: bracketed notes
  return `[${event.notes.map(n => formatSolfaLetter(n, key)).join(' ')}]`;
}

/**
 * Derives a short choir voice label (S, A, T, B) or short abbreviation
 */
export function getVoiceShortLabel(partName: string, index: number): string {
  const lower = partName.toLowerCase().trim();
  if (lower.startsWith('soprano')) return 'S';
  if (lower.startsWith('alto')) return 'A';
  if (lower.startsWith('tenor')) return 'T';
  if (lower.startsWith('bass')) return 'B';
  if (lower.startsWith('voice')) return `V${index + 1}`;
  if (lower.startsWith('piano')) return 'Pno';
  if (lower.startsWith('organ')) return 'Org';
  return partName.slice(0, 3);
}

/**
 * Converts events in a measure into a fixed array of beats
 */
export function layoutMeasureBeats(
  measure: ParsedMeasure,
  key: KeySignatureInfo
): SolfaBeatCell[] {
  const [beatsStr, beatTypeStr] = (measure.timeSignature || '4/4').split('/');
  const numBeats = parseInt(beatsStr || '4', 10) || 4;

  const resultBeats: SolfaBeatCell[] = Array.from({ length: numBeats }, () => ({
    text: '',
    isSustained: false,
    isRest: false,
    notes: []
  }));

  if (measure.events.length === 0) {
    // Entire measure rest
    resultBeats.forEach(b => {
      b.text = '';
      b.isRest = true;
    });
    return resultBeats;
  }

  // Walk through events allocating to beats based on duration
  let currentBeatIndex = 0;
  let subBeatOffset = 0; // fraction of current beat: 0, 0.5, etc.

  measure.events.forEach(event => {
    if (currentBeatIndex >= numBeats) return;

    const eventBeats = event.durationBeats || 1;
    const solfaText = formatEventSolfaText(event, key);

    if (event.isRest) {
      if (subBeatOffset === 0 && eventBeats >= 1) {
        resultBeats[currentBeatIndex].isRest = true;
      }
    } else {
      const cell = resultBeats[currentBeatIndex];
      cell.notes.push(...event.notes);
      if (event.lyric && !cell.lyric) {
        cell.lyric = event.lyric;
      }

      if (subBeatOffset === 0) {
        cell.text = solfaText;
      } else {
        // Subdivision (e.g. eighth note dot division)
        cell.text = cell.text ? `${cell.text} .${solfaText}` : `.${solfaText}`;
      }
    }

    // Handle sustained note across following beats (e.g. half note or whole note)
    subBeatOffset += eventBeats;
    while (subBeatOffset >= 1) {
      subBeatOffset -= 1;
      currentBeatIndex += 1;

      // If note duration extends into subsequent beats, mark with sustain "-"
      if (!event.isRest && subBeatOffset > 0 && currentBeatIndex < numBeats) {
        resultBeats[currentBeatIndex].text = '-';
        resultBeats[currentBeatIndex].isSustained = true;
      }
    }
  });

  return resultBeats;
}

/**
 * Layout the complete ParsedScore into systems and paginated sheets
 */
export function layoutTonicSolfaDocument(parsedScore: ParsedScore): SolfaSheetPage[] {
  const parts = parsedScore.parts;
  const numMeasures = parsedScore.measuresCount || 1;

  // Decide measures per system based on measure density (typically 3 to 4 measures per system)
  const measuresPerSystem = numMeasures <= 4 ? numMeasures : 3;
  const systems: SolfaSystem[] = [];

  let systemIndex = 0;
  for (let mStart = 1; mStart <= numMeasures; mStart += measuresPerSystem) {
    const mEnd = Math.min(mStart + measuresPerSystem - 1, numMeasures);

    const voiceRows: SolfaVoiceSystemRow[] = parts.map((part, pIdx) => {
      const partMeasures: SolfaMeasureCell[] = [];

      for (let mNum = mStart; mNum <= mEnd; mNum++) {
        const measure = part.measures.find(m => m.number === mNum);
        const mKey = measure?.keySignature || parsedScore.keySignature;
        const timeSig = measure?.timeSignature || parsedScore.timeSignature;

        if (measure) {
          const beats = layoutMeasureBeats(measure, mKey);
          partMeasures.push({
            measureNumber: mNum,
            timeSignature: timeSig,
            keySignature: mKey,
            beats,
            isEndBar: mNum === numMeasures
          });
        } else {
          // Empty measure placeholder
          const beats = layoutMeasureBeats({
            number: mNum,
            keySignature: mKey,
            timeSignature: timeSig,
            events: []
          }, mKey);
          partMeasures.push({
            measureNumber: mNum,
            timeSignature: timeSig,
            keySignature: mKey,
            beats,
            isEndBar: mNum === numMeasures
          });
        }
      }

      return {
        partId: part.id,
        partName: part.name,
        shortLabel: getVoiceShortLabel(part.name, pIdx),
        clef: part.clef,
        measures: partMeasures
      };
    });

    // Extract aligned lyrics row for this system (from primary vocal voice or first voice with lyrics)
    const lyricsRow: Array<{ measureNumber: number; lyricTexts: string[] }> = [];
    const leadRow = voiceRows.find(v => v.measures.some(m => m.beats.some(b => b.lyric))) || voiceRows[0];

    if (leadRow) {
      leadRow.measures.forEach(m => {
        lyricsRow.push({
          measureNumber: m.measureNumber,
          lyricTexts: m.beats.map(b => b.lyric || '')
        });
      });
    }

    systems.push({
      systemIndex: systemIndex++,
      measuresRange: [mStart, mEnd],
      voiceRows,
      lyricsRow
    });
  }

  // Paginate systems into printable A4 pages
  // Page 1 has large header: holds 3 systems comfortably
  // Subsequent pages hold 4 systems
  const pages: SolfaSheetPage[] = [];
  let currentSystemIdx = 0;
  let pageNum = 1;

  while (currentSystemIdx < systems.length) {
    const isFirstPage = pageNum === 1;
    const maxSystemsThisPage = isFirstPage ? (systems.length <= 3 ? systems.length : 3) : 4;
    const pageSystems = systems.slice(currentSystemIdx, currentSystemIdx + maxSystemsThisPage);
    currentSystemIdx += pageSystems.length;

    pages.push({
      pageNumber: pageNum++,
      totalPages: 1, // updated below
      isFirstPage,
      header: {
        title: parsedScore.title,
        subtitle: 'Tonic Sol-fa Transcription',
        composer: parsedScore.composer,
        keySignature: parsedScore.keySignature.name,
        dohPitch: `Doh is ${parsedScore.keySignature.tonicStep}${parsedScore.keySignature.tonicAlter === 1 ? '♯' : parsedScore.keySignature.tonicAlter === -1 ? '♭' : ''}`,
        timeSignature: parsedScore.timeSignature,
        tempo: parsedScore.tempoBpm
      },
      systems: pageSystems
    });
  }

  // Update totalPages on each page
  pages.forEach(p => {
    p.totalPages = pages.length;
  });

  return pages;
}
