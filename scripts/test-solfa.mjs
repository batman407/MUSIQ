import { getKeySignatureInfo } from '../src/services/musicXmlParser.ts';
import {
  noteToSolfa,
  formatEventNoteNames,
  formatEventSolfa,
  generateNotesPlainText,
  generateSolfaPlainText
} from '../src/services/solfaEngine.ts';

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

function makeNote(step, alter = 0, octave = 4, isRest = false) {
  let alterStr = alter === 1 ? '#' : alter === -1 ? 'b' : alter === 2 ? '##' : alter === -2 ? 'bb' : '';
  return {
    pitch: isRest ? 'Rest' : `${step}${alterStr}${octave}`,
    step,
    alter,
    octave,
    type: 'quarter',
    dots: 0,
    isRest,
    isChord: false,
    voice: 1,
    staff: 1
  };
}

function makeEvent(notes, isRest = false, isChord = false) {
  return {
    id: 'e1',
    isRest,
    isChord,
    notes,
    rhythmSymbol: '♩',
    durationName: 'quarter',
    durationBeats: 1,
    voice: 1,
    staff: 1
  };
}

console.log('--- RUNNING MUSIQ TONIC SOL-FA & NOTE-NAME UNIT TESTS ---\n');

// 1. C MAJOR (0 fifths)
const cMajor = getKeySignatureInfo(0, 'major');
assert(cMajor.name === 'C Major', 'Key 0 is C Major');
assert(noteToSolfa(makeNote('C'), cMajor) === 'do', 'C in C Major is do');
assert(noteToSolfa(makeNote('D'), cMajor) === 're', 'D in C Major is re');
assert(noteToSolfa(makeNote('E'), cMajor) === 'mi', 'E in C Major is mi');
assert(noteToSolfa(makeNote('F'), cMajor) === 'fa', 'F in C Major is fa');
assert(noteToSolfa(makeNote('G'), cMajor) === 'sol', 'G in C Major is sol');
assert(noteToSolfa(makeNote('A'), cMajor) === 'la', 'A in C Major is la');
assert(noteToSolfa(makeNote('B'), cMajor) === 'ti', 'B in C Major is ti');

// 2. G MAJOR (1 fifth / 1 sharp)
const gMajor = getKeySignatureInfo(1, 'major');
assert(gMajor.name === 'G Major', 'Key 1 is G Major');
assert(noteToSolfa(makeNote('G'), gMajor) === 'do', 'G in G Major is do');
assert(noteToSolfa(makeNote('A'), gMajor) === 're', 'A in G Major is re');
assert(noteToSolfa(makeNote('B'), gMajor) === 'mi', 'B in G Major is mi');
assert(noteToSolfa(makeNote('C'), gMajor) === 'fa', 'C in G Major is fa');
assert(noteToSolfa(makeNote('D'), gMajor) === 'sol', 'D in G Major is sol');
assert(noteToSolfa(makeNote('E'), gMajor) === 'la', 'E in G Major is la');
assert(noteToSolfa(makeNote('F', 1), gMajor) === 'ti', 'F# in G Major is ti');

// 3. D MAJOR (2 fifths / 2 sharps)
const dMajor = getKeySignatureInfo(2, 'major');
assert(dMajor.name === 'D Major', 'Key 2 is D Major');
assert(noteToSolfa(makeNote('D'), dMajor) === 'do', 'D in D Major is do');
assert(noteToSolfa(makeNote('E'), dMajor) === 're', 'E in D Major is re');
assert(noteToSolfa(makeNote('F', 1), dMajor) === 'mi', 'F# in D Major is mi');
assert(noteToSolfa(makeNote('G'), dMajor) === 'fa', 'G in D Major is fa');
assert(noteToSolfa(makeNote('A'), dMajor) === 'sol', 'A in D Major is sol');
assert(noteToSolfa(makeNote('B'), dMajor) === 'la', 'B in D Major is la');
assert(noteToSolfa(makeNote('C', 1), dMajor) === 'ti', 'C# in D Major is ti');

// 4. F MAJOR (-1 fifth / 1 flat)
const fMajor = getKeySignatureInfo(-1, 'major');
assert(fMajor.name === 'F Major', 'Key -1 is F Major');
assert(noteToSolfa(makeNote('F'), fMajor) === 'do', 'F in F Major is do');
assert(noteToSolfa(makeNote('G'), fMajor) === 're', 'G in F Major is re');
assert(noteToSolfa(makeNote('A'), fMajor) === 'mi', 'A in F Major is mi');
assert(noteToSolfa(makeNote('B', -1), fMajor) === 'fa', 'Bb in F Major is fa');
assert(noteToSolfa(makeNote('C'), fMajor) === 'sol', 'C in F Major is sol');
assert(noteToSolfa(makeNote('D'), fMajor) === 'la', 'D in F Major is la');
assert(noteToSolfa(makeNote('E'), fMajor) === 'ti', 'E in F Major is ti');

// 5. Bb MAJOR (-2 fifths / 2 flats)
const bbMajor = getKeySignatureInfo(-2, 'major');
assert(bbMajor.name === 'Bb Major', 'Key -2 is Bb Major');
assert(noteToSolfa(makeNote('B', -1), bbMajor) === 'do', 'Bb in Bb Major is do');
assert(noteToSolfa(makeNote('C'), bbMajor) === 're', 'C in Bb Major is re');
assert(noteToSolfa(makeNote('D'), bbMajor) === 'mi', 'D in Bb Major is mi');
assert(noteToSolfa(makeNote('E', -1), bbMajor) === 'fa', 'Eb in Bb Major is fa');
assert(noteToSolfa(makeNote('F'), bbMajor) === 'sol', 'F in Bb Major is sol');
assert(noteToSolfa(makeNote('G'), bbMajor) === 'la', 'G in Bb Major is la');
assert(noteToSolfa(makeNote('A'), bbMajor) === 'ti', 'A in Bb Major is ti');

// 6. CHROMATIC SCALE DEGREES IN C MAJOR
assert(noteToSolfa(makeNote('C', 1), cMajor) === 'di', 'C# (sharp 1) is di');
assert(noteToSolfa(makeNote('D', 1), cMajor) === 'ri', 'D# (sharp 2) is ri');
assert(noteToSolfa(makeNote('F', 1), cMajor) === 'fi', 'F# (sharp 4) is fi');
assert(noteToSolfa(makeNote('G', 1), cMajor) === 'si', 'G# (sharp 5) is si');
assert(noteToSolfa(makeNote('A', 1), cMajor) === 'li', 'A# (sharp 6) is li');

assert(noteToSolfa(makeNote('D', -1), cMajor) === 'ra', 'Db (flat 2) is ra');
assert(noteToSolfa(makeNote('E', -1), cMajor) === 'me', 'Eb (flat 3) is me');
assert(noteToSolfa(makeNote('G', -1), cMajor) === 'se', 'Gb (flat 5) is se');
assert(noteToSolfa(makeNote('A', -1), cMajor) === 'le', 'Ab (flat 6) is le');
assert(noteToSolfa(makeNote('B', -1), cMajor) === 'te', 'Bb (flat 7) is te');

// 7. MINOR KEY (D Minor: -1 fifth, minor mode)
const dMinor = getKeySignatureInfo(-1, 'minor');
assert(dMinor.name === 'D Minor', 'Key -1 minor is D Minor');
assert(noteToSolfa(makeNote('D'), dMinor) === 'do', 'Tonic D in D Minor is do');
assert(noteToSolfa(makeNote('E'), dMinor) === 're', 'E in D Minor is re');
assert(noteToSolfa(makeNote('F'), dMinor) === 'me', 'F in D Minor is me (minor 3rd)');
assert(noteToSolfa(makeNote('F', 1), dMinor) === 'mi', 'F# in D Minor is mi (raised major 3rd)');
assert(noteToSolfa(makeNote('G'), dMinor) === 'fa', 'G in D Minor is fa');
assert(noteToSolfa(makeNote('A'), dMinor) === 'sol', 'A in D Minor is sol');
assert(noteToSolfa(makeNote('B', -1), dMinor) === 'le', 'Bb in D Minor is le (minor 6th)');
assert(noteToSolfa(makeNote('B'), dMinor) === 'la', 'B natural in D Minor is la (melodic minor 6th)');
assert(noteToSolfa(makeNote('C'), dMinor) === 'te', 'C natural in D Minor is te (natural minor 7th)');
assert(noteToSolfa(makeNote('C', 1), dMinor) === 'ti', 'C# in D Minor is ti (harmonic minor 7th leading tone)');

// 8. RESTS
assert(noteToSolfa(makeNote('C', 0, 4, true), cMajor) === 'Rest', 'Rest returns Rest');
const restEvent = makeEvent([makeNote('C', 0, 4, true)], true);
assert(formatEventNoteNames(restEvent) === 'Rest', 'formatEventNoteNames on rest returns Rest');
assert(formatEventSolfa(restEvent, cMajor) === 'Rest', 'formatEventSolfa on rest returns Rest');

// 9. CHORDS
const chordNotes = [makeNote('C'), makeNote('E'), makeNote('G')];
const chordEvent = makeEvent(chordNotes, false, true);
assert(formatEventNoteNames(chordEvent) === '[C4 E4 G4]', 'Chord note names formatted as [C4 E4 G4]');
assert(formatEventSolfa(chordEvent, cMajor) === '[do mi sol]', 'Chord solfa formatted as [do mi sol]');

// In G Major: [G4 B4 D5] -> [do mi sol]
const gChordNotes = [makeNote('G', 0, 4), makeNote('B', 0, 4), makeNote('D', 0, 5)];
const gChordEvent = makeEvent(gChordNotes, false, true);
assert(formatEventNoteNames(gChordEvent) === '[G4 B4 D5]', 'G chord note names formatted as [G4 B4 D5]');
assert(formatEventSolfa(gChordEvent, gMajor) === '[do mi sol]', 'G chord solfa in G Major is [do mi sol]');

// 10. PLAIN-TEXT EXPORTS
const sampleParts = [
  {
    name: 'Voice 1',
    measures: [
      {
        number: 1,
        keySignature: cMajor,
        events: [makeEvent([makeNote('C')]), makeEvent([makeNote('E')]), makeEvent([makeNote('G')])]
      }
    ]
  }
];

const notesTxt = generateNotesPlainText('Test Score', cMajor, '4/4', sampleParts);
assert(notesTxt.includes('MUSIQ NOTE-NAME TRANSCRIPTION'), 'Notes TXT header present');
assert(notesTxt.includes('C4  E4  G4'), 'Notes TXT contains C4 E4 G4');

const solfaTxt = generateSolfaPlainText('Test Score', cMajor, '4/4', sampleParts);
assert(solfaTxt.includes('MUSIQ TONIC SOL-FA TRANSCRIPTION'), 'Sol-Fa TXT header present');
assert(solfaTxt.includes('M1 | do  mi  sol'), 'Sol-Fa TXT contains M1 | do mi sol');

console.log(`\n🎉 ALL ${passedTests}/${totalTests} MUSICAL CORRECTNESS TESTS PASSED!\n`);
