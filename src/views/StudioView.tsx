import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Circle, Square, RotateCcw, Volume2, Sliders, Music, 
  Plus, Trash2, SlidersHorizontal, Settings2, Download, Check, Save,
  Maximize2, ZoomIn, ZoomOut, Layers, ChevronRight, Activity
} from 'lucide-react';
import { StudioProject, StudioTrack, StudioClip } from '../types';
import { audioEngine, SynthInstrument } from '../services/audioEngine';
import { storageService } from '../services/storageService';
import { Button } from '../components/common/Button';

interface StudioViewProps {
  project: StudioProject;
  onSaveProject: (project: StudioProject) => void;
}

type MobileStudioTab = 'timeline' | 'instrument' | 'mixer';

const PIANO_KEYS = [
  { pitch: 'C4', isBlack: false },
  { pitch: 'C#4', isBlack: true },
  { pitch: 'D4', isBlack: false },
  { pitch: 'D#4', isBlack: true },
  { pitch: 'E4', isBlack: false },
  { pitch: 'F4', isBlack: false },
  { pitch: 'F#4', isBlack: true },
  { pitch: 'G4', isBlack: false },
  { pitch: 'G#4', isBlack: true },
  { pitch: 'A4', isBlack: false },
  { pitch: 'A#4', isBlack: true },
  { pitch: 'B4', isBlack: false },
  { pitch: 'C5', isBlack: false },
  { pitch: 'C#5', isBlack: true },
  { pitch: 'D5', isBlack: false },
  { pitch: 'D#5', isBlack: true },
  { pitch: 'E5', isBlack: false }
];

export const StudioView: React.FC<StudioViewProps> = ({
  project: initialProject,
  onSaveProject
}) => {
  const [project, setProject] = useState<StudioProject>(initialProject);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [metronomeOn, setMetronomeOn] = useState(false);
  
  // Timeline playback tracking
  const [playheadMeasure, setPlayheadMeasure] = useState<number>(1);
  const [playheadBeat, setPlayheadBeat] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  
  // Selection
  const [selectedTrackId, setSelectedTrackId] = useState<string>(project.tracks[0]?.id || '');
  const [selectedClipId, setSelectedClipId] = useState<string>('');
  
  // Mobile focus tab: Timeline / Instrument / Mixer
  const [mobileTab, setMobileTab] = useState<MobileStudioTab>('timeline');
  const [showInspector, setShowInspector] = useState(true);

  const selectedTrack = project.tracks.find(t => t.id === selectedTrackId) || project.tracks[0];

  useEffect(() => {
    setProject(initialProject);
    if (initialProject.tracks.length > 0) {
      setSelectedTrackId(initialProject.tracks[0].id);
    }
  }, [initialProject]);

  // Studio Timeline Tick Engine
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      const beatMs = (60 / project.bpm) * 1000;

      interval = setInterval(() => {
        // Metronome click
        if (metronomeOn) {
          audioEngine.playMetronomeTick(playheadBeat === 1);
        }

        // Audition selected clip/notes if playing
        if (playheadBeat === 1) {
          audioEngine.playNote('F#3', 0.8, 'synth');
        }

        setPlayheadBeat(prevBeat => {
          if (prevBeat >= 4) {
            setPlayheadMeasure(prevMeasure => {
              if (prevMeasure >= 16) {
                return 1;
              }
              return prevMeasure + 1;
            });
            return 1;
          }
          return prevBeat + 1;
        });
      }, beatMs);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, project.bpm, metronomeOn, playheadBeat]);

  const togglePlayback = () => {
    if (isPlaying) {
      audioEngine.stopAll();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const toggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsPlaying(false);
    } else {
      setIsRecording(true);
      setIsPlaying(true);
    }
  };

  const rewind = () => {
    setPlayheadMeasure(1);
    setPlayheadBeat(1);
  };

  // Track manipulation
  const toggleMuteTrack = (trackId: string) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t)
    }));
  };

  const toggleSoloTrack = (trackId: string) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, soloed: !t.soloed } : t)
    }));
  };

  const setTrackVolume = (trackId: string, vol: number) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, volume: vol } : t)
    }));
  };

  const setTrackPan = (trackId: string, pan: number) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, pan: pan } : t)
    }));
  };

  const addTrack = () => {
    const newTrack: StudioTrack = {
      id: 'trk-' + Date.now(),
      name: `Track ${project.tracks.length + 1} (Synth)`,
      type: 'synth',
      color: '#67E8F9',
      muted: false,
      soloed: false,
      volume: 0.8,
      pan: 0,
      clips: [
        {
          id: 'clip-' + Date.now(),
          trackId: 'trk-' + Date.now(),
          name: 'New Pattern',
          startMeasure: 1,
          lengthMeasures: 4
        }
      ]
    };
    setProject(prev => ({ ...prev, tracks: [...prev.tracks, newTrack] }));
    setSelectedTrackId(newTrack.id);
  };

  const deleteTrack = (trackId: string) => {
    if (project.tracks.length <= 1) return;
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== trackId)
    }));
  };

  const handleSave = () => {
    storageService.saveStudioProject(project);
    onSaveProject(project);
  };

  // Virtual Keyboard play
  const handleKeyTrigger = (pitch: string) => {
    audioEngine.playNote(pitch, 0.7, selectedTrack?.type === 'choir' ? 'choir' : 'piano');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#09090B] text-[#F4F1EA] select-none overflow-hidden">
      {/* ================= TOP STUDIO TRANSPORT / PROJECT BAR ================= */}
      <div className="h-14 border-b border-[#27272D] bg-[#111114] px-4 flex items-center justify-between gap-4 shrink-0 z-20">
        {/* Left: Project title & save indicator */}
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm font-bold text-[#F4F1EA] truncate">
            {project.title}
          </h2>
          <span className="hidden sm:inline-block text-[11px] font-mono text-[#6E6E77]">
            {project.timeSignature} • {project.key}
          </span>
        </div>

        {/* Center: Play, Record, Time counter, Metronome */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={rewind}
            className="p-1.5 text-[#9A9AA3] hover:text-[#F4F1EA] rounded-lg hover:bg-[#18181D]"
            title="Return to Zero"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={togglePlayback}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
              isPlaying ? 'bg-[#8B5CF6] text-white shadow-md' : 'bg-[#18181D] hover:bg-[#27272D] text-[#F4F1EA] border border-[#27272D]'
            }`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
          </button>

          <button
            onClick={toggleRecord}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
              isRecording ? 'bg-[#EF4444] text-white animate-pulse' : 'bg-[#18181D] hover:bg-[#27272D] text-[#EF4444] border border-[#27272D]'
            }`}
            title="Record Audio / MIDI"
          >
            <Circle size={15} fill={isRecording ? 'white' : 'currentColor'} />
          </button>

          {/* Time / Measure Display */}
          <div className="bg-[#09090B] border border-[#27272D] px-3 py-1 rounded-xl font-mono text-xs flex items-center gap-1.5">
            <span className="text-[#A78BFA] font-bold">
              {playheadMeasure.toString().padStart(2, '0')}
            </span>
            <span className="text-[#6E6E77]">:</span>
            <span className="text-[#F4F1EA]">
              {playheadBeat.toString().padStart(2, '0')}
            </span>
            <span className="text-[#6E6E77] hidden md:inline">: 00</span>
          </div>

          {/* Metronome toggle */}
          <button
            onClick={() => setMetronomeOn(!metronomeOn)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
              metronomeOn 
                ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#A78BFA]' 
                : 'bg-[#18181D] border-[#27272D] text-[#9A9AA3] hover:text-[#F4F1EA]'
            }`}
            title="Toggle Metronome Click"
          >
            CLICK
          </button>

          {/* BPM Control */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-[#9A9AA3] pl-2 border-l border-[#27272D]">
            <span>BPM</span>
            <input
              type="number"
              min={50}
              max={220}
              value={project.bpm}
              onChange={e => setProject(p => ({ ...p, bpm: Number(e.target.value) }))}
              className="w-14 bg-[#09090B] border border-[#27272D] rounded px-1.5 py-0.5 text-center text-[#F4F1EA] font-bold"
            />
          </div>
        </div>

        {/* Right: Save & Export */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSave}
            icon={<Save size={14} />}
          >
            Save
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => alert('Exporting multitrack master (WAV 24-bit 48kHz)...')}
            icon={<Download size={14} />}
            className="hidden sm:inline-flex"
          >
            Export
          </Button>
        </div>
      </div>

      {/* ================= MOBILE FOCUS TAB SWITCHER (Guiding rule: Mobile gets focus) ================= */}
      <div className="md:hidden flex items-center border-b border-[#27272D] bg-[#111114] text-xs font-mono font-semibold">
        <button
          onClick={() => setMobileTab('timeline')}
          className={`flex-1 py-2.5 text-center transition-colors ${
            mobileTab === 'timeline' ? 'bg-[#18181D] text-[#8B5CF6] border-b-2 border-[#8B5CF6]' : 'text-[#9A9AA3]'
          }`}
        >
          TIMELINE
        </button>
        <button
          onClick={() => setMobileTab('instrument')}
          className={`flex-1 py-2.5 text-center transition-colors ${
            mobileTab === 'instrument' ? 'bg-[#18181D] text-[#8B5CF6] border-b-2 border-[#8B5CF6]' : 'text-[#9A9AA3]'
          }`}
        >
          KEYS / SYNTH
        </button>
        <button
          onClick={() => setMobileTab('mixer')}
          className={`flex-1 py-2.5 text-center transition-colors ${
            mobileTab === 'mixer' ? 'bg-[#18181D] text-[#8B5CF6] border-b-2 border-[#8B5CF6]' : 'text-[#9A9AA3]'
          }`}
        >
          MIXER
        </button>
      </div>

      {/* ================= MAIN WORKSPACE BODY ================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ================= DESKTOP TIMELINE CANVAS & HEADERS ================= */}
        <div className={`flex-1 flex flex-col overflow-hidden ${mobileTab !== 'timeline' ? 'hidden md:flex' : 'flex'}`}>
          {/* Timeline zoom & Add Track bar */}
          <div className="h-10 border-b border-[#27272D] bg-[#111114] px-4 flex items-center justify-between text-xs font-mono text-[#9A9AA3]">
            <div className="flex items-center gap-3">
              <button
                onClick={addTrack}
                className="flex items-center gap-1.5 text-xs text-[#8B5CF6] hover:text-[#A78BFA] cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Track</span>
              </button>
              <span className="text-[#6E6E77]">•</span>
              <span>{project.tracks.length} Active Tracks</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(Math.max(0.75, zoomLevel - 0.25))}
                className="p-1 hover:text-[#F4F1EA]"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span>{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                className="p-1 hover:text-[#F4F1EA]"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>

          {/* Multitrack Scrollable Canvas */}
          <div className="flex-1 flex overflow-auto relative">
            {/* Left Track Headers (Width: 220px) */}
            <div className="w-56 shrink-0 bg-[#09090B] border-r border-[#27272D] flex flex-col z-10 sticky left-0">
              {/* Measure ruler header spacer */}
              <div className="h-8 border-b border-[#27272D] bg-[#111114] px-3 flex items-center text-[10px] font-mono text-[#6E6E77]">
                TRACK HEADERS
              </div>

              {/* Track control strips */}
              {project.tracks.map(track => {
                const isSelected = selectedTrackId === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => setSelectedTrackId(track.id)}
                    className={`h-20 border-b border-[#27272D] p-2.5 flex flex-col justify-between transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#18181D] border-l-4 border-l-[#8B5CF6]' : 'bg-[#09090B] hover:bg-[#111114]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F4F1EA] truncate" title={track.name}>
                        {track.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTrack(track.id);
                        }}
                        className="opacity-0 hover:opacity-100 text-[#6E6E77] hover:text-[#EF4444] p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Mute Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMuteTrack(track.id);
                        }}
                        className={`w-5 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center cursor-pointer ${
                          track.muted ? 'bg-[#EF4444] text-white' : 'bg-[#18181D] text-[#9A9AA3] hover:text-[#F4F1EA]'
                        }`}
                        title="Mute Track"
                      >
                        M
                      </button>

                      {/* Solo Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSoloTrack(track.id);
                        }}
                        className={`w-5 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center cursor-pointer ${
                          track.soloed ? 'bg-[#FBBF24] text-black' : 'bg-[#18181D] text-[#9A9AA3] hover:text-[#F4F1EA]'
                        }`}
                        title="Solo Track"
                      >
                        S
                      </button>

                      {/* Volume slider */}
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={track.volume}
                        onChange={(e) => {
                          e.stopPropagation();
                          setTrackVolume(track.id, parseFloat(e.target.value));
                        }}
                        className="w-16 accent-[#8B5CF6] h-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Timeline Grid Canvas */}
            <div 
              className="flex-1 flex flex-col relative min-w-[800px]"
              style={{ width: `${16 * 80 * zoomLevel}px` }}
            >
              {/* Measure Number Ruler */}
              <div className="h-8 border-b border-[#27272D] bg-[#111114] flex sticky top-0 z-10">
                {Array.from({ length: 16 }).map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPlayheadMeasure(idx + 1)}
                    className="flex-1 border-r border-[#27272D]/60 px-1 flex items-center text-[10px] font-mono text-[#6E6E77] cursor-pointer hover:bg-[#18181D]"
                  >
                    0{idx + 1}
                  </div>
                ))}
              </div>

              {/* Multitrack clip lanes */}
              {project.tracks.map(track => (
                <div
                  key={track.id}
                  className="h-20 border-b border-[#27272D]/50 relative flex items-center px-1"
                >
                  {/* Grid beat vertical guide lines */}
                  <div className="absolute inset-0 grid grid-cols-16 pointer-events-none opacity-20">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="border-r border-[#27272D]" />
                    ))}
                  </div>

                  {/* Audio / MIDI Clips */}
                  {track.clips.map(clip => {
                    const widthPercent = (clip.lengthMeasures / 16) * 100;
                    const leftPercent = ((clip.startMeasure - 1) / 16) * 100;

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(clip.id);
                          setSelectedTrackId(track.id);
                        }}
                        className="absolute h-14 rounded-xl border p-2 flex flex-col justify-between cursor-pointer transition-all shadow-sm"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          backgroundColor: `${track.color}22`,
                          borderColor: track.color
                        }}
                      >
                        <span className="text-[11px] font-bold font-mono truncate" style={{ color: track.color }}>
                          {clip.name}
                        </span>
                        <div className="flex items-center gap-1 opacity-60">
                          <Activity size={12} style={{ color: track.color }} />
                          <span className="text-[9px] font-mono text-[#F4F1EA]">
                            {clip.lengthMeasures} Bars
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Dynamic Violet Playhead Indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#8B5CF6] z-20 pointer-events-none transition-all duration-100"
                style={{
                  left: `${((playheadMeasure - 1 + (playheadBeat - 1) / 4) / 16) * 100}%`
                }}
              >
                <div className="w-3 h-3 bg-[#8B5CF6] rounded-full -ml-[5px] -mt-1 shadow-md" />
              </div>
            </div>
          </div>
        </div>

        {/* ================= MOBILE INSTRUMENT / PIANO KEYS TAB ================= */}
        {mobileTab === 'instrument' && (
          <div className="md:hidden flex-1 flex flex-col justify-between p-4 bg-[#111114]">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272D]">
              <div>
                <span className="text-xs font-mono text-[#A78BFA]">PLAYABLE SYNTHESIZER</span>
                <h4 className="text-sm font-bold text-[#F4F1EA]">{selectedTrack?.name}</h4>
              </div>
              <span className="text-xs font-mono text-[#67E8F9]">Web Audio Polyphony</span>
            </div>

            {/* Virtual Piano Keyboard */}
            <div className="relative h-48 flex overflow-x-auto py-2">
              {PIANO_KEYS.map((k, i) => (
                <button
                  key={i}
                  onClick={() => handleKeyTrigger(k.pitch)}
                  className={`shrink-0 rounded-b-lg border border-[#27272D] active:scale-95 transition-transform flex flex-col justify-end p-2 cursor-pointer ${
                    k.isBlack 
                      ? 'w-10 h-28 bg-[#18181D] text-white -mx-3 z-10 shadow-lg' 
                      : 'w-14 h-44 bg-[#F4F1EA] text-black z-0 shadow'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold">{k.pitch}</span>
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-[#9A9AA3]">
              Tap any key to audition live synthesized notes directly into the studio.
            </p>
          </div>
        )}

        {/* ================= MOBILE MIXER TAB ================= */}
        {mobileTab === 'mixer' && (
          <div className="md:hidden flex-1 p-4 bg-[#111114] overflow-y-auto space-y-4">
            <h4 className="text-xs font-mono text-[#A78BFA] uppercase">CHANNEL STRIPS</h4>
            {project.tracks.map(track => (
              <div key={track.id} className="p-3 bg-[#18181D] border border-[#27272D] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#F4F1EA]">{track.name}</span>
                  <div className="flex gap-2 font-mono text-xs">
                    <button
                      onClick={() => toggleMuteTrack(track.id)}
                      className={`px-2 py-0.5 rounded ${track.muted ? 'bg-[#EF4444] text-white' : 'bg-[#111114] text-[#9A9AA3]'}`}
                    >
                      MUTE
                    </button>
                    <button
                      onClick={() => toggleSoloTrack(track.id)}
                      className={`px-2 py-0.5 rounded ${track.soloed ? 'bg-[#FBBF24] text-black' : 'bg-[#111114] text-[#9A9AA3]'}`}
                    >
                      SOLO
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Volume2 size={16} className="text-[#9A9AA3]" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={track.volume}
                    onChange={e => setTrackVolume(track.id, parseFloat(e.target.value))}
                    className="flex-1 accent-[#8B5CF6]"
                  />
                  <span className="text-xs font-mono text-[#9A9AA3] w-8 text-right">
                    {Math.round(track.volume * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= DESKTOP CONTEXTUAL RIGHT INSPECTOR (EFFECTS & PROPERTIES) ================= */}
        <div className="hidden lg:flex flex-col w-72 shrink-0 border-l border-[#27272D] bg-[#111114] p-4 space-y-6 overflow-y-auto">
          <div>
            <span className="text-[10px] font-mono uppercase text-[#A78BFA] tracking-wider font-semibold">
              TRACK INSPECTOR
            </span>
            <h3 className="text-base font-bold text-[#F4F1EA] truncate mt-1">
              {selectedTrack?.name}
            </h3>
            <span className="text-xs text-[#9A9AA3] font-mono">
              Type: {selectedTrack?.type.toUpperCase()}
            </span>
          </div>

          {/* Track FX Section */}
          <div className="space-y-4 pt-2 border-t border-[#27272D]/60">
            <span className="text-xs font-mono text-[#F4F1EA] font-semibold flex items-center gap-1.5">
              <Sliders size={14} className="text-[#8B5CF6]" />
              <span>Effects & Dynamics</span>
            </span>

            {/* 3-Band EQ */}
            <div className="space-y-2 bg-[#18181D] p-3 rounded-xl border border-[#27272D]">
              <span className="text-[11px] font-mono text-[#9A9AA3]">3-BAND EQ</span>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div>
                  <span className="text-[#6E6E77]">LOW</span>
                  <input
                    type="range"
                    min={-6}
                    max={6}
                    value={project.effects.eqLow}
                    onChange={e => setProject(p => ({ ...p, effects: { ...p.effects, eqLow: Number(e.target.value) } }))}
                    className="w-full accent-[#8B5CF6]"
                  />
                  <span className="text-[#F4F1EA]">{project.effects.eqLow} dB</span>
                </div>
                <div>
                  <span className="text-[#6E6E77]">MID</span>
                  <input
                    type="range"
                    min={-6}
                    max={6}
                    value={project.effects.eqMid}
                    onChange={e => setProject(p => ({ ...p, effects: { ...p.effects, eqMid: Number(e.target.value) } }))}
                    className="w-full accent-[#8B5CF6]"
                  />
                  <span className="text-[#F4F1EA]">{project.effects.eqMid} dB</span>
                </div>
                <div>
                  <span className="text-[#6E6E77]">HIGH</span>
                  <input
                    type="range"
                    min={-6}
                    max={6}
                    value={project.effects.eqHigh}
                    onChange={e => setProject(p => ({ ...p, effects: { ...p.effects, eqHigh: Number(e.target.value) } }))}
                    className="w-full accent-[#8B5CF6]"
                  />
                  <span className="text-[#F4F1EA]">{project.effects.eqHigh} dB</span>
                </div>
              </div>
            </div>

            {/* Reverb & Delay */}
            <div className="space-y-3 bg-[#18181D] p-3 rounded-xl border border-[#27272D] text-xs font-mono">
              <div>
                <div className="flex justify-between text-[#9A9AA3] mb-1">
                  <span>Reverb Space</span>
                  <span className="text-[#F4F1EA]">{Math.round(project.effects.reverbMix * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={project.effects.reverbMix}
                  onChange={e => setProject(p => ({ ...p, effects: { ...p.effects, reverbMix: parseFloat(e.target.value) } }))}
                  className="w-full accent-[#8B5CF6]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#9A9AA3] mb-1">
                  <span>Delay Feedback</span>
                  <span className="text-[#F4F1EA]">{Math.round(project.effects.delayFeedback * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.8}
                  step={0.05}
                  value={project.effects.delayFeedback}
                  onChange={e => setProject(p => ({ ...p, effects: { ...p.effects, delayFeedback: parseFloat(e.target.value) } }))}
                  className="w-full accent-[#8B5CF6]"
                />
              </div>
            </div>
          </div>

          {/* Virtual Keyboard Preview */}
          <div className="space-y-2 pt-2 border-t border-[#27272D]/60">
            <span className="text-xs font-mono text-[#9A9AA3]">AUDITION KEYS</span>
            <div className="flex gap-1">
              {['C4', 'E4', 'G4', 'B4', 'C5'].map(pitch => (
                <button
                  key={pitch}
                  onClick={() => handleKeyTrigger(pitch)}
                  className="flex-1 py-3 bg-[#18181D] hover:bg-[#8B5CF6] hover:text-white rounded-lg border border-[#27272D] text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  {pitch}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
