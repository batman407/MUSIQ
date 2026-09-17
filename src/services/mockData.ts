import { GeneratedSong, StudioProject, LibraryItem } from '../types';

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
