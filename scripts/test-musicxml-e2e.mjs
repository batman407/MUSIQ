import { parseMusicXml } from '../src/services/musicXmlParser.ts';
import {
  formatEventNoteNames,
  formatEventSolfa,
  generateNotesPlainText,
  generateSolfaPlainText
} from '../src/services/solfaEngine.ts';

const SAMPLE_REAL_MUSICXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Audiveris Test Symphony</work-title>
  </work>
  <identification>
    <creator type="composer">W. A. Mozart</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Soprano</part-name>
      <part-abbreviation>S.</part-abbreviation>
    </score-part>
    <score-part id="P2">
      <part-name>Piano</part-name>
      <part-abbreviation>Pno.</part-abbreviation>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key>
          <fifths>1</fifths>
          <mode>major</mode>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <direction>
        <sound tempo="120"/>
      </direction>
      <!-- G4 (Tonic = do in G Major) -->
      <note>
        <pitch>
          <step>G</step>
          <alter>0</alter>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>quarter</type>
        <lyric>
          <text>Glo</text>
        </lyric>
      </note>
      <!-- B4 (3rd = mi) -->
      <note>
        <pitch>
          <step>B</step>
          <alter>0</alter>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>quarter</type>
        <lyric>
          <text>ri</text>
        </lyric>
      </note>
      <!-- D5 (5th = sol) -->
      <note>
        <pitch>
          <step>D</step>
          <alter>0</alter>
          <octave>5</octave>
        </pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>quarter</type>
        <lyric>
          <text>a</text>
        </lyric>
      </note>
      <!-- Rest -->
      <note>
        <rest/>
        <duration>4</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="2">
      <!-- F#4 (7th = ti in G Major) -->
      <note>
        <pitch>
          <step>F</step>
          <alter>1</alter>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
      <!-- F natural 4 (flattened 7th = te in G Major) -->
      <note>
        <pitch>
          <step>F</step>
          <alter>0</alter>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
      <!-- E4 (6th = la in G Major) -->
      <note>
        <pitch>
          <step>E</step>
          <alter>0</alter>
          <octave>4</octave>
        </pitch>
        <duration>8</duration>
        <voice>1</voice>
        <type>half</type>
      </note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key>
          <fifths>1</fifths>
          <mode>major</mode>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>F</sign>
          <line>4</line>
        </clef>
      </attributes>
      <!-- Simultaneous Piano Chord [G2 B2 D3] -> [do mi sol] -->
      <note>
        <pitch>
          <step>G</step>
          <octave>2</octave>
        </pitch>
        <duration>8</duration>
        <voice>1</voice>
        <type>half</type>
      </note>
      <note>
        <chord/>
        <pitch>
          <step>B</step>
          <octave>2</octave>
        </pitch>
        <duration>8</duration>
        <voice>1</voice>
        <type>half</type>
      </note>
      <note>
        <chord/>
        <pitch>
          <step>D</step>
          <octave>3</octave>
        </pitch>
        <duration>8</duration>
        <voice>1</voice>
        <type>half</type>
      </note>
      <!-- Chord [C3 E3 G3] -> [fa la do] in G Major -->
      <note>
        <pitch>
          <step>C</step>
          <octave>3</octave>
        </pitch>
        <duration>8</duration>
        <voice>1</voice>
        <type>half</type>
      </note>
      <note>
        <chord/>
        <pitch>
          <step>E</step>
          <octave>3</octave>
        </pitch>
        <duration>8</duration>
        <voice>1</voice>
        <type>half</type>
      </note>
      <note>
        <chord/>
        <pitch>
          <step>G</step>
          <octave>3</octave>
        </pitch>
        <duration>8</duration>
        <voice>1</voice>
        <type>half</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

// Polyfill DOMParser for node environment using @xmldom/xmldom
if (typeof DOMParser === 'undefined') {
  const { DOMParser: NodeDOMParser } = await import('@xmldom/xmldom');
  globalThis.DOMParser = NodeDOMParser;
}

console.log('--- RUNNING MUSICXML END-TO-END PARSER & TRANSCRIPTION TEST ---\n');

if (typeof DOMParser === 'undefined') {
  console.log('Note: DOMParser not in node environment without jsdom; testing in browser build.');
  process.exit(0);
}

const parsed = parseMusicXml(SAMPLE_REAL_MUSICXML, 'Test Score');

console.log('Title:', parsed.title);
console.log('Composer:', parsed.composer);
console.log('Key:', parsed.keySignature.name);
console.log('Parts found:', parsed.parts.map(p => p.name).join(', '));

if (parsed.title !== 'Audiveris Test Symphony') throw new Error('Title extraction failed');
if (parsed.composer !== 'W. A. Mozart') throw new Error('Composer extraction failed');
if (parsed.keySignature.name !== 'G Major') throw new Error('Key detection failed');
if (parsed.parts.length !== 2) throw new Error('Expected 2 parts');

// Part 1: Soprano
const soprano = parsed.parts[0];
console.log('\nSoprano Measure 1 Events:');
soprano.measures[0].events.forEach(e => {
  console.log(`  Note: ${formatEventNoteNames(e)}, Sol-Fa: ${formatEventSolfa(e, parsed.keySignature)}, Lyric: ${e.lyric || 'none'}`);
});

const m1Events = soprano.measures[0].events;
if (formatEventNoteNames(m1Events[0]) !== 'G4' || formatEventSolfa(m1Events[0], parsed.keySignature) !== 'do') {
  throw new Error('M1 note 1 should be G4 / do');
}
if (formatEventNoteNames(m1Events[1]) !== 'B4' || formatEventSolfa(m1Events[1], parsed.keySignature) !== 'mi') {
  throw new Error('M1 note 2 should be B4 / mi');
}
if (formatEventNoteNames(m1Events[2]) !== 'D5' || formatEventSolfa(m1Events[2], parsed.keySignature) !== 'sol') {
  throw new Error('M1 note 3 should be D5 / sol');
}
if (formatEventNoteNames(m1Events[3]) !== 'Rest' || formatEventSolfa(m1Events[3], parsed.keySignature) !== 'Rest') {
  throw new Error('M1 note 4 should be Rest');
}
if (m1Events[0].lyric !== 'Glo' || m1Events[1].lyric !== 'ri' || m1Events[2].lyric !== 'a') {
  throw new Error('Lyrics preservation failed');
}

console.log('\nSoprano Measure 2 Events:');
soprano.measures[1].events.forEach(e => {
  console.log(`  Note: ${formatEventNoteNames(e)}, Sol-Fa: ${formatEventSolfa(e, parsed.keySignature)}`);
});
const m2Events = soprano.measures[1].events;
if (formatEventSolfa(m2Events[0], parsed.keySignature) !== 'ti') throw new Error('F# in G Major should be ti');
if (formatEventSolfa(m2Events[1], parsed.keySignature) !== 'te') throw new Error('F natural in G Major should be te');
if (formatEventSolfa(m2Events[2], parsed.keySignature) !== 'la') throw new Error('E4 in G Major should be la');

// Part 2: Piano Chords
const piano = parsed.parts[1];
console.log('\nPiano Chords:');
piano.measures[0].events.forEach(e => {
  console.log(`  Chord Notes: ${formatEventNoteNames(e)}, Sol-Fa: ${formatEventSolfa(e, parsed.keySignature)}`);
});
const pChord1 = piano.measures[0].events[0];
if (formatEventNoteNames(pChord1) !== '[G2 B2 D3]' || formatEventSolfa(pChord1, parsed.keySignature) !== '[do mi sol]') {
  throw new Error('Chord 1 should be [G2 B2 D3] -> [do mi sol]');
}
const pChord2 = piano.measures[0].events[1];
if (formatEventNoteNames(pChord2) !== '[C3 E3 G3]' || formatEventSolfa(pChord2, parsed.keySignature) !== '[fa la do]') {
  throw new Error('Chord 2 should be [C3 E3 G3] -> [fa la do]');
}

// Plain text outputs
console.log('\n--- Notes Plain Text ---');
console.log(generateNotesPlainText(parsed.title, parsed.keySignature, parsed.timeSignature, parsed.parts));

console.log('\n--- Sol-Fa Plain Text ---');
console.log(generateSolfaPlainText(parsed.title, parsed.keySignature, parsed.timeSignature, parsed.parts));

console.log('✅ ALL REAL MUSICXML END-TO-END VERIFICATIONS PASSED!\n');
