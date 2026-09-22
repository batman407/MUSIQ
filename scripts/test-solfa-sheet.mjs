import { parseMusicXml } from '../src/services/musicXmlParser.ts';
import {
  formatSolfaLetter,
  getVoiceShortLabel,
  layoutMeasureBeats,
  layoutTonicSolfaDocument
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

console.log('--- RUNNING TONIC SOL-FA SHEET LAYOUT & RHYTHM TESTS ---\n');

const gMajor = {
  fifths: 1,
  mode: 'major',
  name: 'G Major',
  tonicStep: 'G',
  tonicAlter: 0
};

// 1. OCTAVE MARKS
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

// 2. VOICE SHORT LABELS
assert(getVoiceShortLabel('Soprano', 0) === 'S', 'Soprano -> S');
assert(getVoiceShortLabel('Alto', 1) === 'A', 'Alto -> A');
assert(getVoiceShortLabel('Tenor', 2) === 'T', 'Tenor -> T');
assert(getVoiceShortLabel('Bass', 3) === 'B', 'Bass -> B');
assert(getVoiceShortLabel('Voice 1', 0) === 'V1', 'Voice 1 -> V1');
assert(getVoiceShortLabel('Piano', 1) === 'Pno', 'Piano -> Pno');

// 3. BEAT & RHYTHMIC LAYOUT
// Measure with half note + quarter + quarter in 4/4
const measureHalfQuarterQuarter = {
  number: 1,
  timeSignature: '4/4',
  keySignature: gMajor,
  events: [
    // Half note (2 beats): G4
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
    // Quarter note (1 beat): B4
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
    // Quarter note (1 beat): D5
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
    // 2 eighth notes on beat 1: G4 then A4 -> d .r
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

// 4. MULTI-PAGE SYSTEM & PAGINATION TEST
const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Test Choral Score</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Soprano</part-name></score-part>
    <score-part id="P2"><part-name>Alto</part-name></score-part>
    <score-part id="P3"><part-name>Tenor</part-name></score-part>
    <score-part id="P4"><part-name>Bass</part-name></score-part>
  </part-list>
  <part id="P1">
    ${Array.from({ length: 12 }, (_, i) => `
      <measure number="${i + 1}">
        <attributes>
          <divisions>4</divisions>
          <key><fifths>0</fifths><mode>major</mode></key>
          <time><beats>4</beats><beat-type>4</beat-type></time>
        </attributes>
        <note>
          <pitch><step>C</step><octave>4</octave></pitch>
          <duration>4</duration><type>quarter</type>
          <lyric><text>Glo</text></lyric>
        </note>
        <note><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
        <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
        <note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
      </measure>
    `).join('')}
  </part>
  <part id="P2"><measure number="1"><note><rest/><duration>16</duration></note></measure></part>
  <part id="P3"><measure number="1"><note><rest/><duration>16</duration></note></measure></part>
  <part id="P4"><measure number="1"><note><rest/><duration>16</duration></note></measure></part>
</score-partwise>`;

const parsedDoc = parseMusicXml(sampleXml, 'Test Choral');
const pages = layoutTonicSolfaDocument(parsedDoc);

assert(pages.length >= 1, 'Document produces at least 1 page');
assert(pages[0].isFirstPage === true, 'Page 1 is marked as first page');
assert(pages[0].header.title === 'Test Choral Score', 'Header title extracted');
assert(pages[0].header.dohPitch === 'Doh is C', 'Doh pitch is Doh is C');
assert(pages[0].systems.length > 0, 'Systems exist on page');
assert(pages[0].systems[0].voiceRows.length === 4, '4 SATB voice rows in system');
assert(pages[0].systems[0].voiceRows[0].shortLabel === 'S', 'First voice labeled S');
assert(pages[0].systems[0].voiceRows[1].shortLabel === 'A', 'Second voice labeled A');
assert(pages[0].systems[0].voiceRows[2].shortLabel === 'T', 'Third voice labeled T');
assert(pages[0].systems[0].voiceRows[3].shortLabel === 'B', 'Fourth voice labeled B');

console.log(`\n🎉 ALL ${passedTests}/${totalTests} TONIC SOL-FA SHEET LAYOUT TESTS PASSED!\n`);
