import { GeneratedSong, ScoreProject, StudioProject, LibraryItem } from '../types';

export const DEMO_SONG: GeneratedSong = {
  id: 'song-midnight-lagos',
  title: 'Midnight in Lagos',
  prompt: 'I dey hustle every day but nobody knows what I sacrifice. One day I\'ll make it.',
  genre: 'Afrobeats',
  mood: 'Emotional',
  voice: 'Male',
  tempo: 104,
  key: 'F# Minor',
  durationSeconds: 168,
  createdAt: '2026-09-14T22:30:00Z',
  isFavorite: true,
  artworkUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2318181D"/><stop offset="50%" stop-color="%232D124D"/><stop offset="100%" stop-color="%2309090B"/></linearGradient></defs><rect width="400" height="400" fill="url(%23g)"/><circle cx="200" cy="180" r="90" fill="none" stroke="%238B5CF6" stroke-width="2" opacity="0.6"/><circle cx="200" cy="180" r="50" fill="%238B5CF6" opacity="0.2"/><path d="M160 260 Q 200 240 240 260" stroke="%2367E8F9" stroke-width="3" fill="none" stroke-linecap="round"/><text x="200" y="340" font-family="sans-serif" font-size="20" font-weight="600" fill="%23F4F1EA" text-anchor="middle">MIDNIGHT IN LAGOS</text><text x="200" y="365" font-family="sans-serif" font-size="12" fill="%239A9AA3" text-anchor="middle">MUSIQ AFROBEATS</text></svg>',
  waveformPeaks: [
    0.15, 0.22, 0.45, 0.65, 0.58, 0.72, 0.85, 0.90, 0.78, 0.62, 
    0.74, 0.88, 0.95, 0.82, 0.70, 0.84, 0.91, 0.64, 0.50, 0.68,
    0.80, 0.92, 0.86, 0.78, 0.55, 0.40, 0.62, 0.75, 0.88, 0.96,
    0.90, 0.82, 0.76, 0.65, 0.52, 0.42, 0.58, 0.70, 0.82, 0.88,
    0.75, 0.60, 0.45, 0.30, 0.20, 0.15
  ],
  sections: [
    {
      id: 'sec-intro',
      name: 'Intro',
      startTime: 0,
      endTime: 16,
      chords: ['F#m', 'D', 'A', 'E'],
      lyrics: [
        '[Gentle talking drum & warm Rhodes]',
        'Yeah... from the Mainland to the Island',
        'Nobody knows the story, but God knows the glory.'
      ]
    },
    {
      id: 'sec-verse1',
      name: 'Verse 1',
      startTime: 16,
      endTime: 48,
      chords: ['F#m', 'D', 'A', 'E'],
      lyrics: [
        'Wake up 4 a.m. in traffic on the third mainland bridge',
        'Chasing a future that my parents couldn\'t reach',
        'They only see the smile when I step into the light',
        'They don\'t see the tears when I\'m crying through the night.',
        'I dey hustle every day, steady on my grind',
        'Putting everything on line, keeping faith inside.'
      ]
    },
    {
      id: 'sec-chorus',
      name: 'Chorus',
      startTime: 48,
      endTime: 80,
      chords: ['F#m', 'D', 'A', 'C#m'],
      lyrics: [
        'Midnight in Lagos, under neon and dust',
        'In this city of dreams, it is God that I trust',
        'One day we go make am, one day we go shine',
        'They go call my name, say na my time.',
        'Oh-oh-oh, midnight in Lagos',
        'We go fly high, we go touch the sky.'
      ]
    },
    {
      id: 'sec-verse2',
      name: 'Verse 2',
      startTime: 80,
      endTime: 112,
      chords: ['F#m', 'D', 'A', 'E'],
      lyrics: [
        'My mama told me, "Son, keep your head up to the rain"',
        'Every single scar will soon turn into your gain',
        'Sweat on my forehead, passion in my chest',
        'Until I take my family straight into the best.'
      ]
    },
    {
      id: 'sec-bridge',
      name: 'Bridge',
      startTime: 112,
      endTime: 140,
      chords: ['Bm', 'F#m', 'E', 'D'],
      lyrics: [
        'Through the struggle and the rain (I still stand)',
        'Through the sorrow and the pain (hold my hand)',
        'I know tomorrow brings the light.',
        'Lagos never sleeps, and neither will I.'
      ]
    },
    {
      id: 'sec-outro',
      name: 'Outro',
      startTime: 140,
      endTime: 168,
      chords: ['F#m', 'D', 'A', 'E'],
      lyrics: [
        'Midnight in Lagos...',
        'Music starts here.',
        '[Percussion gently fades out]'
      ]
    }
  ]
};

// SATB Choir Score for Vision Demo: "Abide With Me" (William H. Monk)
export const DEMO_SCORE: ScoreProject = {
  id: 'score-abide-with-me',
  title: 'Abide With Me (Eventide)',
  composer: 'William H. Monk (1861)',
  keySignature: 'Eb Major',
  timeSignature: '4/4',
  tempoBpm: 76,
  arrangementType: 'SATB',
  measuresCount: 4,
  pagesCount: 1,
  confidenceOverall: 0.94,
  createdAt: '2026-09-15T10:15:00Z',
  isFavorite: true,
  originalScanUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750"><rect width="600" height="750" fill="%23F5F2EB"/><text x="300" y="60" font-family="serif" font-size="22" font-weight="bold" fill="%2318181C" text-anchor="middle">EVENTIDE — 10.10.10.10</text><text x="300" y="85" font-family="serif" font-size="14" font-style="italic" fill="%234A4A52" text-anchor="middle">"Abide with me; fast falls the eventide"</text><text x="50" y="110" font-family="serif" font-size="12" fill="%2318181C">Henry F. Lyte, 1847</text><text x="550" y="110" font-family="serif" font-size="12" fill="%2318181C" text-anchor="end">W. H. Monk, 1861</text><g stroke="%23333338" stroke-width="1.2"><line x1="50" y1="150" x2="550" y2="150"/><line x1="50" y1="162" x2="550" y2="162"/><line x1="50" y1="174" x2="550" y2="174"/><line x1="50" y1="186" x2="550" y2="186"/><line x1="50" y1="198" x2="550" y2="198"/><line x1="50" y1="240" x2="550" y2="240"/><line x1="50" y1="252" x2="550" y2="252"/><line x1="50" y1="264" x2="550" y2="264"/><line x1="50" y1="276" x2="550" y2="276"/><line x1="50" y1="288" x2="550" y2="288"/><line x1="50" y1="150" x2="50" y2="288" stroke-width="2"/><line x1="175" y1="150" x2="175" y2="288"/><line x1="300" y1="150" x2="300" y2="288"/><line x1="425" y1="150" x2="425" y2="288"/><line x1="550" y1="150" x2="550" y2="288" stroke-width="2"/></g><text x="60" y="320" font-family="serif" font-size="13" fill="%23222228">A - bide with me; fast falls the e - ven - tide;</text><g stroke="%23333338" stroke-width="1.2"><line x1="50" y1="360" x2="550" y2="360"/><line x1="50" y1="372" x2="550" y2="372"/><line x1="50" y1="384" x2="550" y2="384"/><line x1="50" y1="396" x2="550" y2="396"/><line x1="50" y1="408" x2="550" y2="408"/><line x1="50" y1="450" x2="550" y2="450"/><line x1="50" y1="462" x2="550" y2="462"/><line x1="50" y1="474" x2="550" y2="474"/><line x1="50" y1="486" x2="550" y2="486"/><line x1="50" y1="498" x2="550" y2="498"/><line x1="50" y1="360" x2="50" y2="498" stroke-width="2"/><line x1="550" y1="360" x2="550" y2="498" stroke-width="2"/></g><text x="60" y="530" font-family="serif" font-size="13" fill="%23222228">The dark - ness deep - ens; Lord, with me a - bide!</text></svg>',
  parts: [
    {
      id: 'part-soprano',
      name: 'Soprano',
      shortName: 'S',
      clef: 'treble',
      color: '#8B5CF6',
      measures: [
        {
          measureNumber: 1,
          confidence: 0.98,
          notes: [
            { id: 's-m1-n1', pitch: 'G4', solfa: 'm', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'A -', confidence: 0.99 },
            { id: 's-m1-n2', pitch: 'G4', solfa: 'm', duration: 'quarter', durationBeats: 1, isRest: false, beat: 3, lyric: 'bide', confidence: 0.98 },
            { id: 's-m1-n3', pitch: 'F4', solfa: 'r', duration: 'quarter', durationBeats: 1, isRest: false, beat: 4, lyric: 'with', confidence: 0.98 }
          ]
        },
        {
          measureNumber: 2,
          confidence: 0.97,
          notes: [
            { id: 's-m2-n1', pitch: 'Eb4', solfa: 'd', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'me;', confidence: 0.97 },
            { id: 's-m2-n2', pitch: 'Bb4', solfa: 's', duration: 'half', durationBeats: 2, isRest: false, beat: 3, lyric: 'fast', confidence: 0.98 }
          ]
        },
        {
          measureNumber: 3,
          confidence: 0.96,
          notes: [
            { id: 's-m3-n1', pitch: 'C5', solfa: 'l', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'falls', confidence: 0.96 },
            { id: 's-m3-n2', pitch: 'Bb4', solfa: 's', duration: 'half', durationBeats: 2, isRest: false, beat: 3, lyric: 'the', confidence: 0.97 }
          ]
        },
        {
          measureNumber: 4,
          confidence: 0.99,
          notes: [
            { id: 's-m4-n1', pitch: 'Ab4', solfa: 'f', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'e - ven -', confidence: 0.99 },
            { id: 's-m4-n2', pitch: 'G4', solfa: 'm', duration: 'half', durationBeats: 2, isRest: false, beat: 3, lyric: 'tide;', confidence: 0.99 }
          ]
        }
      ]
    },
    {
      id: 'part-alto',
      name: 'Alto',
      shortName: 'A',
      clef: 'treble',
      color: '#A78BFA',
      measures: [
        {
          measureNumber: 1,
          confidence: 0.96,
          notes: [
            { id: 'a-m1-n1', pitch: 'Eb4', solfa: 'd', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'A -', confidence: 0.97 },
            { id: 'a-m1-n2', pitch: 'D4', solfa: 't,', duration: 'quarter', durationBeats: 1, isRest: false, beat: 3, lyric: 'bide', confidence: 0.96 },
            { id: 'a-m1-n3', pitch: 'D4', solfa: 't,', duration: 'quarter', durationBeats: 1, isRest: false, beat: 4, lyric: 'with', confidence: 0.95 }
          ]
        },
        {
          measureNumber: 2,
          confidence: 0.95,
          notes: [
            { id: 'a-m2-n1', pitch: 'Eb4', solfa: 'd', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'me;', confidence: 0.95 },
            { id: 'a-m2-n2', pitch: 'Eb4', solfa: 'd', duration: 'half', durationBeats: 2, isRest: false, beat: 3, lyric: 'fast', confidence: 0.96 }
          ]
        },
        {
          measureNumber: 3,
          confidence: 0.68,
          isFlagged: true,
          warningReason: 'Low contrast ledger line in source scan. Pitched as Eb4 (confidence 68%).',
          notes: [
            { id: 'a-m3-n1', pitch: 'Eb4', solfa: 'd', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'falls', confidence: 0.68 },
            { id: 'a-m3-n2', pitch: 'Eb4', solfa: 'd', duration: 'half', durationBeats: 2, isRest: false, beat: 3, lyric: 'the', confidence: 0.70 }
          ]
        },
        {
          measureNumber: 4,
          confidence: 0.97,
          notes: [
            { id: 'a-m4-n1', pitch: 'D4', solfa: 't,', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'e - ven -', confidence: 0.97 },
            { id: 'a-m4-n2', pitch: 'Eb4', solfa: 'd', duration: 'half', durationBeats: 2, isRest: false, beat: 3, lyric: 'tide;', confidence: 0.98 }
          ]
        }
      ]
    },
    {
      id: 'part-tenor',
      name: 'Tenor',
      shortName: 'T',
      clef: 'bass',
      color: '#67E8F9',
      measures: [
        {
          measureNumber: 1,
          confidence: 0.95,
          notes: [
            { id: 't-m1-n1', pitch: 'Bb3', solfa: 's,', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'A -', confidence: 0.96 },
            { id: 't-m1-n2', pitch: 'Bb3', solfa: 's,', duration: 'quarter', durationBeats: 1, isRest: false, beat: 3, lyric: 'bide', confidence: 0.95 },
            { id: 't-m1-n3', pitch: 'Ab3', solfa: 'f,', duration: 'quarter', durationBeats: 1, isRest: false, beat: 4, lyric: 'with', confidence: 0.94 }
          ]
        },
        {
          measureNumber: 2,
          confidence: 0.94,
          notes: [
            { id: 't-m2-n1', pitch: 'G3', solfa: 'm,', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'me;', confidence: 0.95 },
            { id: 't-m2-n2', pitch: 'G3', solfa: 'm,', duration: 'half', durationBeats: 2, isRest: false, beat: 3, lyric: 'fast', confidence: 0.94 }
          ]
        },
        {
          measureNumber: 3,
          confidence: 0.93,
          notes: [
            { id: 't-m3-n1', pitch: 'Ab3', solfa: 'f,', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'falls', confidence: 0.93 },
            { id: 't-m3-n2', pitch: 'Bb3', solfa: 's,', duration: 'half', durationBeats: 2, isRest: false, beat: 3, lyric: 'the', confidence: 0.94 }
          ]
        },
        {
          measureNumber: 4,
          confidence: 0.96,
          notes: [
            { id: 't-m4-n1', pitch: 'Bb3', solfa: 's,', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'e - ven -', confidence: 0.96 },
            { id: 't-m4-n2', pitch: 'Bb3', solfa: 's,', duration: 'half', durationBeats: 2, isRest: false, beat: 3, lyric: 'tide;', confidence: 0.97 }
          ]
        }
      ]
    },
    {
      id: 'part-bass',
      name: 'Bass',
      shortName: 'B',
      clef: 'bass',
      color: '#4ADE80',
      measures: [
        {
          measureNumber: 1,
          confidence: 0.97,
          notes: [
            { id: 'b-m1-n1', pitch: 'Eb3', solfa: 'd,', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'A -', confidence: 0.98 },
            { id: 'b-m1-n2', pitch: 'G2', solfa: 'm,,', duration: 'quarter', durationBeats: 1, isRest: false, beat: 3, lyric: 'bide', confidence: 0.96 },
            { id: 'b-m1-n3', pitch: 'Ab2', solfa: 'f,,', duration: 'quarter', durationBeats: 1, isRest: false, beat: 4, lyric: 'with', confidence: 0.96 }
          ]
        },
        {
          measureNumber: 2,
          confidence: 0.96,
          notes: [
            { id: 'b-m2-n1', pitch: 'Eb3', solfa: 'd,', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'me;', confidence: 0.97 },
            { id: 'b-m2-n2', pitch: 'Eb3', solfa: 'd,', duration: 'half', durationBeats: 2, isRest: false, beat: 3, lyric: 'fast', confidence: 0.96 }
          ]
        },
        {
          measureNumber: 3,
          confidence: 0.94,
          notes: [
            { id: 'b-m3-n1', pitch: 'Ab2', solfa: 'f,,', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'falls', confidence: 0.94 },
            { id: 'b-m3-n2', pitch: 'G2', solfa: 'm,,', duration: 'half', durationBeats: 2, isRest: false, beat: 3, lyric: 'the', confidence: 0.95 }
          ]
        },
        {
          measureNumber: 4,
          confidence: 0.98,
          notes: [
            { id: 'b-m4-n1', pitch: 'Bb2', solfa: 's,,', duration: 'half', durationBeats: 2, isRest: false, beat: 1, lyric: 'e - ven -', confidence: 0.98 },
            { id: 'b-m4-n2', pitch: 'Eb3', solfa: 'd,', duration: 'half', durationBeats: 2, isRest: false, beat: 3, lyric: 'tide;', confidence: 0.99 }
          ]
        }
      ]
    }
  ]
};

// Studio Project Demo
export const DEMO_STUDIO_PROJECT: StudioProject = {
  id: 'studio-midnight-session',
  title: 'Midnight in Lagos (Studio Session)',
  bpm: 104,
  key: 'F# Minor',
  timeSignature: '4/4',
  sourceType: 'create',
  sourceId: 'song-midnight-lagos',
  updatedAt: '2026-09-15T11:40:00Z',
  effects: {
    eqLow: 2,
    eqMid: -1,
    eqHigh: 3,
    reverbMix: 0.25,
    delayTime: 0.35,
    delayFeedback: 0.3,
    compression: 0.4
  },
  tracks: [
    {
      id: 'trk-drums',
      name: 'Afrobeat Drums & Shekere',
      type: 'drums',
      color: '#F87171',
      muted: false,
      soloed: false,
      volume: 0.85,
      pan: 0,
      clips: [
        { id: 'c-drm-1', trackId: 'trk-drums', name: 'Groove Loop 01', startMeasure: 1, lengthMeasures: 4 },
        { id: 'c-drm-2', trackId: 'trk-drums', name: 'Groove Loop 02', startMeasure: 5, lengthMeasures: 4 },
        { id: 'c-drm-3', trackId: 'trk-drums', name: 'Chorus Roll', startMeasure: 9, lengthMeasures: 4 },
        { id: 'c-drm-4', trackId: 'trk-drums', name: 'Groove Loop 02', startMeasure: 13, lengthMeasures: 4 }
      ]
    },
    {
      id: 'trk-bass',
      name: 'Sub 808 Bass',
      type: 'bass',
      color: '#FBBF24',
      muted: false,
      soloed: false,
      volume: 0.8,
      pan: 0,
      clips: [
        { id: 'c-bass-1', trackId: 'trk-bass', name: 'Low F# Root', startMeasure: 1, lengthMeasures: 4 },
        { id: 'c-bass-2', trackId: 'trk-bass', name: 'Walking Groove', startMeasure: 5, lengthMeasures: 4 },
        { id: 'c-bass-3', trackId: 'trk-bass', name: 'Sub Drop', startMeasure: 9, lengthMeasures: 4 }
      ]
    },
    {
      id: 'trk-keys',
      name: 'Warm Rhodes & Kalimba',
      type: 'piano',
      color: '#67E8F9',
      muted: false,
      soloed: false,
      volume: 0.75,
      pan: -0.2,
      clips: [
        { id: 'c-keys-1', trackId: 'trk-keys', name: 'Intro Chords', startMeasure: 1, lengthMeasures: 4 },
        { id: 'c-keys-2', trackId: 'trk-keys', name: 'Kalimba Arp', startMeasure: 5, lengthMeasures: 4 },
        { id: 'c-keys-3', trackId: 'trk-keys', name: 'Wide Chords', startMeasure: 9, lengthMeasures: 4 }
      ]
    },
    {
      id: 'trk-lead',
      name: 'Lead Vocals (Generated)',
      type: 'vocals',
      color: '#8B5CF6',
      muted: false,
      soloed: false,
      volume: 0.9,
      pan: 0,
      clips: [
        { id: 'c-voc-1', trackId: 'trk-lead', name: 'Verse 1 Stems', startMeasure: 5, lengthMeasures: 4 },
        { id: 'c-voc-2', trackId: 'trk-lead', name: 'Chorus Main', startMeasure: 9, lengthMeasures: 4 }
      ]
    },
    {
      id: 'trk-choir',
      name: 'Vocal Harmonies & Pad',
      type: 'choir',
      color: '#A78BFA',
      muted: false,
      soloed: false,
      volume: 0.65,
      pan: 0.3,
      clips: [
        { id: 'c-choir-1', trackId: 'trk-choir', name: 'Stereo Pad', startMeasure: 5, lengthMeasures: 4 },
        { id: 'c-choir-2', trackId: 'trk-choir', name: 'SATB Harmonies', startMeasure: 9, lengthMeasures: 4 }
      ]
    }
  ]
};

// Initial Library items
export const INITIAL_LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: 'lib-1',
    title: 'Midnight in Lagos',
    type: 'song',
    subtitle: 'Afrobeats • Emotional • 104 BPM',
    meta: '2:48 • F# Minor',
    tags: ['Afrobeats', 'Emotional', 'Male Voice'],
    favorite: true,
    date: '2 hours ago',
    originalRefId: 'song-midnight-lagos'
  },
  {
    id: 'lib-2',
    title: 'Abide With Me (Eventide)',
    type: 'score',
    subtitle: 'SATB Choir • 4 Parts • W. H. Monk',
    meta: '4 Measures • Eb Major • 76 BPM',
    tags: ['SATB', 'Choir', 'Hymn', 'Scanned'],
    favorite: true,
    date: 'Yesterday',
    originalRefId: 'score-abide-with-me'
  },
  {
    id: 'lib-3',
    title: 'Midnight in Lagos (Studio Session)',
    type: 'studio',
    subtitle: '5 Tracks • 16 Measures',
    meta: '104 BPM • F# Minor',
    tags: ['Studio', 'Multitrack', 'Drums', 'Vocals'],
    favorite: false,
    date: 'Today',
    originalRefId: 'studio-midnight-session'
  },
  {
    id: 'lib-4',
    title: 'Sanctuary of Light',
    type: 'song',
    subtitle: 'Gospel / R&B • Inspirational • 82 BPM',
    meta: '3:15 • Bb Major',
    tags: ['Gospel', 'Duet', 'Inspirational'],
    favorite: false,
    date: '3 days ago',
    originalRefId: 'song-sanctuary'
  }
];
