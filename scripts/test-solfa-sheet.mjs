import { parseMusicXml } from '../src/services/musicXmlParser.ts';
import {
  formatSolfaLetter,
  getVoiceShortLabel,
  getHumanReadableStaffLabel,
  layoutMeasureBeats,
  layoutTonicSolfaDocument,
  inspectScoreStructure
} from '../src/services/solfaSheetLayout.ts';

// Setup DOMParser for Node environment
if (typeof DOMParser === 'undefined') {
  const { DOMParser: NodeDOMParser } = await import('@xmldom/xmldom');
  globalThis.DOMParser = NodeDOMParser;
}

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passedTests++;
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('--- RUNNING TONIC SOL-FA TYPESETTING ENGINE V3 TESTS ---\n');

const gMajor = {
  fifths: 1,
  mode: 'major',
  name: 'G Major',
  tonicStep: 'G',
  tonicAlter: 0
};

// ========================================================
// 1. OCTAVE MARKS
// ========================================================
console.log('--- 1. Octave Marks ---');
// G4 in G Major -> d (no octave mark)
const noteG4 = { pitch: 'G4', step: 'G', alter: 0, octave: 4, type: 'quarter', dots: 0, isRest: false, isChord: false, voice: 1, staff: 1 };
assert(formatSolfaLetter(noteG4, gMajor) === 'd', 'G4 in G Major is d (middle octave)');

// G5 in G Major -> d' (high octave)
const noteG5 = { pitch: 'G5', step: 'G', alter: 0, octave: 5, type: 'quarter', dots: 0, isRest: false, isChord: false, voice: 1, staff: 1 };
assert(formatSolfaLetter(noteG5, gMajor) === "d'", "G5 in G Major is d'");

// G6 in G Major -> d''
const noteG6 = { pitch: 'G6', step: 'G', alter: 0, octave: 6, type: 'quarter', dots: 0, isRest: false, isChord: false, voice: 1, staff: 1 };
assert(formatSolfaLetter(noteG6, gMajor) === "d''", "G6 in G Major is d''");

// G3 in G Major -> d, (low octave)
const noteG3 = { pitch: 'G3', step: 'G', alter: 0, octave: 3, type: 'quarter', dots: 0, isRest: false, isChord: false, voice: 1, staff: 1 };
assert(formatSolfaLetter(noteG3, gMajor) === 'd,', 'G3 in G Major is d,');

// ========================================================
// 2. HUMAN-READABLE STAFF & VOICE LABELS
// ========================================================
console.log('\n--- 2. Human-Readable Staff & Voice Labels ---');
assert(getHumanReadableStaffLabel('Soprano', 1, 1, 1, 1) === 'S', 'Soprano -> S');
assert(getHumanReadableStaffLabel('Alto', 1, 1, 1, 1) === 'A', 'Alto -> A');
assert(getHumanReadableStaffLabel('Tenor', 1, 1, 1, 1) === 'T', 'Tenor -> T');
assert(getHumanReadableStaffLabel('Bass', 1, 1, 1, 1) === 'B', 'Bass -> B');
assert(getHumanReadableStaffLabel('Trumpet', 1, 1, 1, 1) === 'Trumpet', 'Trumpet single voice -> Trumpet');
assert(getHumanReadableStaffLabel('Trumpet', 1, 1, 1, 2) === 'Trumpet V1', 'Trumpet multi-voice -> Trumpet V1');
assert(getHumanReadableStaffLabel('Organ', 1, 2, 1, 1) === 'Organ RH', 'Organ staff 1 -> Organ RH');
assert(getHumanReadableStaffLabel('Organ', 2, 2, 1, 1) === 'Organ LH', 'Organ staff 2 -> Organ LH');
assert(getHumanReadableStaffLabel('Organ', 1, 2, 2, 2) === 'Organ RH V2', 'Organ staff 1 voice 2 -> Organ RH V2');

// Legacy helpers
assert(getVoiceShortLabel('Soprano', 0) === 'S', 'Legacy Soprano -> S');
assert(getVoiceShortLabel('Piano', 1) === 'Pno', 'Legacy Piano -> Pno');

// ========================================================
// 3. BEAT & RHYTHMIC LAYOUT
// ========================================================
console.log('\n--- 3. Beat & Rhythmic Layout ---');
const measureHalfQuarterQuarter = {
  number: 1,
  timeSignature: '4/4',
  keySignature: gMajor,
  events: [
    {
      id: 'e1',
      isRest: false,
      isChord: false,
      notes: [noteG4],
      rhythmSymbol: '𝅗𝅥',
      durationName: 'half',
      durationBeats: 2,
      voice: 1,
      staff: 1
    },
    {
      id: 'e2',
      isRest: false,
      isChord: false,
      notes: [{ pitch: 'B4', step: 'B', alter: 0, octave: 4, type: 'quarter', dots: 0, isRest: false, isChord: false, voice: 1, staff: 1 }],
      rhythmSymbol: '♩',
      durationName: 'quarter',
      durationBeats: 1,
      voice: 1,
      staff: 1
    },
    {
      id: 'e3',
      isRest: false,
      isChord: false,
      notes: [{ pitch: 'D5', step: 'D', alter: 0, octave: 5, type: 'quarter', dots: 0, isRest: false, isChord: false, voice: 1, staff: 1 }],
      rhythmSymbol: '♩',
      durationName: 'quarter',
      durationBeats: 1,
      voice: 1,
      staff: 1
    }
  ]
};

const beats = layoutMeasureBeats(measureHalfQuarterQuarter, gMajor);
assert(beats.length === 4, '4 beats in 4/4 measure');
assert(beats[0].text === 'd', 'Beat 1 has note d');
assert(beats[1].text === '-', 'Beat 2 has sustain dash - for half note');
assert(beats[1].isSustained === true, 'Beat 2 marked as sustained');
assert(beats[2].text === 'm', 'Beat 3 has note m (B4 in G Major)');
assert(beats[3].text === "s'", "Beat 4 has note s' (D5 in G Major)");

// Measure with eighth note division (.r)
const measureEighths = {
  number: 2,
  timeSignature: '4/4',
  keySignature: gMajor,
  events: [
    {
      id: 'e1',
      isRest: false,
      isChord: false,
      notes: [noteG4],
      rhythmSymbol: '♪',
      durationName: 'eighth',
      durationBeats: 0.5,
      voice: 1,
      staff: 1
    },
    {
      id: 'e2',
      isRest: false,
      isChord: false,
      notes: [{ pitch: 'A4', step: 'A', alter: 0, octave: 4, type: 'quarter', dots: 0, isRest: false, isChord: false, voice: 1, staff: 1 }],
      rhythmSymbol: '♪',
      durationName: 'eighth',
      durationBeats: 0.5,
      voice: 1,
      staff: 1
    }
  ]
};

const eighthBeats = layoutMeasureBeats(measureEighths, gMajor);
assert(eighthBeats[0].text === 'd .r', 'Beat 1 has eighth subdivision d .r');

// ========================================================
// 4. TEST SUITE A: SIMPLE MONOPHONIC SCORE
// ========================================================
console.log('\n--- 4. Test Suite A: Simple Monophonic Score ---');
const monoXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Flute Solo</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Flute</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>0</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>16</duration><type>whole</type></note>
    </measure>
  </part>
</score-partwise>`;

const parsedMono = parseMusicXml(monoXml, 'Flute Solo');
const pagesMono = layoutTonicSolfaDocument(parsedMono);
assert(pagesMono.length === 1, 'Monophonic produces 1 page');
assert(pagesMono[0].systems[0].voiceRows.length === 1, '1 active voice row in system');
assert(pagesMono[0].systems[0].voiceRows[0].displayLabel === 'Flute', 'Row is clearly labeled Flute');

// ========================================================
// 5. TEST SUITE B: PIANO / GRAND STAFF (RH & LH)
// ========================================================
console.log('\n--- 5. Test Suite B: Piano Grand Staff ---');
const pianoXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Piano Sonata</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>0</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <!-- RH note -->
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>16</duration><staff>1</staff><type>whole</type></note>
      <!-- LH note -->
      <note><pitch><step>C</step><octave>3</octave></pitch><duration>16</duration><staff>2</staff><type>whole</type></note>
    </measure>
  </part>
</score-partwise>`;

const parsedPiano = parseMusicXml(pianoXml, 'Piano Sonata');
const pagesPiano = layoutTonicSolfaDocument(parsedPiano);
assert(pagesPiano[0].systems[0].voiceRows.length === 2, 'Piano has 2 active staves (RH and LH)');
assert(pagesPiano[0].systems[0].voiceRows[0].displayLabel === 'Piano RH', 'Staff 1 labeled Piano RH');
assert(pagesPiano[0].systems[0].voiceRows[1].displayLabel === 'Piano LH', 'Staff 2 labeled Piano LH');

// ========================================================
// 6. TEST SUITE C: SATB CHORAL SCORE WITH LYRICS
// ========================================================
console.log('\n--- 6. Test Suite C: SATB Choral Score ---');
const satbXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Hymn of Praise</work-title></work>
  <identification><creator type="composer">J. S. Bach</creator></identification>
  <part-list>
    <score-part id="P1"><part-name>Soprano</part-name></score-part>
    <score-part id="P2"><part-name>Alto</part-name></score-part>
    <score-part id="P3"><part-name>Tenor</part-name></score-part>
    <score-part id="P4"><part-name>Bass</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type><lyric><text>Glo</text></lyric></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type><lyric><text>ri</text></lyric></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type><lyric><text>a</text></lyric></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1"><note><pitch><step>G</step><octave>4</octave></pitch><duration>16</duration><type>whole</type></note></measure>
  </part>
  <part id="P3">
    <measure number="1"><note><pitch><step>E</step><octave>4</octave></pitch><duration>16</duration><type>whole</type></note></measure>
  </part>
  <part id="P4">
    <measure number="1"><note><pitch><step>C</step><octave>3</octave></pitch><duration>16</duration><type>whole</type></note></measure>
  </part>
</score-partwise>`;

const parsedSatb = parseMusicXml(satbXml, 'Hymn');
const pagesSatb = layoutTonicSolfaDocument(parsedSatb);
assert(pagesSatb[0].systems[0].voiceRows.length === 4, 'All 4 SATB parts rendered');
assert(pagesSatb[0].systems[0].voiceRows[0].displayLabel === 'S', 'Soprano labeled S');
assert(pagesSatb[0].systems[0].voiceRows[1].displayLabel === 'A', 'Alto labeled A');
assert(pagesSatb[0].systems[0].voiceRows[2].displayLabel === 'T', 'Tenor labeled T');
assert(pagesSatb[0].systems[0].voiceRows[3].displayLabel === 'B', 'Bass labeled B');
assert(pagesSatb[0].systems[0].voiceRows[0].hasLyrics === true, 'Soprano voice has lyrics enabled');
assert(pagesSatb[0].systems[0].voiceRows[0].lyricsRow[0].lyricTexts[0] === 'Glo', 'First lyric syllable is Glo');

// ========================================================
// 7. TEST SUITE D: MULTI-INSTRUMENT (TRUMPET + SOLO + ORGAN)
// ========================================================
console.log('\n--- 7. Test Suite D: Multi-Instrument (Trumpet, Solo, Organ) ---');
const multiXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Festival Introit</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Trumpet</part-name></score-part>
    <score-part id="P2"><part-name>Solo</part-name></score-part>
    <score-part id="P3"><part-name>Organ</part-name></score-part>
  </part-list>
  <!-- Trumpet: active in measure 1 -->
  <part id="P1">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>1</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>16</duration><type>whole</type></note>
    </measure>
  </part>
  <!-- Solo: vocal with lyric in measure 1 -->
  <part id="P2">
    <measure number="1">
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>16</duration><type>whole</type><lyric><text>Amen</text></lyric></note>
    </measure>
  </part>
  <!-- Organ: Grand staff with RH (staff 1) and LH (staff 2) -->
  <part id="P3">
    <measure number="1">
      <attributes><staves>2</staves></attributes>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>16</duration><staff>1</staff><type>whole</type></note>
      <note><pitch><step>G</step><octave>2</octave></pitch><duration>16</duration><staff>2</staff><type>whole</type></note>
    </measure>
  </part>
</score-partwise>`;

const parsedMulti = parseMusicXml(multiXml, 'Introit');
const pagesMulti = layoutTonicSolfaDocument(parsedMulti);
const multiRows = pagesMulti[0].systems[0].voiceRows;
assert(multiRows.length === 4, '4 rows: Trumpet, Solo, Organ RH, Organ LH');
assert(multiRows[0].displayLabel === 'Trumpet', 'Trumpet labeled correctly');
assert(multiRows[1].displayLabel === 'Solo', 'Solo labeled correctly');
assert(multiRows[2].displayLabel === 'Organ RH', 'Organ staff 1 labeled Organ RH');
assert(multiRows[3].displayLabel === 'Organ LH', 'Organ staff 2 labeled Organ LH');

// ========================================================
// 8. REQUIREMENT 7: EMPTY VOICE SUPPRESSION
// ========================================================
console.log('\n--- 8. Requirement 7: Empty Voice Suppression ---');
const silentTrumpetXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Chamber Piece</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Trumpet</part-name></score-part>
    <score-part id="P2"><part-name>Flute</part-name></score-part>
  </part-list>
  <!-- Trumpet only rests -->
  <part id="P1">
    <measure number="1"><note><rest/><duration>16</duration></note></measure>
  </part>
  <!-- Flute plays melody -->
  <part id="P2">
    <measure number="1"><note><pitch><step>C</step><octave>5</octave></pitch><duration>16</duration><type>whole</type></note></measure>
  </part>
</score-partwise>`;

const parsedSilent = parseMusicXml(silentTrumpetXml, 'Chamber');
const pagesSilent = layoutTonicSolfaDocument(parsedSilent);
assert(pagesSilent[0].systems[0].voiceRows.length === 1, 'Silent Trumpet suppressed; only active Flute row rendered');
assert(pagesSilent[0].systems[0].voiceRows[0].displayLabel === 'Flute', 'Active Flute is preserved');

// ========================================================
// 9. REQUIREMENT 22: SIMULTANEOUS CHORDS
// ========================================================
console.log('\n--- 9. Requirement 22: Simultaneous Chords ---');
const chordXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Chord Test</work-title></work>
  <part-list><score-part id="P1"><part-name>Hymn</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <!-- C-major triad chord on beat 1: C4 + E4 + G4 -->
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><chord/><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

const parsedChord = parseMusicXml(chordXml, 'Chord');
const pagesChord = layoutTonicSolfaDocument(parsedChord);
const beat1 = pagesChord[0].systems[0].voiceRows[0].measures[0].beats[0];
assert(beat1.isChord === true, 'Beat 1 detected as chord');
assert(Array.isArray(beat1.chordSyllables), 'chordSyllables is array');
assert(beat1.chordSyllables.length === 3, '3 notes in chord');
assert(beat1.chordSyllables[0] === 's', 'Highest note is s (G4)');
assert(beat1.chordSyllables[1] === 'm', 'Middle note is m (E4)');
assert(beat1.chordSyllables[2] === 'd', 'Lowest note is d (C4)');
assert(!beat1.text.includes('['), 'No raw bracket array syntax in text representation');

// ========================================================
// 10. SCORE STRUCTURE INSPECTION & CUSTOMIZATION
// ========================================================
console.log('\n--- 10. Score Structure Inspection & Customization ---');
const structure = inspectScoreStructure(parsedMulti);
assert(structure.length === 3, 'Detected 3 parts in score structure');
assert(structure[0].name === 'Trumpet', 'Part 1 is Trumpet');
assert(structure[2].name === 'Organ', 'Part 3 is Organ');
assert(structure[2].staves.length === 2, 'Organ has 2 detected staves');

// Test user override on part label and title
const customizedPages = layoutTonicSolfaDocument(parsedMulti, {
  titleOverride: 'My Custom Score',
  partLabelOverrides: {
    P1: 'Lead Trumpet'
  }
});
assert(customizedPages[0].header.title === 'My Custom Score', 'Title override reflected in typeset page');
assert(customizedPages[0].systems[0].voiceRows[0].displayLabel === 'Lead Trumpet', 'Part label override reflected in row');

console.log(`\n🎉 ALL ${passedTests}/${totalTests} TONIC SOL-FA TYPESETTING ENGINE TESTS PASSED!\n`);
