/**
 * MUSIQ MusicXML DOM Parser
 * Robust XML parser extracting normalized musical structures:
 * ParsedScore, ParsedPart, ParsedMeasure, ParsedEvent, ParsedNote
 *
 * Handles:
 * - Dynamic parts and disambiguation (Voice 1, Voice 2)
 * - Measure keys, mid-piece key changes, modes (major/minor), time signatures
 * - True simultaneous chord grouping (<chord/> tag)
 * - Rests (<rest/>)
 * - Lyrics (<lyric><text>...</text></lyric>)
 * - Rhythmic glyphs and duration types
 */

export interface KeySignatureInfo {
  fifths: number;
  mode: 'major' | 'minor';
  name: string; // e.g. "F Major", "D Minor"
  tonicStep: string; // e.g. "F", "D"
  tonicAlter: number; // e.g. 0, -1, 1
}

export interface ParsedNote {
  pitch: string; // e.g. "C4", "F#5", "Bb3" or "Rest"
  step: string; // "C", "D", "E", "F", "G", "A", "B"
  alter: number; // -2, -1, 0, 1, 2
  octave: number;
  type: string; // "whole", "half", "quarter", "eighth", "16th", "32nd"
  dots: number;
  isRest: boolean;
  isChord: boolean;
  duration?: number;
  tie?: 'start' | 'stop';
  lyric?: string;
  voice: number;
  staff: number;
}

export interface ParsedEvent {
  id: string;
  isRest: boolean;
  isChord: boolean;
  notes: ParsedNote[];
  rhythmSymbol: string; // "𝅝", "𝅗𝅥", "♩", "♪", "𝅘𝅥𝅯"
  durationName: string; // "quarter", "eighth", etc.
  durationBeats: number;
  voice: number;
  staff: number;
  lyric?: string;
}

export interface ParsedMeasure {
  number: number;
  keySignature: KeySignatureInfo;
  timeSignature: string;
  events: ParsedEvent[];
}

export interface ParsedPart {
  id: string;
  name: string;
  shortName: string;
  clef: 'treble' | 'bass' | 'alto' | 'tenor';
  color: string;
  measures: ParsedMeasure[];
}

export interface ParsedScore {
  title: string;
  composer?: string;
  keySignature: KeySignatureInfo;
  timeSignature: string;
  tempoBpm?: number;
  parts: ParsedPart[];
  measuresCount: number;
  rawXml: string;
}

// Circle of fifths map for major and minor keys
const MAJOR_KEY_MAP: Record<number, { name: string; tonic: string; alter: number }> = {
  '-7': { name: 'Cb Major', tonic: 'C', alter: -1 },
  '-6': { name: 'Gb Major', tonic: 'G', alter: -1 },
  '-5': { name: 'Db Major', tonic: 'D', alter: -1 },
  '-4': { name: 'Ab Major', tonic: 'A', alter: -1 },
  '-3': { name: 'Eb Major', tonic: 'E', alter: -1 },
  '-2': { name: 'Bb Major', tonic: 'B', alter: -1 },
  '-1': { name: 'F Major', tonic: 'F', alter: 0 },
  '0':  { name: 'C Major', tonic: 'C', alter: 0 },
  '1':  { name: 'G Major', tonic: 'G', alter: 0 },
  '2':  { name: 'D Major', tonic: 'D', alter: 0 },
  '3':  { name: 'A Major', tonic: 'A', alter: 0 },
  '4':  { name: 'E Major', tonic: 'E', alter: 0 },
  '5':  { name: 'B Major', tonic: 'B', alter: 0 },
  '6':  { name: 'F# Major', tonic: 'F', alter: 1 },
  '7':  { name: 'C# Major', tonic: 'C', alter: 1 }
};

const MINOR_KEY_MAP: Record<number, { name: string; tonic: string; alter: number }> = {
  '-7': { name: 'Ab Minor', tonic: 'A', alter: -1 },
  '-6': { name: 'Eb Minor', tonic: 'E', alter: -1 },
  '-5': { name: 'Bb Minor', tonic: 'B', alter: -1 },
  '-4': { name: 'F Minor',  tonic: 'F', alter: 0 },
  '-3': { name: 'C Minor',  tonic: 'C', alter: 0 },
  '-2': { name: 'G Minor',  tonic: 'G', alter: 0 },
  '-1': { name: 'D Minor',  tonic: 'D', alter: 0 },
  '0':  { name: 'A Minor',  tonic: 'A', alter: 0 },
  '1':  { name: 'E Minor',  tonic: 'E', alter: 0 },
  '2':  { name: 'B Minor',  tonic: 'B', alter: 0 },
  '3':  { name: 'F# Minor', tonic: 'F', alter: 1 },
  '4':  { name: 'C# Minor', tonic: 'C', alter: 1 },
  '5':  { name: 'G# Minor', tonic: 'G', alter: 1 },
  '6':  { name: 'D# Minor', tonic: 'D', alter: 1 },
  '7':  { name: 'A# Minor', tonic: 'A', alter: 1 }
};

export function getKeySignatureInfo(fifths: number, modeStr?: string | null): KeySignatureInfo {
  const mode = (modeStr?.toLowerCase() === 'minor') ? 'minor' : 'major';
  const map = mode === 'minor' ? MINOR_KEY_MAP : MAJOR_KEY_MAP;
  const entry = map[fifths] || { name: `${fifths} fifths ${mode}`, tonic: 'C', alter: 0 };
  return {
    fifths,
    mode,
    name: entry.name,
    tonicStep: entry.tonic,
    tonicAlter: entry.alter
  };
}

export function getRhythmSymbol(type: string, isRest = false): string {
  if (isRest) {
    switch (type) {
      case 'whole': return '𝄻';
      case 'half': return '𝄼';
      case 'quarter': return '𝄽';
      case 'eighth': return '𝄾';
      case '16th': return '𝄿';
      default: return '𝄽';
    }
  }
  switch (type) {
    case 'whole': return '𝅝';
    case 'half': return '𝅗𝅥';
    case 'quarter': return '♩';
    case 'eighth': return '♪';
    case '16th': return '𝅘𝅥𝅯';
    case '32nd': return '𝅘𝅥𝅰';
    default: return '♩';
  }
}

export function getDurationBeats(type: string, dots = 0): number {
  let base = 1;
  switch (type) {
    case 'whole': base = 4; break;
    case 'half': base = 2; break;
    case 'quarter': base = 1; break;
    case 'eighth': base = 0.5; break;
    case '16th': base = 0.25; break;
    case '32nd': base = 0.125; break;
    default: base = 1;
  }
  if (dots === 1) return base * 1.5;
  if (dots === 2) return base * 1.75;
  return base;
}

const PART_PALETTE = ['#8B5CF6', '#67E8F9', '#4ADE80', '#FBBF24', '#F472B6', '#60A5FA', '#34D399', '#A78BFA'];

function getDescendant(parent: any, tagName: string): any | null {
  if (!parent || !parent.getElementsByTagName) return null;
  const list = parent.getElementsByTagName(tagName);
  return list && list.length > 0 ? list[0] : null;
}

function getDescendants(parent: any, tagName: string): any[] {
  if (!parent || !parent.getElementsByTagName) return [];
  return Array.from(parent.getElementsByTagName(tagName));
}

function getTextContent(elem: any): string | undefined {
  if (!elem) return undefined;
  return elem.textContent?.trim() || elem.nodeValue?.trim() || undefined;
}

/**
 * Parses raw MusicXML string into structured ParsedScore
 */
export function parseMusicXml(xmlString: string, fallbackTitle = 'Score'): ParsedScore {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const parserError = getDescendant(doc, 'parsererror');
  if (parserError) {
    throw new Error(`XML Parsing error: ${getTextContent(parserError)}`);
  }

  // Extract Metadata
  const workTitle = getTextContent(getDescendant(doc, 'work-title'));
  const movementTitle = getTextContent(getDescendant(doc, 'movement-title'));
  
  let composer: string | undefined;
  const creatorElems = getDescendants(doc, 'creator');
  for (const c of creatorElems) {
    if (c.getAttribute && c.getAttribute('type') === 'composer') {
      composer = getTextContent(c);
      break;
    }
  }
  if (!composer && creatorElems.length > 0) {
    composer = getTextContent(creatorElems[0]);
  }

  const title = workTitle || movementTitle || fallbackTitle;

  // Extract parts list
  const partListEntries = getDescendants(doc, 'score-part');
  const rawPartNameMap = new Map<string, string>();
  const rawPartAbbrMap = new Map<string, string>();
  const nameCounts = new Map<string, number>();

  partListEntries.forEach(pe => {
    const id = pe.getAttribute('id') || '';
    const rawName = getTextContent(getDescendant(pe, 'part-name')) || 'Part';
    const rawAbbr = getTextContent(getDescendant(pe, 'part-abbreviation')) || '';
    rawPartNameMap.set(id, rawName);
    rawPartAbbrMap.set(id, rawAbbr);
    nameCounts.set(rawName, (nameCounts.get(rawName) || 0) + 1);
  });

  // Disambiguate duplicate names (e.g. "Voice" -> "Voice 1", "Voice 2")
  const partNameMap = new Map<string, string>();
  const nameTrackers = new Map<string, number>();

  partListEntries.forEach(pe => {
    const id = pe.getAttribute('id') || '';
    const rawName = rawPartNameMap.get(id) || 'Part';
    if ((nameCounts.get(rawName) || 0) > 1) {
      const idx = (nameTrackers.get(rawName) || 0) + 1;
      nameTrackers.set(rawName, idx);
      partNameMap.set(id, `${rawName} ${idx}`);
    } else {
      partNameMap.set(id, rawName);
    }
  });

  const partElements = getDescendants(doc, 'part');
  let scoreKeySignature = getKeySignatureInfo(0, 'major');
  let scoreTimeSignature = '4/4';
  let tempoBpm: number | undefined;
  let maxMeasures = 0;

  const parsedParts: ParsedPart[] = partElements.map((partElem, pIdx) => {
    const partId = partElem.getAttribute('id') || `P${pIdx + 1}`;
    const name = partNameMap.get(partId) || `Part ${pIdx + 1}`;
    const abbr = rawPartAbbrMap.get(partId) || name.slice(0, 4);

    const clefSign = getTextContent(getDescendant(partElem, 'sign'))?.toLowerCase();
    const clef: 'treble' | 'bass' | 'alto' | 'tenor' = 
      clefSign === 'f' ? 'bass' : clefSign === 'c' ? 'alto' : 'treble';

    const measureElems = getDescendants(partElem, 'measure');
    if (measureElems.length > maxMeasures) maxMeasures = measureElems.length;

    let currentKey = scoreKeySignature;
    let currentTimeSig = scoreTimeSignature;

    const measures: ParsedMeasure[] = measureElems.map((mElem, mIdx) => {
      const mNum = parseInt(mElem.getAttribute('number') || `${mIdx + 1}`, 10);

      // Check Key changes
      const fifthsElem = getDescendant(mElem, 'fifths');
      if (fifthsElem) {
        const fifths = parseInt(getTextContent(fifthsElem) || '0', 10);
        const modeStr = getTextContent(getDescendant(mElem, 'mode'));
        currentKey = getKeySignatureInfo(fifths, modeStr);
        if (pIdx === 0 && mIdx === 0) {
          scoreKeySignature = currentKey;
        }
      }

      // Check Time signature changes
      const beats = getTextContent(getDescendant(mElem, 'beats'));
      const beatType = getTextContent(getDescendant(mElem, 'beat-type'));
      if (beats && beatType) {
        currentTimeSig = `${beats}/${beatType}`;
        if (pIdx === 0 && mIdx === 0) {
          scoreTimeSignature = currentTimeSig;
        }
      }

      // Check Tempo
      const soundElems = getDescendants(mElem, 'sound');
      for (const s of soundElems) {
        const tVal = s.getAttribute('tempo');
        if (tVal && !tempoBpm) {
          const t = parseFloat(tVal);
          if (!isNaN(t) && t > 20) tempoBpm = Math.round(t);
        }
      }

      // Parse Note Events and group Chords
      const noteElems = getDescendants(mElem, 'note');
      const events: ParsedEvent[] = [];

      noteElems.forEach((nElem, nIdx) => {
        const isChord = getDescendant(nElem, 'chord') !== null;
        const isRest = getDescendant(nElem, 'rest') !== null;
        const step = getTextContent(getDescendant(nElem, 'step'))?.toUpperCase() || 'C';
        const alterVal = parseInt(getTextContent(getDescendant(nElem, 'alter')) || '0', 10);
        const octave = parseInt(getTextContent(getDescendant(nElem, 'octave')) || '4', 10);
        const type = getTextContent(getDescendant(nElem, 'type'))?.toLowerCase() || 'quarter';
        const dots = getDescendants(nElem, 'dot').length;
        const voice = parseInt(getTextContent(getDescendant(nElem, 'voice')) || '1', 10);
        const staff = parseInt(getTextContent(getDescendant(nElem, 'staff')) || '1', 10);
        const lyric = getTextContent(getDescendant(nElem, 'text'));
        const tieElem = getDescendant(nElem, 'tie');
        const tie = tieElem?.getAttribute('type') as 'start' | 'stop' | undefined;

        let alterStr = '';
        if (alterVal === 1) alterStr = '#';
        else if (alterVal === 2) alterStr = '##';
        else if (alterVal === -1) alterStr = 'b';
        else if (alterVal === -2) alterStr = 'bb';

        const pitchLabel = isRest ? 'Rest' : `${step}${alterStr}${octave}`;

        const parsedNote: ParsedNote = {
          pitch: pitchLabel,
          step,
          alter: alterVal,
          octave,
          type,
          dots,
          isRest,
          isChord,
          tie,
          lyric,
          voice,
          staff
        };

        if (isChord && events.length > 0) {
          // Add note to current chord event
          const lastEvent = events[events.length - 1];
          lastEvent.isChord = true;
          lastEvent.notes.push(parsedNote);
          if (lyric && !lastEvent.lyric) {
            lastEvent.lyric = lyric;
          }
        } else {
          // New musical event
          const event: ParsedEvent = {
            id: `m${mNum}-e${nIdx + 1}`,
            isRest,
            isChord: false,
            notes: [parsedNote],
            rhythmSymbol: getRhythmSymbol(type, isRest),
            durationName: type,
            durationBeats: getDurationBeats(type, dots),
            voice,
            staff,
            lyric
          };
          events.push(event);
        }
      });

      return {
        number: mNum,
        keySignature: currentKey,
        timeSignature: currentTimeSig,
        events
      };
    });

    return {
      id: partId,
      name,
      shortName: abbr,
      clef,
      color: PART_PALETTE[pIdx % PART_PALETTE.length],
      measures
    };
  });

  return {
    title,
    composer,
    keySignature: scoreKeySignature,
    timeSignature: scoreTimeSignature,
    tempoBpm,
    parts: parsedParts,
    measuresCount: maxMeasures,
    rawXml: xmlString
  };
}
