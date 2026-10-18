import { parseMusicXml } from '../src/services/musicXmlParser.ts';
import {
  inferScoreStructure,
  extractSatbLogicalScore,
  extractKeyboardLogicalScore,
  normalizeScoreTitle
} from '../src/services/scoreStructureInference.ts';
import { layoutTonicSolfaDocument } from '../src/services/solfaSheetLayout.ts';

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

console.log('=== MUSIQ MUSICAL STRUCTURE & TEXTURE INFERENCE TEST SUITE ===\n');

// ========================================================
// 1. TITLE NORMALIZATION TEST
// ========================================================
console.log('--- 1. Title Normalization ---');
assert(normalizeScoreTitle('TO_GOD_BE_THE-_GLORY') === 'TO GOD BE THE GLORY', 'Normalizes TO_GOD_BE_THE-_GLORY to TO GOD BE THE GLORY');
assert(normalizeScoreTitle('hymn_of_praise_final.musicxml') === 'Hymn Of Praise Final', 'Strips extension and title cases lowercase');
assert(normalizeScoreTitle('GREAT_IS_THY_FAITHFULNESS.pdf') === 'GREAT IS THY FAITHFULNESS', 'Preserves clean uppercase for hymn titles');

// ========================================================
// 2. HYMN GRAND-STAFF TEST (TO GOD BE THE GLORY STYLE)
// ========================================================
console.log('\n--- 2. Hymn Grand-Staff Score (Treble + Bass, 4-Part Harmony, Lyrics) ---');
// 2 staves, Part name "Piano" (from OMR), 4 distinct sounding notes at each beat, lyrics present
const hymnGrandStaffXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>TO_GOD_BE_THE-_GLORY</work-title></work>
  <identification><creator type="composer">Fanny Crosby / W. H. Doane</creator></identification>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>1</fifths><mode>major</mode></key>
        <time><beats>3</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <!-- Beat 1: Treble chord G4 (S) + D4 (A), Bass chord B3 (T) + G2 (B) -->
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><voice>1</voice><staff>1</staff><type>quarter</type><lyric><text>To</text></lyric></note>
      <note><chord/><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><voice>1</voice><staff>1</staff><type>quarter</type></note>
      <!-- Beat 2: Treble chord B4 (S) + D4 (A) -->
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>4</duration><voice>1</voice><staff>1</staff><type>quarter</type><lyric><text>God</text></lyric></note>
      <note><chord/><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><voice>1</voice><staff>1</staff><type>quarter</type></note>
      <!-- Beat 3: Treble chord D5 (S) + G4 (A) -->
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>4</duration><voice>1</voice><staff>1</staff><type>quarter</type><lyric><text>be</text></lyric></note>
      <note><chord/><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><voice>1</voice><staff>1</staff><type>quarter</type></note>

      <backup><duration>12</duration></backup>

      <!-- Bass staff: Voices 5 and 6 (OMR encoding) -->
      <!-- Beat 1: Bass chord B3 (T) + G2 (B) -->
      <note><pitch><step>B</step><octave>3</octave></pitch><duration>4</duration><voice>5</voice><staff>2</staff><type>quarter</type></note>
      <note><chord/><pitch><step>G</step><octave>2</octave></pitch><duration>4</duration><voice>5</voice><staff>2</staff><type>quarter</type></note>
      <!-- Beat 2: Bass chord G3 (T) + G2 (B) -->
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>4</duration><voice>5</voice><staff>2</staff><type>quarter</type></note>
      <note><chord/><pitch><step>G</step><octave>2</octave></pitch><duration>4</duration><voice>5</voice><staff>2</staff><type>quarter</type></note>
      <!-- Beat 3: Bass chord B3 (T) + G2 (B) -->
      <note><pitch><step>B</step><octave>3</octave></pitch><duration>4</duration><voice>5</voice><staff>2</staff><type>quarter</type></note>
      <note><chord/><pitch><step>G</step><octave>2</octave></pitch><duration>4</duration><voice>5</voice><staff>2</staff><type>quarter</type></note>
    </measure>

    <measure number="2">
      <!-- Beat 1: the glo - ry -->
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>4</duration><voice>1</voice><staff>1</staff><type>quarter</type><lyric><text>the</text></lyric></note>
      <note><chord/><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><voice>1</voice><staff>1</staff><type>quarter</type></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>8</duration><voice>1</voice><staff>1</staff><type>half</type><lyric><text>glo-ry</text></lyric></note>
      <note><chord/><pitch><step>F</step><alter>1</alter><octave>4</octave></pitch><duration>8</duration><voice>1</voice><staff>1</staff><type>half</type></note>

      <backup><duration>12</duration></backup>

      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><voice>5</voice><staff>2</staff><type>quarter</type></note>
      <note><chord/><pitch><step>C</step><octave>3</octave></pitch><duration>4</duration><voice>5</voice><staff>2</staff><type>quarter</type></note>
      <note><pitch><step>A</step><octave>3</octave></pitch><duration>8</duration><voice>5</voice><staff>2</staff><type>half</type></note>
      <note><chord/><pitch><step>D</step><octave>3</octave></pitch><duration>8</duration><voice>5</voice><staff>2</staff><type>half</type></note>
    </measure>
  </part>
</score-partwise>`;

const parsedHymn = parseMusicXml(hymnGrandStaffXml, 'TO_GOD_BE_THE-_GLORY');
const hymnInference = inferScoreStructure(parsedHymn);

assert(hymnInference.detectedMode === 'SATB', 'AUTO mode infers SATB for hymn grand-staff score');
assert(hymnInference.confidence >= 0.75, `Hymn SATB confidence is high (${Math.round(hymnInference.confidence * 100)}% >= 75%)`);
assert(hymnInference.evidence.some(e => e.includes('lyrics')), 'Evidence documents lyrics detection');
assert(hymnInference.evidence.some(e => e.includes('harmonic density') || e.includes('four-part')), 'Evidence documents four-part harmonic density');

// Typeset document in AUTO mode
const pagesHymn = layoutTonicSolfaDocument(parsedHymn);
assert(pagesHymn.length > 0, 'Typeset produces pages');
const sys1 = pagesHymn[0].systems[0];

assert(sys1.voiceRows.length === 4, 'System 1 has exactly 4 rows (S, A, T, B)');
assert(sys1.voiceRows[0].displayLabel === 'S', 'Row 1 is labeled S (Soprano)');
assert(sys1.voiceRows[1].displayLabel === 'A', 'Row 2 is labeled A (Alto)');
assert(sys1.voiceRows[2].displayLabel === 'T', 'Row 3 is labeled T (Tenor)');
assert(sys1.voiceRows[3].displayLabel === 'B', 'Row 4 is labeled B (Bass)');

// Verify that NO raw MusicXML voice numbers appear anywhere
const allLabels = sys1.voiceRows.map(r => r.displayLabel);
assert(!allLabels.some(l => l.includes('V1') || l.includes('V2') || l.includes('V5') || l.includes('V8')), 'NO raw V1..V8 labels exposed');
assert(!allLabels.some(l => l.includes('PIANO RH') || l.includes('PIANO LH')), 'NO Piano RH/LH labels in SATB hymn transcription');

// Verify title is cleanly normalized
assert(pagesHymn[0].header.title === 'TO GOD BE THE GLORY', 'Header title normalized to TO GOD BE THE GLORY');

// Verify synchronized lyrics row exists
assert(Boolean(sys1.sharedLyricsRow), 'System has clean unified shared lyrics row beneath SATB');

// ========================================================
// 3. GENUINE PIANO SCORE TEST (PROTECTION FROM FALSE SATB)
// ========================================================
console.log('\n--- 3. Genuine Piano Score (Arpeggiated, Polyphonic, No Lyrics) ---');
// 2 staves, Piano Sonata, LH Alberti bass running eighths, RH melody, NO lyrics
const genuinePianoXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Piano Sonata in C Major</work-title></work>
  <identification><creator type="composer">W. A. Mozart</creator></identification>
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
      <!-- RH: Half note C5, quarter E5, quarter G5 (Melody, no lyrics) -->
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>8</duration><voice>1</voice><staff>1</staff><type>half</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>4</duration><voice>1</voice><staff>1</staff><type>quarter</type></note>
      <note><pitch><step>G</step><octave>5</octave></pitch><duration>4</duration><voice>1</voice><staff>1</staff><type>quarter</type></note>

      <backup><duration>16</duration></backup>

      <!-- LH: Alberti Bass 8th notes (C3-G3-E3-G3, C3-G3-E3-G3) -> highly polyphonic/independent -->
      <note><pitch><step>C</step><octave>3</octave></pitch><duration>2</duration><voice>2</voice><staff>2</staff><type>eighth</type></note>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>2</duration><voice>2</voice><staff>2</staff><type>eighth</type></note>
      <note><pitch><step>E</step><octave>3</octave></pitch><duration>2</duration><voice>2</voice><staff>2</staff><type>eighth</type></note>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>2</duration><voice>2</voice><staff>2</staff><type>eighth</type></note>
      <note><pitch><step>C</step><octave>3</octave></pitch><duration>2</duration><voice>2</voice><staff>2</staff><type>eighth</type></note>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>2</duration><voice>2</voice><staff>2</staff><type>eighth</type></note>
      <note><pitch><step>E</step><octave>3</octave></pitch><duration>2</duration><voice>2</voice><staff>2</staff><type>eighth</type></note>
      <note><pitch><step>G</step><octave>3</octave></pitch><duration>2</duration><voice>2</voice><staff>2</staff><type>eighth</type></note>
    </measure>
  </part>
</score-partwise>`;

const parsedPianoPiece = parseMusicXml(genuinePianoXml, 'Piano Sonata in C Major');
const pianoInference = inferScoreStructure(parsedPianoPiece);

assert(pianoInference.detectedMode === 'KEYBOARD', 'Real piano is NOT classified as SATB; AUTO infers KEYBOARD');
assert(pianoInference.logicalVoices.length === 2, 'Inferred 2 logical keyboard staves (RH & LH)');
assert(pianoInference.logicalVoices[0].label === 'Piano RH', 'RH labeled Piano RH');
assert(pianoInference.logicalVoices[1].label === 'Piano LH', 'LH labeled Piano LH');

const pagesPianoPiece = layoutTonicSolfaDocument(parsedPianoPiece);
const pSys1 = pagesPianoPiece[0].systems[0];
assert(pSys1.voiceRows.length === 2, 'Typesets exactly 2 rows for Piano piece (RH and LH)');
assert(pSys1.voiceRows[0].displayLabel === 'Piano RH', 'Row 1 is Piano RH');
assert(pSys1.voiceRows[1].displayLabel === 'Piano LH', 'Row 2 is Piano LH');
assert(!pSys1.voiceRows.some(r => r.displayLabel.includes('V1') || r.displayLabel.includes('V2')), 'No raw V1/V2 voice labels');

// ========================================================
// 4. TRUE SATB CHORAL TEST (EXPLICIT VOCAL PARTS)
// ========================================================
console.log('\n--- 4. True SATB Choral Score (4 Explicit Vocal Parts) ---');
const explicitSatbXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Choral Anthem</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Soprano</part-name></score-part>
    <score-part id="P2"><part-name>Alto</part-name></score-part>
    <score-part id="P3"><part-name>Tenor</part-name></score-part>
    <score-part id="P4"><part-name>Bass</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>16</duration><type>whole</type><lyric><text>Amen</text></lyric></note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>16</duration><type>whole</type></note>
    </measure>
  </part>
  <part id="P3">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>16</duration><type>whole</type></note>
    </measure>
  </part>
  <part id="P4">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>3</octave></pitch><duration>16</duration><type>whole</type></note>
    </measure>
  </part>
</score-partwise>`;

const parsedExplicitSatb = parseMusicXml(explicitSatbXml, 'Choral Anthem');
const satbInf = inferScoreStructure(parsedExplicitSatb);
assert(satbInf.detectedMode === 'SATB', 'Explicit SATB detected with 0.98 confidence');
assert(satbInf.confidence >= 0.95, 'High confidence for explicit SATB');

const pagesExplicitSatb = layoutTonicSolfaDocument(parsedExplicitSatb);
const eSys1 = pagesExplicitSatb[0].systems[0];
assert(eSys1.voiceRows.length === 4, '4 rows in system');
assert(eSys1.voiceRows[0].displayLabel === 'S', 'Soprano -> S');
assert(eSys1.voiceRows[1].displayLabel === 'A', 'Alto -> A');
assert(eSys1.voiceRows[2].displayLabel === 'T', 'Tenor -> T');
assert(eSys1.voiceRows[3].displayLabel === 'B', 'Bass -> B');

// ========================================================
// 5. INSTRUMENTAL SCORE TEST (TRUMPET + ORGAN)
// ========================================================
console.log('\n--- 5. Instrumental Score (Trumpet + Organ) ---');
const trumpetOrganXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Sonata da Chiesa</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Trumpet in C</part-name></score-part>
    <score-part id="P2"><part-name>Organ</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>16</duration><type>whole</type></note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <attributes>
        <divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>16</duration><staff>1</staff><type>whole</type></note>
      <note><pitch><step>C</step><octave>3</octave></pitch><duration>16</duration><staff>2</staff><type>whole</type></note>
    </measure>
  </part>
</score-partwise>`;

const parsedInst = parseMusicXml(trumpetOrganXml, 'Sonata da Chiesa');
const instInf = inferScoreStructure(parsedInst);
assert(instInf.detectedMode === 'INSTRUMENTAL', 'Trumpet + Organ inferred as INSTRUMENTAL');
assert(instInf.partsSummary.includes('Trumpet'), 'Parts summary preserves Trumpet');
assert(instInf.partsSummary.includes('Organ'), 'Parts summary preserves Organ');

const pagesInst = layoutTonicSolfaDocument(parsedInst);
const iSys1 = pagesInst[0].systems[0];
const instLabels = iSys1.voiceRows.map(r => r.displayLabel);
assert(instLabels.some(l => l.includes('Trumpet')), 'Trumpet remains Trumpet (NOT relabeled Soprano!)');
assert(instLabels.some(l => l.includes('Organ RH') || l.includes('Organ')), 'Organ remains Organ');

// ========================================================
// 6. USER STRUCTURE OVERRIDE TEST
// ========================================================
console.log('\n--- 6. User Structure Override ---');
// User forces KEYBOARD mode on the hymn score
const forcedKeyboardPages = layoutTonicSolfaDocument(parsedHymn, { structureMode: 'KEYBOARD' });
const fkSys = forcedKeyboardPages[0].systems[0];
assert(fkSys.voiceRows.length === 2, 'Forced KEYBOARD produces 2 rows');
assert(fkSys.voiceRows[0].displayLabel === 'Piano RH', 'Forced KEYBOARD row 1 is Piano RH');
assert(fkSys.voiceRows[1].displayLabel === 'Piano LH', 'Forced KEYBOARD row 2 is Piano LH');

// User forces SATB mode on the piano piece
const forcedSatbPages = layoutTonicSolfaDocument(parsedPianoPiece, { structureMode: 'SATB' });
const fsSys = forcedSatbPages[0].systems[0];
assert(fsSys.voiceRows.length === 4, 'Forced SATB produces 4 rows');
assert(fsSys.voiceRows[0].displayLabel === 'S', 'Row 1 is S');
assert(fsSys.voiceRows[3].displayLabel === 'B', 'Row 4 is B');

console.log(`\n🎉 ALL ${passedTests}/${totalTests} MUSICAL STRUCTURE INFERENCE TESTS PASSED!`);
