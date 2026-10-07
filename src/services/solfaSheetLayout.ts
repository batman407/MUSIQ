/**
 * MUSIQ Tonic Sol-Fa Typesetting Engine V3
 * Staff-by-staff, all parts, system-based print-quality layout.
 *
 * Core Data Hierarchy:
 * SCORE → PART → STAFF → VOICE → MEASURE → TIMED EVENT
 *
 * Principles:
 * 1. Complete score transcription: Trumpet, Solo, Soprano, Alto, Tenor, Bass, Organ RH/LH, Piano, etc.
 * 2. Human-readable labels (no raw P1-S1-V1 IDs, no generic V1/V2/Pno hiding instrument identity).
 * 3. Suppression of empty voices: only render rows with meaningful musical events in that system.
 * 4. Boxed rectangular measure cells with true CSS/SVG alignment.
 * 5. Dynamic measures per system & dynamic measure widths via measure-density estimator.
 * 6. Simultaneous chord typesetting: stacked vertical pitch sol-fa syllables, never raw array brackets.
 * 7. Aligned lyrics row positioned directly beneath the vocal voice that sings them.
 * 8. Measure numbers, rehearsal marks, tempo marks, and modulations positioned above the system.
 * 9. Deterministic A4 portrait pagination: readability > page count.
 */

import type { ParsedScore, ParsedPart, ParsedMeasure, ParsedEvent, KeySignatureInfo, ParsedNote } from './musicXmlParser.ts';
import { noteToSolfa } from './solfaEngine.ts';

export interface SolfaBeatCell {
  text: string; // e.g. "d", "d .r", "-", " "
  chordSyllables: string[]; // Highest to lowest pitch: e.g. ['s', 'm', 'd']
  isChord: boolean;
  isSustained: boolean;
  isRest: boolean;
  lyric?: string;
  notes: ParsedNote[];
  subdivisions?: Array<{
    text: string;
    chordSyllables: string[];
    isChord: boolean;
    lyric?: string;
  }>;
}

export interface SolfaMeasureCell {
  measureNumber: number;
  timeSignature: string;
  keySignature: KeySignatureInfo;
  beats: SolfaBeatCell[];
  isEndBar?: boolean;
  isDoubleBar?: boolean;
  isEntirelyRest?: boolean;
}

export interface SolfaVoiceSystemRow {
  rowId: string;
  partId: string;
  partName: string;
  staffNumber: number;
  voiceNumber: number;
  displayLabel: string; // e.g. "Trumpet", "Solo", "Organ RH", "Organ LH", "S", "A", "T", "B"
  shortLabel: string; // alias for displayLabel
  clef: 'treble' | 'bass' | 'alto' | 'tenor';
  hasLyrics: boolean;
  measures: SolfaMeasureCell[];
  lyricsRow?: Array<{ measureNumber: number; lyricTexts: string[] }>;
}

export interface SystemMeasureHeader {
  measureNumber: number;
  widthPercent: number; // dynamically allocated based on density
  rehearsalMark?: string;
  directionWords?: string;
  tempoBpm?: number;
  modulationText?: string;
  timeChangeText?: string;
}

export interface SolfaSystem {
  systemIndex: number;
  measuresRange: [number, number]; // [startMeasure, endMeasure]
  measureHeaders: SystemMeasureHeader[];
  voiceRows: SolfaVoiceSystemRow[];
}

export interface SolfaSheetPage {
  pageNumber: number;
  totalPages: number;
  isFirstPage: boolean;
  header: {
    title: string;
    subtitle?: string;
    composer?: string;
    arranger?: string;
    lyricist?: string;
    keySignature: string;
    dohPitch: string;
    timeSignature: string;
    tempo?: number;
  };
  systems: SolfaSystem[];
}

export interface ScoreStructureVoiceInfo {
  voiceNumber: number;
  hasEvents: boolean;
}

export interface ScoreStructureStaffInfo {
  staffNumber: number;
  label: string;
  clef: 'treble' | 'bass' | 'alto' | 'tenor';
  voices: ScoreStructureVoiceInfo[];
}

export interface ScoreStructurePartInfo {
  id: string;
  name: string;
  shortName: string;
  staves: ScoreStructureStaffInfo[];
  enabled: boolean;
}

export interface TypesetOptions {
  excludedPartIds?: string[];
  partLabelOverrides?: Record<string, string>;
  keyOverride?: KeySignatureInfo;
  titleOverride?: string;
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

  if (note.octave >= 5) {
    const primes = "'".repeat(note.octave - 4);
    return `${base}${primes}`;
  } else if (note.octave <= 3) {
    const commas = ",".repeat(4 - note.octave);
    return `${base}${commas}`;
  }

  return base;
}

const STEP_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11
};

export function getNotePitchValue(n: ParsedNote): number {
  const step = n.step ? n.step.toUpperCase() : 'C';
  const stepSemi = STEP_SEMITONES[step] ?? 0;
  return (n.octave || 4) * 12 + stepSemi + (n.alter || 0);
}

/**
 * Formats a single event's pitch content into solfa text:
 * single note -> "d'", chord -> "s/m/d" (stacked highest to lowest)
 */
export function formatEventSolfaText(event: ParsedEvent, key: KeySignatureInfo): string {
  if (event.isRest || event.notes.length === 0) return '';
  if (event.notes.length === 1) {
    return formatSolfaLetter(event.notes[0], key);
  }
  // Sort notes from highest pitch to lowest pitch for proper choral chord stacking
  const sortedNotes = [...event.notes].sort((a, b) => getNotePitchValue(b) - getNotePitchValue(a));
  return sortedNotes.map(n => formatSolfaLetter(n, key)).join('/');
}

/**
 * Derives human-readable staff and part labels according to professional score conventions.
 */
export function getHumanReadableStaffLabel(
  partName: string,
  staffNum: number,
  totalStavesInPart: number,
  voiceNum: number,
  totalActiveVoicesOnStaff: number,
  userOverride?: string
): string {
  if (userOverride) return userOverride;

  const lower = partName.toLowerCase().trim();

  // 1. Classical SATB Voice parts
  if (lower === 'soprano' || lower === 'soprano 1' || lower === 's') return 'S';
  if (lower === 'soprano 2') return 'S2';
  if (lower === 'alto' || lower === 'alto 1' || lower === 'a') return 'A';
  if (lower === 'alto 2') return 'A2';
  if (lower === 'tenor' || lower === 'tenor 1' || lower === 't') return 'T';
  if (lower === 'tenor 2') return 'T2';
  if (lower === 'bass' || lower === 'bass 1' || lower === 'b') return 'B';
  if (lower === 'bass 2') return 'B2';

  // 2. Multi-staff instruments (Organ, Piano, Keyboard, Harpsichord, Harp)
  if (totalStavesInPart > 1 || lower.includes('organ') || lower.includes('piano') || lower.includes('keyboard')) {
    const baseName = lower.includes('organ') ? 'Organ' : lower.includes('piano') ? 'Piano' : partName;
    const staffHand = staffNum === 1 ? 'RH' : staffNum === 2 ? 'LH' : `Staff ${staffNum}`;
    if (totalActiveVoicesOnStaff > 1) {
      return `${baseName} ${staffHand} V${voiceNum}`;
    }
    return `${baseName} ${staffHand}`;
  }

  // 3. Single staff instruments with multiple voices
  if (totalActiveVoicesOnStaff > 1) {
    return `${partName} V${voiceNum}`;
  }

  // 4. Default instrument / part label
  return partName;
}

/**
 * Legacy voice short label helper for backward compatibility
 */
export function getVoiceShortLabel(partName: string, index: number): string {
  const lower = partName.toLowerCase().trim();
  if (lower.startsWith('soprano')) return 'S';
  if (lower.startsWith('alto')) return 'A';
  if (lower.startsWith('tenor')) return 'T';
  if (lower.startsWith('bass')) return 'B';
  if (lower.startsWith('voice')) return `V${index + 1}`;
  if (lower.startsWith('piano')) return 'Pno';
  if (lower.startsWith('organ')) return 'Organ';
  return partName.slice(0, 5);
}

/**
 * Extracts and inspects the structural hierarchy (Part → Staff → Voice) of a ParsedScore.
 */
export function inspectScoreStructure(parsedScore: ParsedScore): ScoreStructurePartInfo[] {
  return parsedScore.parts.map(part => {
    // Find all staves and voices present in this part
    const staffSet = new Set<number>();
    const staffVoicesMap = new Map<number, Set<number>>();
    const voiceHasEventsMap = new Map<string, boolean>();

    part.measures.forEach(m => {
      m.events.forEach(e => {
        const staff = e.staff || 1;
        const voice = e.voice || 1;
        staffSet.add(staff);

        if (!staffVoicesMap.has(staff)) {
          staffVoicesMap.set(staff, new Set());
        }
        staffVoicesMap.get(staff)!.add(voice);

        const vKey = `${staff}-${voice}`;
        if (!e.isRest) {
          voiceHasEventsMap.set(vKey, true);
        }
      });
    });

    const stavesCount = Math.max(part.stavesCount || 1, staffSet.size || 1);
    const staves: ScoreStructureStaffInfo[] = [];

    for (let s = 1; s <= stavesCount; s++) {
      const voiceNums = Array.from(staffVoicesMap.get(s) || [1]).sort((a, b) => a - b);
      const clef = (part.clefsByStaff && part.clefsByStaff[s]) || (s === 2 ? 'bass' : part.clef);

      const staffLabel = stavesCount > 1
        ? (s === 1 ? 'Right Hand (Treble)' : s === 2 ? 'Left Hand (Bass)' : `Staff ${s}`)
        : (clef === 'bass' ? 'Bass Staff' : 'Treble Staff');

      staves.push({
        staffNumber: s,
        label: staffLabel,
        clef,
        voices: voiceNums.map(v => ({
          voiceNumber: v,
          hasEvents: voiceHasEventsMap.get(`${s}-${v}`) || false
        }))
      });
    }

    return {
      id: part.id,
      name: part.name,
      shortName: part.shortName,
      staves,
      enabled: true
    };
  });
}

/**
 * Converts events in a measure for a specific staff and voice into SolfaBeatCell[].
 */
export function layoutMeasureBeatsForVoice(
  measure: ParsedMeasure,
  staffNum: number,
  voiceNum: number,
  key: KeySignatureInfo
): SolfaBeatCell[] {
  const [beatsStr] = (measure.timeSignature || '4/4').split('/');
  const numBeats = parseInt(beatsStr || '4', 10) || 4;

  const resultBeats: SolfaBeatCell[] = Array.from({ length: numBeats }, () => ({
    text: '',
    chordSyllables: [],
    isChord: false,
    isSustained: false,
    isRest: false,
    notes: []
  }));

  // Filter events belonging to this specific staff and voice
  const voiceEvents = measure.events.filter(e => {
    const s = e.staff || 1;
    const v = e.voice || 1;
    return s === staffNum && v === voiceNum;
  });

  if (voiceEvents.length === 0) {
    resultBeats.forEach(b => {
      b.isRest = true;
    });
    return resultBeats;
  }

  let currentBeatIndex = 0;
  let subBeatOffset = 0;

  voiceEvents.forEach(event => {
    if (currentBeatIndex >= numBeats) return;

    const eventBeats = event.durationBeats || 1;
    const isChord = event.isChord || event.notes.length > 1;

    // Sort notes top-to-bottom for stacked chord display
    const sortedNotes = [...event.notes].sort((a, b) => getNotePitchValue(b) - getNotePitchValue(a));

    const chordSyllables = event.isRest
      ? []
      : sortedNotes.map(n => formatSolfaLetter(n, key));

    const solfaText = chordSyllables.join('/');

    if (event.isRest) {
      if (subBeatOffset === 0 && eventBeats >= 1) {
        resultBeats[currentBeatIndex].isRest = true;
      }
    } else if (subBeatOffset === 0) {
      // Starts on beat onset
      resultBeats[currentBeatIndex].text = solfaText;
      resultBeats[currentBeatIndex].chordSyllables = chordSyllables;
      resultBeats[currentBeatIndex].isChord = isChord;
      resultBeats[currentBeatIndex].notes = sortedNotes;
      if (event.lyric) resultBeats[currentBeatIndex].lyric = event.lyric;

      // Handle sustained notes across subsequent beats
      const wholeBeatsCovered = Math.floor(eventBeats);
      for (let extra = 1; extra < wholeBeatsCovered && currentBeatIndex + extra < numBeats; extra++) {
        resultBeats[currentBeatIndex + extra].text = '-';
        resultBeats[currentBeatIndex + extra].isSustained = true;
      }
    } else {
      // Subdivision inside the beat (e.g. eighth note dot)
      const currentText = resultBeats[currentBeatIndex].text || '';
      resultBeats[currentBeatIndex].text = currentText ? `${currentText} .${solfaText}` : `.${solfaText}`;
      if (!resultBeats[currentBeatIndex].chordSyllables || resultBeats[currentBeatIndex].chordSyllables.length === 0) {
        resultBeats[currentBeatIndex].chordSyllables = chordSyllables;
      }
      if (isChord) resultBeats[currentBeatIndex].isChord = true;
      if (event.lyric && !resultBeats[currentBeatIndex].lyric) {
        resultBeats[currentBeatIndex].lyric = event.lyric;
      }
    }

    subBeatOffset += eventBeats;
    while (subBeatOffset >= 1 && currentBeatIndex < numBeats) {
      subBeatOffset -= 1;
      currentBeatIndex += 1;
    }
  });

  return resultBeats;
}

/**
 * Backward-compatible single-part layoutMeasureBeats
 */
export function layoutMeasureBeats(
  measure: ParsedMeasure,
  key: KeySignatureInfo
): SolfaBeatCell[] {
  return layoutMeasureBeatsForVoice(measure, 1, 1, key);
}

/**
 * Measure-Density Estimator
 * Calculates the density and visual complexity score of a measure.
 * Dense measures (many events, eighths, chords, lyrics) require greater horizontal width.
 */
function estimateMeasureDensity(
  mNum: number,
  parts: ParsedPart[],
  stavesAndVoicesList: Array<{ partId: string; staffNum: number; voiceNum: number }>
): number {
  let density = 1.0;
  let activeVoiceCount = 0;
  let totalEvents = 0;
  let lyricCharacters = 0;
  let maxChordNotes = 1;

  stavesAndVoicesList.forEach(sv => {
    const part = parts.find(p => p.id === sv.partId);
    if (!part) return;
    const measure = part.measures.find(m => m.number === mNum);
    if (!measure) return;

    const events = measure.events.filter(e => {
      const s = e.staff || 1;
      const v = e.voice || 1;
      return s === sv.staffNum && v === sv.voiceNum && !e.isRest;
    });

    if (events.length > 0) {
      activeVoiceCount++;
      totalEvents += events.length;

      events.forEach(e => {
        if (e.durationBeats <= 0.5) density += 0.3; // eighth subdivision
        if (e.durationBeats <= 0.25) density += 0.5; // sixteenth subdivision
        if (e.notes.length > maxChordNotes) maxChordNotes = e.notes.length;
        if (e.lyric) lyricCharacters += e.lyric.length;
      });
    }
  });

  if (activeVoiceCount > 2) density += 0.3;
  if (maxChordNotes > 1) density += 0.25 * (maxChordNotes - 1);
  if (lyricCharacters > 0) density += Math.min(1.0, lyricCharacters * 0.04);
  if (totalEvents > 8) density += 0.4;

  return Math.max(0.7, Math.min(3.5, density));
}

/**
 * Complete Tonic Sol-Fa Document Typesetting Engine V3
 * Produces structured A4 SolfaSheetPage[] preserving all parts, staves, and voices.
 */
export function layoutTonicSolfaDocument(
  parsedScore: ParsedScore,
  options?: TypesetOptions
): SolfaSheetPage[] {
  const effectiveTitle = options?.titleOverride || parsedScore.title;
  const effectiveKey = options?.keyOverride || parsedScore.keySignature;

  // 1. Filter out parts that user explicitly disabled in Score Structure Panel
  const excludedIds = new Set(options?.excludedPartIds || []);
  const activeParts = parsedScore.parts.filter(p => !excludedIds.has(p.id));

  const partsToTypeset = activeParts.length > 0 ? activeParts : parsedScore.parts;
  const totalMeasures = parsedScore.measuresCount || 1;

  // 2. Discover all (Part, Staff, Voice) units
  interface StaffVoiceSpec {
    rowKey: string;
    partId: string;
    partName: string;
    staffNum: number;
    totalStavesInPart: number;
    voiceNum: number;
    clef: 'treble' | 'bass' | 'alto' | 'tenor';
  }

  const allStaffVoices: StaffVoiceSpec[] = [];

  partsToTypeset.forEach(part => {
    const staffSet = new Set<number>();
    const staffVoicesMap = new Map<number, Set<number>>();

    part.measures.forEach(m => {
      m.events.forEach(e => {
        const s = e.staff || 1;
        const v = e.voice || 1;
        staffSet.add(s);
        if (!staffVoicesMap.has(s)) staffVoicesMap.set(s, new Set());
        staffVoicesMap.get(s)!.add(v);
      });
    });

    const stavesCount = Math.max(part.stavesCount || 1, staffSet.size || 1);

    for (let s = 1; s <= stavesCount; s++) {
      const voiceNums = Array.from(staffVoicesMap.get(s) || [1]).sort((a, b) => a - b);
      const clef = (part.clefsByStaff && part.clefsByStaff[s]) || (s === 2 ? 'bass' : part.clef);

      voiceNums.forEach(v => {
        allStaffVoices.push({
          rowKey: `${part.id}-s${s}-v${v}`,
          partId: part.id,
          partName: part.name,
          staffNum: s,
          totalStavesInPart: stavesCount,
          voiceNum: v,
          clef
        });
      });
    }
  });

  // 3. Compute dynamic measures per system via Measure-Density Estimator
  const systemRanges: Array<[number, number]> = [];
  let mCursor = 1;

  while (mCursor <= totalMeasures) {
    let currentSystemDensity = 0;
    const startM = mCursor;
    let endM = mCursor;

    // Target density budget per system is ~3.2 to 4.2 (allows 2 dense measures, 3 moderate, or 4 simple)
    const MAX_SYSTEM_DENSITY = 3.8;
    const MAX_MEASURES_PER_SYS = 4;

    while (endM <= totalMeasures) {
      const density = estimateMeasureDensity(endM, partsToTypeset, allStaffVoices);
      const measuresCount = endM - startM + 1;

      if (measuresCount > 1 && (currentSystemDensity + density > MAX_SYSTEM_DENSITY || measuresCount > MAX_MEASURES_PER_SYS)) {
        break;
      }

      currentSystemDensity += density;
      endM++;
    }

    const actualEndM = Math.max(startM, endM - 1);
    systemRanges.push([startM, actualEndM]);
    mCursor = actualEndM + 1;
  }

  // 4. Build Systems with Suppression of Inactive Internal Voices (Requirement 7)
  const systems: SolfaSystem[] = systemRanges.map(([mStart, mEnd], sysIndex) => {
    // Determine which (Part, Staff, Voice) units have active musical events in [mStart, mEnd]
    const activeUnitsInSystem = allStaffVoices.filter(sv => {
      const part = partsToTypeset.find(p => p.id === sv.partId);
      if (!part) return false;

      return part.measures.some(m => {
        if (m.number < mStart || m.number > mEnd) return false;
        return m.events.some(e => {
          const s = e.staff || 1;
          const v = e.voice || 1;
          return s === sv.staffNum && v === sv.voiceNum && !e.isRest;
        });
      });
    });

    // Fallback: If score is entirely resting in this system, keep the primary staff of each part
    const unitsToRender = activeUnitsInSystem.length > 0
      ? activeUnitsInSystem
      : allStaffVoices.filter(sv => sv.staffNum === 1 && sv.voiceNum === 1);

    // Calculate dynamic measure widths based on density within this system
    const measureDensities = new Map<number, number>();
    let totalDensityInSys = 0;

    for (let m = mStart; m <= mEnd; m++) {
      const d = estimateMeasureDensity(m, partsToTypeset, unitsToRender);
      measureDensities.set(m, d);
      totalDensityInSys += d;
    }

    const measureHeaders: SystemMeasureHeader[] = [];
    for (let m = mStart; m <= mEnd; m++) {
      const d = measureDensities.get(m) || 1.0;
      const widthPercent = Math.round((d / (totalDensityInSys || 1)) * 100);

      // Find any rehearsal marks, directions, or key changes at this measure
      const firstPart = partsToTypeset[0];
      const mObj = firstPart?.measures.find(x => x.number === m);

      let modulationText: string | undefined;
      if (mObj?.isKeyChange && mObj.keySignature) {
        modulationText = `Doh is ${mObj.keySignature.tonicStep}${mObj.keySignature.tonicAlter === 1 ? '♯' : mObj.keySignature.tonicAlter === -1 ? '♭' : ''}`;
      }

      measureHeaders.push({
        measureNumber: m,
        widthPercent,
        rehearsalMark: mObj?.rehearsalMark,
        directionWords: mObj?.directionWords,
        tempoBpm: mObj?.tempoBpm,
        modulationText,
        timeChangeText: mObj?.isTimeChange ? mObj.timeSignature : undefined
      });
    }

    // Build the rendered voice rows for this system
    const voiceRows: SolfaVoiceSystemRow[] = unitsToRender.map(sv => {
      const part = partsToTypeset.find(p => p.id === sv.partId)!;

      // Count active voices on this staff within this system
      const activeVoicesOnThisStaff = unitsToRender.filter(
        u => u.partId === sv.partId && u.staffNum === sv.staffNum
      ).length;

      const userOverride = options?.partLabelOverrides?.[sv.rowKey] || options?.partLabelOverrides?.[sv.partId];
      const displayLabel = getHumanReadableStaffLabel(
        sv.partName,
        sv.staffNum,
        sv.totalStavesInPart,
        sv.voiceNum,
        activeVoicesOnThisStaff,
        userOverride
      );

      const measures: SolfaMeasureCell[] = [];
      let rowHasLyrics = false;
      const lyricsRowData: Array<{ measureNumber: number; lyricTexts: string[] }> = [];

      for (let mNum = mStart; mNum <= mEnd; mNum++) {
        const measure = part.measures.find(m => m.number === mNum);
        const mKey = measure?.keySignature || effectiveKey;
        const timeSig = measure?.timeSignature || parsedScore.timeSignature;

        if (measure) {
          const beats = layoutMeasureBeatsForVoice(measure, sv.staffNum, sv.voiceNum, mKey);
          const hasNotes = beats.some(b => !b.isRest && Boolean(b.text));

          if (beats.some(b => Boolean(b.lyric))) {
            rowHasLyrics = true;
          }

          measures.push({
            measureNumber: mNum,
            timeSignature: timeSig,
            keySignature: mKey,
            beats,
            isEndBar: mNum === totalMeasures,
            isDoubleBar: measure.isKeyChange || measure.isTimeChange,
            isEntirelyRest: !hasNotes
          });

          lyricsRowData.push({
            measureNumber: mNum,
            lyricTexts: beats.map(b => b.lyric || '')
          });
        } else {
          // Placeholder measure
          const beats = layoutMeasureBeatsForVoice({
            number: mNum,
            keySignature: mKey,
            timeSignature: timeSig,
            events: []
          }, sv.staffNum, sv.voiceNum, mKey);

          measures.push({
            measureNumber: mNum,
            timeSignature: timeSig,
            keySignature: mKey,
            beats,
            isEndBar: mNum === totalMeasures,
            isEntirelyRest: true
          });

          lyricsRowData.push({
            measureNumber: mNum,
            lyricTexts: beats.map(() => '')
          });
        }
      }

      return {
        rowId: sv.rowKey,
        partId: sv.partId,
        partName: sv.partName,
        staffNumber: sv.staffNum,
        voiceNumber: sv.voiceNum,
        displayLabel,
        shortLabel: displayLabel,
        clef: sv.clef,
        hasLyrics: rowHasLyrics,
        measures,
        lyricsRow: rowHasLyrics ? lyricsRowData : undefined
      };
    });

    return {
      systemIndex: sysIndex,
      measuresRange: [mStart, mEnd],
      measureHeaders,
      voiceRows
    };
  });

  // 5. Explicit A4 Pagination Engine (Requirements 10, 11, 13, 14, 29)
  // Page height budget:
  // A4 portrait @ 96DPI is ~1123px height.
  // Margins: top 48px, bottom 48px.
  // First page has title header (~160px) + footer (~35px) -> usable ~830px.
  // Later pages have running header (~40px) + footer (~35px) -> usable ~950px.
  //
  // System height calculation:
  // - Measure numbers / banner: 24px
  // - For each voice row: 38px
  // - For each lyrics row: 20px
  // - System gap: 28px
  function calculateSystemHeight(sys: SolfaSystem): number {
    let height = 24 + 28; // header + gap
    sys.voiceRows.forEach(vr => {
      // If voice has chords, allow slightly taller row
      const hasChords = vr.measures.some(m => m.beats.some(b => b.isChord));
      height += hasChords ? 46 : 36;
      if (vr.hasLyrics) {
        height += 20;
      }
    });
    return height;
  }

  const pages: SolfaSheetPage[] = [];
  let currentSystemIdx = 0;
  let pageNum = 1;

  while (currentSystemIdx < systems.length) {
    const isFirstPage = pageNum === 1;
    const usableHeight = isFirstPage ? 830 : 950;

    let accumulatedHeight = 0;
    const pageSystems: SolfaSystem[] = [];

    while (currentSystemIdx < systems.length) {
      const nextSys = systems[currentSystemIdx];
      const nextSysHeight = calculateSystemHeight(nextSys);

      // Always place at least 1 system per page to prevent infinite loops
      if (pageSystems.length > 0 && accumulatedHeight + nextSysHeight > usableHeight) {
        break;
      }

      pageSystems.push(nextSys);
      accumulatedHeight += nextSysHeight;
      currentSystemIdx++;
    }

    pages.push({
      pageNumber: pageNum++,
      totalPages: 1, // updated below
      isFirstPage,
      header: {
        title: effectiveTitle,
        subtitle: 'Tonic Sol-fa Score',
        composer: parsedScore.composer,
        arranger: parsedScore.arranger,
        lyricist: parsedScore.lyricist,
        keySignature: effectiveKey.name,
        dohPitch: `Doh is ${effectiveKey.tonicStep}${effectiveKey.tonicAlter === 1 ? '♯' : effectiveKey.tonicAlter === -1 ? '♭' : ''}`,
        timeSignature: parsedScore.timeSignature,
        tempo: parsedScore.tempoBpm
      },
      systems: pageSystems
    });
  }

  // Update total pages
  const finalTotalPages = pages.length;
  pages.forEach(p => {
    p.totalPages = finalTotalPages;
  });

  return pages;
}
