/**
 * MUSIQ Tonic Sol-Fa (Movable-Do) & Note Name Engine
 * Programmatic derivation of Note Names and Movable-Do Sol-Fa from parsed MusicXML.
 *
 * Movable-Do Conventions:
 * Major Key:
 *   1 = do, 2 = re, 3 = mi, 4 = fa, 5 = sol, 6 = la, 7 = ti
 * Chromatic Ascending Alterations:
 *   #1 = di, #2 = ri, #4 = fi, #5 = si, #6 = li
 * Chromatic Descending Alterations:
 *   b2 = ra, b3 = me, b5 = se, b6 = le, b7 = te
 * Minor Key (Tonic-based do-minor convention):
 *   1 = do, 2 = re, b3 = me (natural/raised 3 = mi), 4 = fa, (#4 = fi),
 *   5 = sol, b6 = le (raised 6 = la), b7 = te (raised/harmonic 7 = ti)
 *
 * Chords:
 *   Grouped simultaneous pitches: [C4 E4 G4] -> [do mi sol]
 * Rests:
 *   Preserved clearly as "Rest"
 */

import type { KeySignatureInfo, ParsedEvent, ParsedNote } from './musicXmlParser.ts';

const STEP_NATURAL_PITCH_CLASS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};

const STEP_INDEX: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6
};

/**
 * Returns the tonic pitch class and step index for a given key signature
 */
export function getKeyTonicInfo(key: KeySignatureInfo): { pitchClass: number; stepIndex: number } {
  const step = key.tonicStep.toUpperCase();
  const basePc = STEP_NATURAL_PITCH_CLASS[step] ?? 0;
  const pitchClass = (basePc + key.tonicAlter + 120) % 12;
  const stepIndex = STEP_INDEX[step] ?? 0;
  return { pitchClass, stepIndex };
}

/**
 * Derives the Movable-Do Sol-Fa syllable for a single note in a given key
 */
export function noteToSolfa(note: ParsedNote, key: KeySignatureInfo): string {
  if (note.isRest) return 'Rest';

  const step = note.step.toUpperCase();
  const basePc = STEP_NATURAL_PITCH_CLASS[step] ?? 0;
  const notePc = (basePc + note.alter + 120) % 12;
  const noteStepIdx = STEP_INDEX[step] ?? 0;

  const { pitchClass: tonicPc, stepIndex: tonicStepIdx } = getKeyTonicInfo(key);

  const diatonicInterval = (noteStepIdx - tonicStepIdx + 7) % 7;
  const chromaticInterval = (notePc - tonicPc + 12) % 12;

  // Major mode mapping
  if (key.mode !== 'minor') {
    switch (chromaticInterval) {
      case 0:
        return 'do';
      case 1:
        // #1 (diatonic 0) or b2 (diatonic 1)
        return diatonicInterval === 0 ? 'di' : 'ra';
      case 2:
        return 're';
      case 3:
        // #2 (diatonic 1) or b3 (diatonic 2)
        return diatonicInterval === 1 ? 'ri' : 'me';
      case 4:
        return 'mi';
      case 5:
        return 'fa';
      case 6:
        // #4 (diatonic 3) or b5 (diatonic 4)
        return diatonicInterval === 3 ? 'fi' : 'se';
      case 7:
        return 'sol';
      case 8:
        // #5 (diatonic 4) or b6 (diatonic 5)
        return diatonicInterval === 4 ? 'si' : 'le';
      case 9:
        return 'la';
      case 10:
        // #6 (diatonic 5) or b7 (diatonic 6)
        return diatonicInterval === 5 ? 'li' : 'te';
      case 11:
        return 'ti';
      default:
        return 'do';
    }
  }

  // Minor mode (Tonic-based do-minor convention)
  switch (chromaticInterval) {
    case 0:
      return 'do';
    case 1:
      return diatonicInterval === 0 ? 'di' : 'ra';
    case 2:
      return 're';
    case 3:
      // In minor, minor 3rd is the normal scale degree -> 'me'
      return 'me';
    case 4:
      // Raised 3rd in minor -> 'mi'
      return 'mi';
    case 5:
      return 'fa';
    case 6:
      return diatonicInterval === 3 ? 'fi' : 'se';
    case 7:
      return 'sol';
    case 8:
      // In minor, minor 6th is the normal scale degree -> 'le'
      return 'le';
    case 9:
      // Raised 6th (melodic minor) -> 'la'
      return 'la';
    case 10:
      // Minor 7th (natural minor) -> 'te'
      return 'te';
    case 11:
      // Raised 7th (harmonic minor leading tone) -> 'ti'
      return 'ti';
    default:
      return 'do';
  }
}

/**
 * Formats a musical event into human-readable Note Name representation:
 * e.g. "C4", "[C4 E4 G4]", or "Rest"
 */
export function formatEventNoteNames(event: ParsedEvent): string {
  if (event.isRest || event.notes.length === 0) {
    return 'Rest';
  }
  if (event.notes.length === 1) {
    return event.notes[0].pitch;
  }
  // Chord: [C4 E4 G4]
  return `[${event.notes.map(n => n.pitch).join(' ')}]`;
}

/**
 * Formats a musical event into Movable-Do Sol-Fa representation:
 * e.g. "do", "[do mi sol]", or "Rest"
 */
export function formatEventSolfa(event: ParsedEvent, key: KeySignatureInfo): string {
  if (event.isRest || event.notes.length === 0) {
    return 'Rest';
  }
  if (event.notes.length === 1) {
    return noteToSolfa(event.notes[0], key);
  }
  // Chord: [do mi sol]
  return `[${event.notes.map(n => noteToSolfa(n, key)).join(' ')}]`;
}

/**
 * Generate full structured plain-text transcription of Note Names
 */
export function generateNotesPlainText(
  title: string,
  keySignature: KeySignatureInfo,
  timeSignature: string,
  parts: Array<{ name: string; measures: Array<{ number: number; events: ParsedEvent[] }> }>
): string {
  const lines: string[] = [
    '==================================================',
    'MUSIQ NOTE-NAME TRANSCRIPTION',
    '==================================================',
    `Title: ${title}`,
    `Key: ${keySignature.name}`,
    `Time Signature: ${timeSignature}`,
    `Generated by: MUSIQ Optical Music Recognition`,
    '==================================================',
    ''
  ];

  parts.forEach(part => {
    lines.push(`PART: ${part.name.toUpperCase()}`);
    lines.push('--------------------------------------------------');

    part.measures.forEach(measure => {
      const formattedEvents = measure.events.map(e => formatEventNoteNames(e)).join('  ');
      lines.push(`Measure ${measure.number}:  ${formattedEvents || 'Rest'}`);
    });

    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Generate full structured plain-text transcription of Tonic Sol-Fa
 */
export function generateSolfaPlainText(
  title: string,
  keySignature: KeySignatureInfo,
  timeSignature: string,
  parts: Array<{ name: string; measures: Array<{ number: number; keySignature: KeySignatureInfo; events: ParsedEvent[] }> }>
): string {
  const lines: string[] = [
    '==================================================',
    'MUSIQ TONIC SOL-FA TRANSCRIPTION',
    '==================================================',
    `Title: ${title}`,
    `Key: ${keySignature.name} (Movable-Do)`,
    `Time Signature: ${timeSignature}`,
    `Convention: ${keySignature.mode === 'minor' ? 'Tonic-based Do-Minor' : 'Standard Movable-Do'}`,
    `Generated by: MUSIQ Optical Music Recognition`,
    '==================================================',
    ''
  ];

  parts.forEach(part => {
    lines.push(`PART: ${part.name.toUpperCase()}`);
    lines.push('--------------------------------------------------');

    part.measures.forEach(measure => {
      const measureKey = measure.keySignature || keySignature;
      const formattedEvents = measure.events.map(e => formatEventSolfa(e, measureKey)).join('  ');
      lines.push(`M${measure.number} | ${formattedEvents || 'Rest'}`);
    });

    lines.push('');
  });

  return lines.join('\n');
}
