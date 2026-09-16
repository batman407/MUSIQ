import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Pause, RotateCcw, Sliders, Music, Check, Download, Edit3, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { GeneratedSong, GenreType, MoodType, VoiceType, StudioProject } from '../types';
import { aiSongService, GenerationProgress } from '../services/aiSongService';
import { audioEngine } from '../services/audioEngine';
import { storageService } from '../services/storageService';
import { Button } from '../components/common/Button';
import { WaveformVisualizer } from '../components/common/WaveformVisualizer';
import { MusiqMark } from '../components/brand/MusiqLogo';

interface CreateViewProps {
  currentSong: GeneratedSong | null;
  onSongGenerated: (song: GeneratedSong) => void;
  onOpenInStudio: (project: StudioProject) => void;
}

const GENRES: GenreType[] = [
  'Afrobeats', 'R&B', 'Amapiano', 'Gospel', 'Hip-Hop', 'Pop', 
  'Soul', 'Dancehall', 'Trap', 'Highlife', 'Jazz', 'Classical', 'Rock'
];

const MOODS: MoodType[] = [
  'Emotional', 'Energetic', 'Melancholic', 'Peaceful', 'Inspirational', 
  'Dark', 'Romantic', 'Happy', 'Aggressive'
];

const VOICES: VoiceType[] = [
  'Male', 'Female', 'Duet', 'Choir', 'Instrumental'
];

export const CreateView: React.FC<CreateViewProps> = ({
  currentSong,
  onSongGenerated,
  onOpenInStudio
}) => {
  // Input form state
  const [title, setTitle] = useState(currentSong?.title || '');
  const [idea, setIdea] = useState(currentSong?.prompt || '');
  const [selectedGenre, setSelectedGenre] = useState<GenreType>(currentSong?.genre || 'Afrobeats');
  const [selectedMood, setSelectedMood] = useState<MoodType>(currentSong?.mood || 'Emotional');
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>(currentSong?.voice || 'Male');
  
  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bpm, setBpm] = useState<number>(currentSong?.tempo || 104);
  const [musicalKey, setMusicalKey] = useState<string>(currentSong?.key || 'F# Minor');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState<GenerationProgress | null>(null);

  // Active generated song playback
  const [song, setSong] = useState<GeneratedSong | null>(currentSong);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<string>('sec-intro');

  // Lyric editing state
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState<string>('');

  useEffect(() => {
    if (currentSong) {
      setSong(currentSong);
      setTitle(currentSong.title);
      setIdea(currentSong.prompt);
      setSelectedGenre(currentSong.genre);
      setSelectedMood(currentSong.mood);
      setSelectedVoice(currentSong.voice);
      setBpm(currentSong.tempo);
      setMusicalKey(currentSong.key);
    }
  }, [currentSong]);

  // Audio simulated playback ticker
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && song) {
      interval = setInterval(() => {
        setPlaybackProgress(prev => {
          const next = prev + 0.005;
          if (next >= 1) {
            setIsPlaying(false);
            return 0;
          }
          // Update active lyric section based on progress
          const currentSecTime = next * song.durationSeconds;
          const found = song.sections.find(s => currentSecTime >= s.startTime && currentSecTime <= s.endTime);
          if (found) setActiveSectionId(found.id);

          return next;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, song]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setIsGenerating(true);
    try {
      const result = await aiSongService.generateSong(
        {
          title,
          prompt: idea,
          genre: selectedGenre,
          mood: selectedMood,
          voice: selectedVoice,
          tempo: bpm,
          key: musicalKey
        },
        progress => setGenProgress(progress)
      );

      setSong(result);
      storageService.saveSong(result);
      onSongGenerated(result);
      setIsPlaying(true);
      setPlaybackProgress(0);

      // Play introductory musical chime preview with Web Audio
      audioEngine.playNote('F#4', 0.6, 'synth');
      setTimeout(() => audioEngine.playNote('A4', 0.6, 'synth'), 150);
      setTimeout(() => audioEngine.playNote('C#5', 0.8, 'synth'), 300);
    } finally {
      setIsGenerating(false);
      setGenProgress(null);
    }
  };

  const togglePlay = () => {
    if (!song) return;
    if (!isPlaying) {
      // Trigger Web Audio chord
      audioEngine.playNote('F#3', 1.2, 'synth');
      audioEngine.playNote('A3', 1.2, 'synth');
      audioEngine.playNote('C#4', 1.2, 'synth');
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (ratio: number) => {
    setPlaybackProgress(ratio);
    if (song) {
      const currentSecTime = ratio * song.durationSeconds;
      const found = song.sections.find(s => currentSecTime >= s.startTime && currentSecTime <= s.endTime);
      if (found) setActiveSectionId(found.id);
    }
  };

  // Open this generated song seamlessly in MUSIQ Studio
  const handleOpenStudio = () => {
    if (!song) return;
    const studioProject: StudioProject = {
      id: `studio-${song.id}`,
      title: `${song.title} (Studio Session)`,
      bpm: song.tempo,
      key: song.key,
      timeSignature: '4/4',
      sourceType: 'create',
      sourceId: song.id,
      updatedAt: new Date().toISOString(),
      effects: {
        eqLow: 2,
        eqMid: -1,
        eqHigh: 2,
        reverbMix: 0.25,
        delayTime: 0.35,
        delayFeedback: 0.25,
        compression: 0.4
      },
      tracks: [
        {
          id: `trk-drums-${song.id}`,
          name: `${song.genre} Drums & Percussion`,
          type: 'drums',
          color: '#F87171',
          muted: false,
          soloed: false,
          volume: 0.85,
          pan: 0,
          clips: [
            { id: 'c-d1', trackId: `trk-drums-${song.id}`, name: 'Groove Main', startMeasure: 1, lengthMeasures: 4 },
            { id: 'c-d2', trackId: `trk-drums-${song.id}`, name: 'Groove Chorus', startMeasure: 5, lengthMeasures: 8 }
          ]
        },
        {
          id: `trk-bass-${song.id}`,
          name: 'Bass Stem',
          type: 'bass',
          color: '#FBBF24',
          muted: false,
          soloed: false,
          volume: 0.8,
          pan: 0,
          clips: [
            { id: 'c-b1', trackId: `trk-bass-${song.id}`, name: 'Sub Bass', startMeasure: 1, lengthMeasures: 12 }
          ]
        },
        {
          id: `trk-inst-${song.id}`,
          name: 'Harmony & Keys Stem',
          type: 'piano',
          color: '#67E8F9',
          muted: false,
          soloed: false,
          volume: 0.75,
          pan: -0.2,
          clips: [
            { id: 'c-k1', trackId: `trk-inst-${song.id}`, name: 'Progressions', startMeasure: 1, lengthMeasures: 12 }
          ]
        },
        {
          id: `trk-vox-${song.id}`,
          name: `Lead Vocals (${song.voice})`,
          type: 'vocals',
          color: '#8B5CF6',
          muted: false,
          soloed: false,
          volume: 0.95,
          pan: 0,
          clips: [
            { id: 'c-v1', trackId: `trk-vox-${song.id}`, name: 'Full Vocal Take', startMeasure: 1, lengthMeasures: 12 }
          ]
        }
      ]
    };

    storageService.saveStudioProject(studioProject);
    onOpenInStudio(studioProject);
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="text-xs font-mono uppercase tracking-widest text-[#A78BFA] flex items-center gap-2">
          <Sparkles size={14} className="text-[#8B5CF6]" />
          <span>MUSIQ CREATE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA]">
          What should we make?
        </h2>
        <p className="text-xs sm:text-sm text-[#9A9AA3]">
          Turn a title, prompt, random words, gibberish, feeling, or idea into a complete arranged song.
        </p>
      </div>

      {/* Main Creation Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 bg-[#111114] border border-[#27272D] rounded-2xl p-5 sm:p-7 space-y-6">
          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Title (Optional) */}
            <div>
              <label className="block text-xs font-medium text-[#9A9AA3] mb-1.5">
                Song Title <span className="text-[#6E6E77]">(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Midnight in Lagos"
                className="w-full bg-[#18181D] border border-[#27272D] focus:border-[#8B5CF6] rounded-xl px-4 py-2.5 text-sm text-[#F4F1EA] placeholder-[#6E6E77] focus:outline-none transition-colors"
              />
            </div>

            {/* Prompt / Idea textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#F4F1EA]">
                  Your Concept, Words, or Feeling
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTitle('Midnight in Lagos');
                    setIdea('I dey hustle every day but nobody knows what I sacrifice. One day I\'ll make it.');
                    setSelectedGenre('Afrobeats');
                    setSelectedMood('Emotional');
                    setSelectedVoice('Male');
                  }}
                  className="text-[11px] text-[#A78BFA] hover:underline cursor-pointer font-mono"
                >
                  Load Lagos Example
                </button>
              </div>
              <textarea
                required
                rows={3}
                value={idea}
                onChange={e => setIdea(e.target.value)}
                placeholder="Type a full concept, one sentence, a title, a few words, or gibberish..."
                className="w-full bg-[#18181D] border border-[#27272D] focus:border-[#8B5CF6] rounded-xl p-3.5 text-sm text-[#F4F1EA] placeholder-[#6E6E77] focus:outline-none resize-none transition-colors"
              />
            </div>

            {/* Genre selection chips */}
            <div>
              <label className="block text-xs font-medium text-[#9A9AA3] mb-2">
                Genre
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      selectedGenre === genre
                        ? 'bg-[#8B5CF6] text-white shadow-sm'
                        : 'bg-[#18181D] text-[#9A9AA3] border border-[#27272D] hover:border-[#383842] hover:text-[#F4F1EA]'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood selection pills */}
            <div>
              <label className="block text-xs font-medium text-[#9A9AA3] mb-2">
                Mood
              </label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(mood => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setSelectedMood(mood)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      selectedMood === mood
                        ? 'bg-[#8B5CF6] text-white shadow-sm'
                        : 'bg-[#18181D] text-[#9A9AA3] border border-[#27272D] hover:border-[#383842] hover:text-[#F4F1EA]'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Vocal arrangement */}
            <div>
              <label className="block text-xs font-medium text-[#9A9AA3] mb-2">
                Voice Delivery
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {VOICES.map(voice => (
                  <button
                    key={voice}
                    type="button"
                    onClick={() => setSelectedVoice(voice)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                      selectedVoice === voice
                        ? 'bg-[#8B5CF6] text-white'
                        : 'bg-[#18181D] text-[#9A9AA3] border border-[#27272D] hover:border-[#383842] hover:text-[#F4F1EA]'
                    }`}
                  >
                    {voice}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings (Hidden by default) */}
            <div className="pt-2 border-t border-[#27272D]/60">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-xs text-[#9A9AA3] hover:text-[#F4F1EA] py-1 cursor-pointer"
              >
                <span>Advanced Musical Parameters</span>
                {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-2 gap-4 mt-3 pt-2">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#9A9AA3] mb-1">
                      <span>Tempo (BPM)</span>
                      <span className="font-mono text-[#F4F1EA]">{bpm}</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={160}
                      value={bpm}
                      onChange={e => setBpm(Number(e.target.value))}
                      className="w-full accent-[#8B5CF6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#9A9AA3] mb-1">Musical Key</label>
                    <select
                      value={musicalKey}
                      onChange={e => setMusicalKey(e.target.value)}
                      className="w-full bg-[#18181D] border border-[#27272D] rounded-xl px-3 py-1.5 text-xs text-[#F4F1EA] focus:border-[#8B5CF6] focus:outline-none"
                    >
                      <option value="F# Minor">F# Minor</option>
                      <option value="C Major">C Major</option>
                      <option value="A Minor">A Minor</option>
                      <option value="Eb Major">Eb Major</option>
                      <option value="G Minor">G Minor</option>
                      <option value="Bb Major">Bb Major</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Generate Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isGenerating || !idea.trim()}
                icon={isGenerating ? <MusiqMark size={20} isAnimated /> : <Sparkles size={18} />}
              >
                {isGenerating ? 'Synthesizing Arrangement...' : 'Generate Song'}
              </Button>
            </div>
          </form>

          {/* Processing State Indicator */}
          {isGenerating && genProgress && (
            <div className="p-4 rounded-xl bg-[#18181D] border border-[#8B5CF6]/40 flex items-center gap-4 animate-in fade-in duration-200">
              <MusiqMark size={32} isAnimated />
              <div className="space-y-0.5">
                <div className="text-xs font-mono uppercase text-[#A78BFA] font-semibold">
                  {genProgress.stage}
                </div>
                <div className="text-sm text-[#F4F1EA]">
                  {genProgress.message}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Area: 5 cols — Resulting Song Player & Lyrics */}
        <div className="lg:col-span-5 space-y-6">
          {song ? (
            <div className="bg-[#111114] border border-[#27272D] rounded-2xl p-5 sm:p-6 space-y-5">
              {/* Artwork & Title Header */}
              <div className="flex items-start gap-4">
                <img
                  src={song.artworkUrl}
                  alt={song.title}
                  className="w-20 h-20 rounded-xl object-cover border border-[#27272D] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA] text-[10px] font-mono font-semibold uppercase">
                      {song.genre}
                    </span>
                    <span className="text-[10px] font-mono text-[#9A9AA3]">
                      {song.mood}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#F4F1EA] truncate mt-1">
                    {song.title}
                  </h3>
                  <div className="text-xs text-[#9A9AA3] font-mono mt-0.5">
                    {song.tempo} BPM • {song.key} • {song.voice}
                  </div>
                </div>
              </div>

              {/* Waveform Player */}
              <div className="space-y-2 bg-[#18181D] p-3.5 rounded-xl border border-[#27272D]">
                <WaveformVisualizer
                  peaks={song.waveformPeaks}
                  progress={playbackProgress}
                  isPlaying={isPlaying}
                  onSeek={handleSeek}
                  height={44}
                  isRealtime={isPlaying}
                />

                {/* Transport Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="w-9 h-9 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-sm"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
                    </button>
                    <button
                      onClick={() => handleSeek(0)}
                      className="p-2 text-[#9A9AA3] hover:text-[#F4F1EA] rounded-lg hover:bg-[#111114] transition-colors"
                      title="Rewind to start"
                    >
                      <RotateCcw size={15} />
                    </button>
                  </div>

                  {/* Time counter */}
                  <div className="text-xs font-mono text-[#9A9AA3]">
                    {Math.floor((playbackProgress * song.durationSeconds) / 60)}:
                    {(Math.floor(playbackProgress * song.durationSeconds) % 60).toString().padStart(2, '0')} / {Math.floor(song.durationSeconds / 60)}:
                    {(song.durationSeconds % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* Synchronized Lyrics Sections */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-[#A78BFA] font-semibold">
                    Arranged Sections & Lyrics
                  </span>
                  <button
                    onClick={() => setIsEditingLyrics(!isEditingLyrics)}
                    className="text-[11px] text-[#9A9AA3] hover:text-[#F4F1EA] flex items-center gap-1"
                  >
                    <Edit3 size={12} />
                    <span>{isEditingLyrics ? 'Done' : 'Edit Lyrics'}</span>
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                  {song.sections.map(section => {
                    const isActive = activeSectionId === section.id;

                    return (
                      <div
                        key={section.id}
                        onClick={() => handleSeek(section.startTime / song.durationSeconds)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#18181D] border-[#8B5CF6]/70 violet-glow-sm'
                            : 'bg-[#111114] border-[#27272D]/70 hover:border-[#383842]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                          <span className={`font-semibold ${isActive ? 'text-[#A78BFA]' : 'text-[#9A9AA3]'}`}>
                            {section.name}
                          </span>
                          <span className="text-[10px] text-[#6E6E77]">
                            {Math.floor(section.startTime / 60)}:{(section.startTime % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {section.lyrics.map((line, idx) => (
                            <p
                              key={idx}
                              className={`text-xs leading-relaxed ${
                                isActive ? 'text-[#F4F1EA] font-medium' : 'text-[#9A9AA3]'
                              }`}
                            >
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons: Open in Studio & Download */}
              <div className="pt-2 border-t border-[#27272D]/60 space-y-2.5">
                <Button
                  variant="primary"
                  fullWidth
                  size="md"
                  onClick={handleOpenStudio}
                  icon={<Sliders size={16} />}
                >
                  Open in Studio
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => alert('Exporting stems (Drums, Bass, Instruments, Vocals)...')}
                    icon={<Download size={14} />}
                  >
                    Stems (WAV)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTitle(song.title + ' (Alt)');
                      setIdea(song.prompt + ' with different groove');
                    }}
                    icon={<RotateCcw size={14} />}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#111114] border border-[#27272D] rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#18181D] border border-[#27272D] flex items-center justify-center text-[#9A9AA3] mx-auto">
                <Music size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-[#F4F1EA]">Song Output Canvas</h4>
                <p className="text-xs text-[#9A9AA3] max-w-xs mx-auto">
                  Type an idea or click "Load Lagos Example" and press Generate to produce structured verses, chorus, waveform, and multitrack stems.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
