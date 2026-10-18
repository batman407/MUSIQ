/**
 * MUSIQ Musical Structure & Texture Inference Engine
 *
 * Implements genuine structural inference for MusicXML scores:
 * 1. Physical staff != musical role (disregards raw OMR voice IDs)
 * 2. Timeline reconstruction & voice continuity analysis
 * 3. Four-part hymn/chorale texture detection (SATB)
 * 4. Genuine piano / keyboard protection (prevents false SATB on real piano)
 * 5. Preservation of authentic instrument identities (Trumpet, Organ, etc.)
 * 6. User confirmation & structural override modes (AUTO, SATB, KEYBOARD, INSTRUMENTAL, CUSTOM)
 * 7. Generation of stable logical musical voices (S, A, T, B) across all systems
 */

import type {
  ParsedScore,
  ParsedPart,
  ParsedMeasure,
  ParsedEvent,
  ParsedNote,
  KeySignatureInfo
} from './musicXmlParser.ts';

export type StructureInferenceMode =
  | 'AUTO'
  | 'SATB'
  | 'VOCAL_PARTS'
  | 'KEYBOARD'
  | 'INSTRUMENTAL'
  | 'CUSTOM';

export interface LogicalVoiceSpec {
  id: string; // e.g. "satb-s", "satb-a", "piano-rh", "trumpet-1"
  role: 'S' | 'A' | 'T' | 'B' | 'RH' | 'LH' | 'LEAD' | 'ACCOMP' | 'CUSTOM' | 'STAFF_VOICE';
  label: string; // e.g. "S", "A", "T", "B", "Piano RH", "Trumpet"
  fullName: string; // e.g. "Soprano", "Alto", "Tenor", "Bass", "Trumpet"
  clef: 'treble' | 'bass' | 'alto' | 'tenor';
  sourceStaffNumber?: number;
  sourcePartId?: string;
}

export interface StructureInferenceResult {
  detectedMode: 'SATB' | 'VOCAL_PARTS' | 'KEYBOARD' | 'INSTRUMENTAL';
  confidence: number; // 0.0 to 1.0 (real calculated confidence)
  evidence: string[]; // human-readable evidentiary findings
  badgeText: string; // UI summary e.g. "Four-part harmony (SATB)"
  partsSummary: string; // e.g. "Soprano · Alto · Tenor · Bass"
  logicalVoices: LogicalVoiceSpec[];
}

/**
 * Normalizes ugly filenames into clean, professional title headers.
 * e.g. "TO_GOD_BE_THE-_GLORY" -> "TO GOD BE THE GLORY"
 * e.g. "hymn_of_praise_final.musicxml" -> "Hymn Of Praise Final"
 */
export function normalizeScoreTitle(rawTitle: string): string {
  if (!rawTitle) return 'Score';
  // Strip file extensions
  let title = rawTitle.replace(/\.(pdf|musicxml|xml|mxl|png|jpe?g)$/i, '');
  // Replace underscores, hyphens, and combinations with spaces
  title = title.replace(/[-_]+/g, ' ');
  // Clean up extra whitespace
  title = title.replace(/\s+/g, ' ').trim();

  // If all uppercase and longer than 3 chars, retain uppercase formatting
  // but if all lowercase, convert to Title Case
  if (title === title.toLowerCase()) {
    title = title
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return title || 'Score';
}

const STEP_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11
};

export function getNotePitchNumber(n: ParsedNote): number {
  const step = n.step ? n.step.toUpperCase() : 'C';
  const stepSemi = STEP_SEMITONES[step] ?? 0;
  return (n.octave || 4) * 12 + stepSemi + (n.alter || 0);
}

/**
 * Texture & Structure Inference Engine
 * Analyzes physical layout, voice counts, onset synchrony, pitch ranges, and lyrics
 * to infer whether a score is SATB hymn harmony, instrumental piano, or ensemble.
 */
export function inferScoreStructure(score: ParsedScore): StructureInferenceResult {
  const parts = score.parts || [];
  const totalParts = parts.length;

  // 1. Check for explicit SATB vocal indications in parts list
  const explicitSatbMatch = parts.every(p => {
    const l = p.name.toLowerCase().trim();
    return (
      l.startsWith('soprano') || l === 's' ||
      l.startsWith('alto') || l === 'a' ||
      l.startsWith('tenor') || l === 't' ||
      l.startsWith('bass') || l === 'b'
    );
  }) && totalParts >= 3;

  if (explicitSatbMatch) {
    const logicalVoices: LogicalVoiceSpec[] = parts.map(p => {
      const l = p.name.toLowerCase().trim();
      let role: LogicalVoiceSpec['role'] = 'CUSTOM';
      let label = p.shortName || p.name;
      let fullName = p.name;
      let clef: 'treble' | 'bass' = p.clef === 'bass' ? 'bass' : 'treble';

      if (l.startsWith('soprano') || l === 's') {
        role = 'S'; label = 'S'; fullName = 'Soprano'; clef = 'treble';
      } else if (l.startsWith('alto') || l === 'a') {
        role = 'A'; label = 'A'; fullName = 'Alto'; clef = 'treble';
      } else if (l.startsWith('tenor') || l === 't') {
        role = 'T'; label = 'T'; fullName = 'Tenor'; clef = 'bass';
      } else if (l.startsWith('bass') || l === 'b') {
        role = 'B'; label = 'B'; fullName = 'Bass'; clef = 'bass';
      }

      return {
        id: p.id,
        role,
        label,
        fullName,
        clef,
        sourcePartId: p.id
      };
    });

    return {
      detectedMode: 'SATB',
      confidence: 0.98,
      evidence: [
        'Score explicitly identifies Soprano, Alto, Tenor, and Bass vocal parts',
        'Independent vocal staves with explicit voice nomenclature'
      ],
      badgeText: 'Four-part vocal (SATB)',
      partsSummary: 'Soprano · Alto · Tenor · Bass',
      logicalVoices
    };
  }

  // 2. Check for explicit instrumental identities (Trumpet, Horn, Trombone, Flute, Violin, etc.)
  const knownInstruments = [
    'trumpet', 'horn', 'trombone', 'tuba', 'flute', 'clarinet', 'oboe', 'bassoon',
    'violin', 'viola', 'cello', 'contrabass', 'guitar', 'harp'
  ];

  const hasExplicitInstruments = parts.some(p => {
    const l = p.name.toLowerCase();
    return knownInstruments.some(inst => l.includes(inst));
  });

  if (hasExplicitInstruments) {
    const logicalVoices: LogicalVoiceSpec[] = [];
    parts.forEach(p => {
      const l = p.name.toLowerCase();
      const stavesCount = p.stavesCount || 1;
      if (stavesCount > 1 || l.includes('organ') || l.includes('piano')) {
        logicalVoices.push({
          id: `${p.id}-rh`,
          role: 'RH',
          label: `${p.name} RH`,
          fullName: `${p.name} Right Hand`,
          clef: 'treble',
          sourcePartId: p.id,
          sourceStaffNumber: 1
        });
        logicalVoices.push({
          id: `${p.id}-lh`,
          role: 'LH',
          label: `${p.name} LH`,
          fullName: `${p.name} Left Hand`,
          clef: 'bass',
          sourcePartId: p.id,
          sourceStaffNumber: 2
        });
      } else {
        logicalVoices.push({
          id: p.id,
          role: 'LEAD',
          label: p.shortName || p.name,
          fullName: p.name,
          clef: p.clef,
          sourcePartId: p.id
        });
      }
    });

    return {
      detectedMode: 'INSTRUMENTAL',
      confidence: 0.95,
      evidence: [
        'Explicit instrument identities detected (non-vocal instrumentation)',
        'Multi-part instrumental score structure preserved'
      ],
      badgeText: 'Instrumental Score',
      partsSummary: parts.map(p => p.name).join(' · '),
      logicalVoices
    };
  }

  // 3. Two-Staff Grand Staff Analysis (Hymn/Chorale vs Real Piano)
  // Grand staff can be 1 part with 2 staves, or 2 parts (treble + bass)
  const isGrandStaff =
    (totalParts === 1 && (parts[0].stavesCount || 1) >= 2) ||
    (totalParts === 2 && parts[0].clef === 'treble' && parts[1].clef === 'bass');

  if (isGrandStaff) {
    const primaryPart = parts[0];
    const measures = primaryPart.measures || [];

    // Metric A: Presence of vocal lyrics
    let totalLyricsCount = 0;
    let totalNonRestNotes = 0;
    measures.forEach(m => {
      m.events.forEach(e => {
        if (!e.isRest) {
          totalNonRestNotes += e.notes.length;
          if (e.lyric || e.notes.some(n => Boolean(n.lyric))) {
            totalLyricsCount++;
          }
        }
      });
    });
    const hasLyrics = totalLyricsCount > 0;
    const lyricRatio = totalNonRestNotes > 0 ? totalLyricsCount / (measures.length || 1) : 0;

    // Metric B: Average simultaneous sounding notes per musical onset & homophony
    let onsetSampleCount = 0;
    let totalSoundingPitchesAtOnsets = 0;
    let synchronizedOnsetsCount = 0;
    let staff1OnsetsCount = 0;
    let staff2OnsetsCount = 0;

    measures.forEach(m => {
      // Group events by staff
      const staff1Events = m.events.filter(e => (e.staff || 1) === 1 && !e.isRest);
      const staff2Events = m.events.filter(e => (e.staff || 1) === 2 && !e.isRest);

      staff1OnsetsCount += staff1Events.length;
      staff2OnsetsCount += staff2Events.length;

      // Group notes across both staves by approximate beat onset
      // Since MusicXML events may have duration offsets, we sample across beats
      const notesByBeat = new Map<number, ParsedNote[]>();

      let beatCursorS1 = 0;
      staff1Events.forEach(e => {
        const b = Math.round(beatCursorS1 * 4) / 4;
        if (!notesByBeat.has(b)) notesByBeat.set(b, []);
        notesByBeat.get(b)!.push(...e.notes);
        beatCursorS1 += e.durationBeats || 1;
      });

      let beatCursorS2 = 0;
      staff2Events.forEach(e => {
        const b = Math.round(beatCursorS2 * 4) / 4;
        if (!notesByBeat.has(b)) notesByBeat.set(b, []);
        notesByBeat.get(b)!.push(...e.notes);
        beatCursorS2 += e.durationBeats || 1;
      });

      notesByBeat.forEach(notes => {
        onsetSampleCount++;
        totalSoundingPitchesAtOnsets += notes.length;
        const hasStaff1 = notes.some(n => (n.staff || 1) === 1);
        const hasStaff2 = notes.some(n => (n.staff || 1) === 2);
        if (hasStaff1 && hasStaff2) {
          synchronizedOnsetsCount++;
        }
      });
    });

    const avgSimultaneousPitches = onsetSampleCount > 0
      ? totalSoundingPitchesAtOnsets / onsetSampleCount
      : 2;

    const homophonyRatio = onsetSampleCount > 0
      ? synchronizedOnsetsCount / onsetSampleCount
      : 0.5;

    // Metric C: Pitch separation between Treble and Bass staves
    let staff1PitchSum = 0;
    let staff1PitchCount = 0;
    let staff2PitchSum = 0;
    let staff2PitchCount = 0;

    measures.forEach(m => {
      m.events.forEach(e => {
        if (!e.isRest) {
          e.notes.forEach(n => {
            const pitch = getNotePitchNumber(n);
            if ((n.staff || 1) === 1) {
              staff1PitchSum += pitch;
              staff1PitchCount++;
            } else {
              staff2PitchSum += pitch;
              staff2PitchCount++;
            }
          });
        }
      });
    });

    const avgStaff1Pitch = staff1PitchCount > 0 ? staff1PitchSum / staff1PitchCount : 67; // ~G4
    const avgStaff2Pitch = staff2PitchCount > 0 ? staff2PitchSum / staff2PitchCount : 50; // ~D3
    const hasConsistentStaffPitchSeparation = avgStaff1Pitch - avgStaff2Pitch >= 10; // at least a minor 7th

    // Evidence calculation
    const evidence: string[] = [];
    let satbScore = 0;

    // 1. Two-staff grand staff layout
    evidence.push('Two-staff grand staff layout with Treble and Bass clefs');
    satbScore += 0.20;

    // 2. Choral harmonic density (~3.2 to 4.8 simultaneous notes)
    if (avgSimultaneousPitches >= 2.8 && avgSimultaneousPitches <= 5.0) {
      evidence.push(`Persistent four-part harmonic density (average ${avgSimultaneousPitches.toFixed(1)} notes per onset)`);
      satbScore += 0.25;
    } else {
      evidence.push(`Variable polyphony (${avgSimultaneousPitches.toFixed(1)} notes per onset)`);
    }

    // 3. Homophonic rhythm ratio
    if (homophonyRatio >= 0.65) {
      evidence.push(`Homophonic choral motion (${Math.round(homophonyRatio * 100)}% synchronized rhythmic onsets across staves)`);
      satbScore += 0.25;
    } else {
      evidence.push(`Rhythmically independent voices (${Math.round((1 - homophonyRatio) * 100)}% polyphonic independence)`);
    }

    // 4. Vocal lyrics presence
    if (hasLyrics) {
      evidence.push('Vocal hymn lyrics associated with score events');
      satbScore += 0.25;
    } else {
      evidence.push('No vocal lyrics detected (instrumental texture indicator)');
    }

    // 5. Pitch register separation (Treble = S/A, Bass = T/B)
    if (hasConsistentStaffPitchSeparation) {
      evidence.push('Distinct vocal registers between Treble (S/A) and Bass (T/B) staves');
      satbScore += 0.10;
    }

    const satbConfidence = Math.min(0.98, Math.round(satbScore * 100) / 100);

    // Decision: If confidence >= 0.70, infer SATB four-part harmony
    if (satbConfidence >= 0.70) {
      const logicalVoices: LogicalVoiceSpec[] = [
        { id: 'satb-s', role: 'S', label: 'S', fullName: 'Soprano', clef: 'treble', sourceStaffNumber: 1 },
        { id: 'satb-a', role: 'A', label: 'A', fullName: 'Alto', clef: 'treble', sourceStaffNumber: 1 },
        { id: 'satb-t', role: 'T', label: 'T', fullName: 'Tenor', clef: 'bass', sourceStaffNumber: 2 },
        { id: 'satb-b', role: 'B', label: 'B', fullName: 'Bass', clef: 'bass', sourceStaffNumber: 2 }
      ];

      return {
        detectedMode: 'SATB',
        confidence: satbConfidence,
        evidence,
        badgeText: 'Four-part harmony (SATB)',
        partsSummary: 'Soprano · Alto · Tenor · Bass',
        logicalVoices
      };
    } else {
      // PROTECT REAL PIANO FROM FALSE SATB
      const keyboardConfidence = Math.max(0.75, Math.round((1 - (satbConfidence - 0.2)) * 100) / 100);
      const logicalVoices: LogicalVoiceSpec[] = [
        { id: 'piano-rh', role: 'RH', label: 'Piano RH', fullName: 'Right Hand', clef: 'treble', sourceStaffNumber: 1 },
        { id: 'piano-lh', role: 'LH', label: 'Piano LH', fullName: 'Left Hand', clef: 'bass', sourceStaffNumber: 2 }
      ];

      return {
        detectedMode: 'KEYBOARD',
        confidence: keyboardConfidence,
        evidence: [
          'Keyboard instrumental texture without sufficient evidence for vocal chorale',
          ...evidence
        ],
        badgeText: 'Keyboard (Piano RH / LH)',
        partsSummary: 'Piano RH · Piano LH',
        logicalVoices
      };
    }
  }

  // 4. Default Monophonic or Generic Multi-Part Score
  const logicalVoices: LogicalVoiceSpec[] = parts.map(p => ({
    id: p.id,
    role: 'LEAD',
    label: p.shortName || p.name,
    fullName: p.name,
    clef: p.clef,
    sourcePartId: p.id
  }));

  return {
    detectedMode: 'INSTRUMENTAL',
    confidence: 0.85,
    evidence: ['Standard score structure mapped from detected parts'],
    badgeText: `${parts.length}-Part Score`,
    partsSummary: parts.map(p => p.name).join(' · '),
    logicalVoices
  };
}

/**
 * Voice Continuity & SATB Separation Engine
 * Takes a raw grand-staff score (with arbitrary OMR voice IDs) and separates notes into
 * four stable, persistent logical voices: Soprano, Alto, Tenor, Bass.
 */
export function extractSatbLogicalScore(score: ParsedScore): ParsedScore {
  const parts = score.parts || [];
  if (parts.length === 0) return score;

  // If already 4 explicit SATB parts, ensure proper S/A/T/B labeling and return
  if (parts.length >= 4) {
    const isExplicitSatb = parts.some(p => {
      const l = p.name.toLowerCase();
      return l.startsWith('sop') || l.startsWith('alt') || l.startsWith('ten') || l.startsWith('bas');
    });

    if (isExplicitSatb) {
      const remappedParts = parts.slice(0, 4).map((p, idx) => {
        const labels = ['S', 'A', 'T', 'B'];
        const fullNames = ['Soprano', 'Alto', 'Tenor', 'Bass'];
        return {
          ...p,
          name: fullNames[idx] || p.name,
          shortName: labels[idx] || p.shortName
        };
      });
      return {
        ...score,
        parts: remappedParts
      };
    }
  }

  const primaryPart = parts[0];
  const maxMeasures = score.measuresCount || primaryPart.measures.length || 1;

  // We will build 4 logical ParsedPart objects:
  // Part 1: S (Soprano) - Treble
  // Part 2: A (Alto) - Treble
  // Part 3: T (Tenor) - Bass
  // Part 4: B (Bass) - Bass

  const sMeasures: ParsedMeasure[] = [];
  const aMeasures: ParsedMeasure[] = [];
  const tMeasures: ParsedMeasure[] = [];
  const bMeasures: ParsedMeasure[] = [];

  // Track previous pitches for voice continuity across measures
  let lastSPitch = 72; // C5
  let lastAPitch = 64; // E4
  let lastTPitch = 57; // A3
  let lastBPitch = 48; // C3

  for (let mIdx = 1; mIdx <= maxMeasures; mIdx++) {
    // Find measure across parts
    const mObj = primaryPart.measures.find(m => m.number === mIdx) || {
      number: mIdx,
      keySignature: score.keySignature,
      timeSignature: score.timeSignature,
      events: []
    };

    const keySig = mObj.keySignature || score.keySignature;
    const timeSig = mObj.timeSignature || score.timeSignature;

    // Collect all events in this measure across staves
    const staff1Events = mObj.events.filter(e => (e.staff || 1) === 1);
    const staff2Events = mObj.events.filter(e => (e.staff || 1) === 2);

    // Extract shared measure lyric if any
    let measureSharedLyric: string | undefined;
    for (const e of mObj.events) {
      if (e.lyric) {
        measureSharedLyric = e.lyric;
        break;
      }
      for (const n of e.notes) {
        if (n.lyric) {
          measureSharedLyric = n.lyric;
          break;
        }
      }
      if (measureSharedLyric) break;
    }

    // Process Staff 1 -> S & A
    const { sEvents, aEvents, newSPitch, newAPitch } = separateStaffIntoTwoVoices(
      staff1Events,
      'treble',
      lastSPitch,
      lastAPitch,
      measureSharedLyric
    );
    lastSPitch = newSPitch;
    lastAPitch = newAPitch;

    // Process Staff 2 -> T & B
    const { sEvents: tEvents, aEvents: bEvents, newSPitch: newTPitch, newAPitch: newBPitch } = separateStaffIntoTwoVoices(
      staff2Events,
      'bass',
      lastTPitch,
      lastBPitch,
      undefined // Bass staff typically shares lyric or reads beneath
    );
    lastTPitch = newTPitch;
    lastBPitch = newBPitch;

    sMeasures.push({
      number: mIdx,
      keySignature: keySig,
      timeSignature: timeSig,
      events: sEvents,
      rehearsalMark: mObj.rehearsalMark,
      directionWords: mObj.directionWords,
      tempoBpm: mObj.tempoBpm,
      isKeyChange: mObj.isKeyChange,
      isTimeChange: mObj.isTimeChange
    });

    aMeasures.push({
      number: mIdx,
      keySignature: keySig,
      timeSignature: timeSig,
      events: aEvents
    });

    tMeasures.push({
      number: mIdx,
      keySignature: keySig,
      timeSignature: timeSig,
      events: tEvents
    });

    bMeasures.push({
      number: mIdx,
      keySignature: keySig,
      timeSignature: timeSig,
      events: bEvents
    });
  }

  const satbParts: ParsedPart[] = [
    {
      id: 'part-satb-s',
      name: 'Soprano',
      shortName: 'S',
      clef: 'treble',
      color: '#8B5CF6',
      measures: sMeasures
    },
    {
      id: 'part-satb-a',
      name: 'Alto',
      shortName: 'A',
      clef: 'treble',
      color: '#67E8F9',
      measures: aMeasures
    },
    {
      id: 'part-satb-t',
      name: 'Tenor',
      shortName: 'Tenor',
      clef: 'bass',
      color: '#4ADE80',
      measures: tMeasures
    },
    {
      id: 'part-satb-b',
      name: 'Bass',
      shortName: 'B',
      clef: 'bass',
      color: '#FBBF24',
      measures: bMeasures
    }
  ];

  return {
    ...score,
    title: normalizeScoreTitle(score.title),
    parts: satbParts
  };
}

/**
 * Separates events on a single staff into upper (Voice 1: S or T) and lower (Voice 2: A or B).
 * Preserves voice-leading continuity and handles chords, rests, and lyrics.
 */
function separateStaffIntoTwoVoices(
  events: ParsedEvent[],
  clef: 'treble' | 'bass',
  prevUpperPitch: number,
  prevLowerPitch: number,
  fallbackLyric?: string
): {
  sEvents: ParsedEvent[];
  aEvents: ParsedEvent[];
  newSPitch: number;
  newAPitch: number;
} {
  const sEvents: ParsedEvent[] = [];
  const aEvents: ParsedEvent[] = [];

  let currentUpperPitch = prevUpperPitch;
  let currentLowerPitch = prevLowerPitch;

  if (events.length === 0) {
    // Both rest for this measure
    const restEvent: ParsedEvent = {
      id: `rest-${clef}`,
      isRest: true,
      isChord: false,
      notes: [],
      rhythmSymbol: '𝄻',
      durationName: 'whole',
      durationBeats: 4,
      voice: 1,
      staff: 1
    };
    return {
      sEvents: [{ ...restEvent, id: `rest-s-${clef}` }],
      aEvents: [{ ...restEvent, id: `rest-a-${clef}` }],
      newSPitch: currentUpperPitch,
      newAPitch: currentLowerPitch
    };
  }

  // Step 1: Flatten and collect all notes on this staff
  events.forEach((event, eIdx) => {
    if (event.isRest) {
      sEvents.push({ ...event, id: `s-${event.id}`, staff: 1, voice: 1, notes: [] });
      aEvents.push({ ...event, id: `a-${event.id}`, staff: 1, voice: 1, notes: [] });
      return;
    }

    const notes = [...event.notes].sort((a, b) => getNotePitchNumber(b) - getNotePitchNumber(a));

    if (notes.length >= 2) {
      // 2 or more pitches in chord -> Highest note to Upper (S/T), second to Lower (A/B)
      const highNote = { ...notes[0], staff: 1, voice: 1 };
      const lowNote = { ...notes[1], staff: 1, voice: 1 };

      currentUpperPitch = getNotePitchNumber(highNote);
      currentLowerPitch = getNotePitchNumber(lowNote);

      const highLyric = event.lyric || highNote.lyric || fallbackLyric;
      const lowLyric = lowNote.lyric || undefined;

      sEvents.push({
        ...event,
        id: `s-${event.id}`,
        staff: 1,
        voice: 1,
        isChord: false,
        notes: [highNote],
        lyric: highLyric
      });

      aEvents.push({
        ...event,
        id: `a-${event.id}`,
        staff: 1,
        voice: 1,
        isChord: false,
        notes: [lowNote],
        lyric: lowLyric
      });
    } else if (notes.length === 1) {
      // Single note on staff
      const singleNote = { ...notes[0], staff: 1, voice: 1 };
      const notePitch = getNotePitchNumber(singleNote);

      // In choral writing: if only one note is present on treble staff,
      // Soprano sings the melody; Alto either sings unison or rests.
      // On bass staff: Bass sings the root note; Tenor sings unison or rests.
      const distToUpper = Math.abs(notePitch - currentUpperPitch);
      const distToLower = Math.abs(notePitch - currentLowerPitch);

      const lyric = event.lyric || singleNote.lyric || fallbackLyric;

      if (clef === 'treble') {
        // Default single note on treble staff belongs to Soprano
        currentUpperPitch = notePitch;
        sEvents.push({
          ...event,
          id: `s-${event.id}`,
          staff: 1,
          voice: 1,
          isChord: false,
          notes: [singleNote],
          lyric
        });

        // Alto doubles in unison or rests
        aEvents.push({
          ...event,
          id: `a-${event.id}`,
          staff: 1,
          voice: 1,
          isChord: false,
          notes: [singleNote],
          lyric: undefined
        });
      } else {
        // On bass staff: if note is deep, it's Bass; if high, Tenor
        if (notePitch <= 53 || distToLower <= distToUpper) {
          currentLowerPitch = notePitch;
          bEventsOr(aEvents, event, singleNote); // B
          sEvents.push({
            ...event,
            id: `t-${event.id}`,
            staff: 1,
            voice: 1,
            isChord: false,
            notes: [singleNote] // T doubles
          });
        } else {
          currentUpperPitch = notePitch;
          sEvents.push({
            ...event,
            id: `t-${event.id}`,
            staff: 1,
            voice: 1,
            isChord: false,
            notes: [singleNote]
          });
          bEventsOr(aEvents, event, singleNote);
        }
      }
    }
  });

  return {
    sEvents,
    aEvents,
    newSPitch: currentUpperPitch,
    newAPitch: currentLowerPitch
  };
}

function bEventsOr(list: ParsedEvent[], event: ParsedEvent, note: ParsedNote) {
  list.push({
    ...event,
    id: `b-${event.id}`,
    staff: 1,
    voice: 1,
    isChord: false,
    notes: [{ ...note, staff: 1, voice: 1 }]
  });
}

/**
 * Extracts a clean 2-staff Keyboard logical score (Piano RH and Piano LH).
 * Keeps simultaneous notes grouped as chords within each staff, preventing
 * raw MusicXML voice IDs (V1..V8) from polluting the document.
 */
export function extractKeyboardLogicalScore(score: ParsedScore): ParsedScore {
  const parts = score.parts || [];
  if (parts.length === 0) return score;

  const primaryPart = parts[0];
  const maxMeasures = score.measuresCount || primaryPart.measures.length || 1;

  const rhMeasures: ParsedMeasure[] = [];
  const lhMeasures: ParsedMeasure[] = [];

  for (let mIdx = 1; mIdx <= maxMeasures; mIdx++) {
    const mObj = primaryPart.measures.find(m => m.number === mIdx) || {
      number: mIdx,
      keySignature: score.keySignature,
      timeSignature: score.timeSignature,
      events: []
    };

    const rhEvents = mObj.events.filter(e => (e.staff || 1) === 1).map(e => ({
      ...e,
      staff: 1,
      voice: 1,
      notes: e.notes.map(n => ({ ...n, staff: 1, voice: 1 }))
    }));
    const lhEvents = mObj.events.filter(e => (e.staff || 1) === 2).map(e => ({
      ...e,
      staff: 1,
      voice: 1,
      notes: e.notes.map(n => ({ ...n, staff: 1, voice: 1 }))
    }));

    rhMeasures.push({
      number: mIdx,
      keySignature: mObj.keySignature || score.keySignature,
      timeSignature: mObj.timeSignature || score.timeSignature,
      events: rhEvents,
      rehearsalMark: mObj.rehearsalMark,
      directionWords: mObj.directionWords,
      tempoBpm: mObj.tempoBpm,
      isKeyChange: mObj.isKeyChange,
      isTimeChange: mObj.isTimeChange
    });

    lhMeasures.push({
      number: mIdx,
      keySignature: mObj.keySignature || score.keySignature,
      timeSignature: mObj.timeSignature || score.timeSignature,
      events: lhEvents
    });
  }

  const baseName = primaryPart.name.toLowerCase().includes('organ') ? 'Organ' : 'Piano';

  const keyboardParts: ParsedPart[] = [
    {
      id: `${primaryPart.id}-rh`,
      name: `${baseName} RH`,
      shortName: 'RH',
      clef: 'treble',
      color: '#8B5CF6',
      measures: rhMeasures
    },
    {
      id: `${primaryPart.id}-lh`,
      name: `${baseName} LH`,
      shortName: 'LH',
      clef: 'bass',
      color: '#67E8F9',
      measures: lhMeasures
    }
  ];

  return {
    ...score,
    title: normalizeScoreTitle(score.title),
    parts: keyboardParts
  };
}
