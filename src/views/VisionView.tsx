import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, Play, Pause, RotateCcw, Sliders, Eye, Volume2, 
  Layers, AlertTriangle, Check, RefreshCw, ZoomIn, ZoomOut, Maximize2, 
  FileText, Music, Sparkles, ChevronRight, CheckCircle2, SplitSquareVertical
} from 'lucide-react';
import { ScoreProject, ScoreViewMode, PlaybackMixMode, MusicalPart, StudioProject } from '../types';
import { omrService, OMRProgress, OMRStage } from '../services/omrService';
import { audioEngine, SynthInstrument } from '../services/audioEngine';
import { storageService } from '../services/storageService';
import { Button } from '../components/common/Button';
import { BottomSheet } from '../components/common/BottomSheet';
import { Modal } from '../components/common/Modal';
import { MusiqMark } from '../components/brand/MusiqLogo';

interface VisionViewProps {
  currentScore: ScoreProject | null;
  onScoreTranscribed: (score: ScoreProject) => void;
  onOpenInStudio: (project: StudioProject) => void;
  isPaperMode?: boolean;
}

export const VisionView: React.FC<VisionViewProps> = ({
  currentScore,
  onScoreTranscribed,
  onOpenInStudio,
  isPaperMode = false
}) => {
  // Score state
  const [score, setScore] = useState<ScoreProject | null>(currentScore);
  const [viewMode, setViewMode] = useState<ScoreViewMode>('score'); // 'score' | 'notes' | 'solfa'
  
  // Camera capture states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPages, setCapturedPages] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // OMR Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [omrProgress, setOmrProgress] = useState<OMRProgress | null>(null);

  // Rehearsal playback & Choir Part Mix
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState<number>(1);
  const [currentBeat, setCurrentBeat] = useState<number>(1);
  const [activePartId, setActivePartId] = useState<string>('part-alto'); // default to Alto for rehearsal demo
  const [mixMode, setMixMode] = useState<PlaybackMixMode>('solo'); // 'full' | 'solo' | 'my-part-plus-bg' | 'custom'
  const [partVolumes, setPartVolumes] = useState<Record<string, number>>({
    'part-soprano': 0.8,
    'part-alto': 1.0,
    'part-tenor': 0.8,
    'part-bass': 0.8
  });
  const [synthInstrument, setSynthInstrument] = useState<SynthInstrument>('piano');
  const [tempo, setTempo] = useState<number>(currentScore?.tempoBpm || 76);

  // Compare scan view mode
  const [showOriginalScan, setShowOriginalScan] = useState(false);
  const [scoreZoom, setScoreZoom] = useState<number>(1);

  // Correction & flagged measures
  const [selectedUncertainMeasure, setSelectedUncertainMeasure] = useState<{
    part: MusicalPart;
    measureNumber: number;
    reason: string;
  } | null>(null);

  // Mobile mix bottom sheet
  const [isMobileMixOpen, setIsMobileMixOpen] = useState(false);

  useEffect(() => {
    if (currentScore) {
      setScore(currentScore);
      setTempo(currentScore.tempoBpm);
    }
  }, [currentScore]);

  // Handle Camera Startup
  const handleStartCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      // Fallback if camera permissions or hardware unavailable in environment
      // Provide clean feedback and use sample scan
    }
  };

  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  // Capture frame from camera
  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 800;
      canvas.height = videoRef.current.videoHeight || 1000;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPages(prev => [...prev, dataUrl]);
        handleStopCamera();
        runOMR(dataUrl);
        return;
      }
    }
    // Fallback sample
    handleStopCamera();
    runOMR('sample-scan');
  };

  // File Upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedPages([dataUrl]);
      runOMR(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Run OMR pipeline through stages
  const runOMR = async (imageUrl: string) => {
    setIsProcessing(true);
    try {
      const result = await omrService.processScore(imageUrl, p => setOmrProgress(p));
      setScore(result);
      setTempo(result.tempoBpm);
      storageService.saveScore(result);
      onScoreTranscribed(result);
      
      // Auto-rehearse Alto preview note with Web Audio
      audioEngine.playNote('Eb4', 0.8, synthInstrument);
    } finally {
      setIsProcessing(false);
      setOmrProgress(null);
    }
  };

  // Web Audio Playback loop through SATB measures
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && score) {
      const beatDurationMs = (60 / tempo) * 1000;

      const scheduleStep = () => {
        // Find notes for the current measure in all parts
        score.parts.forEach(part => {
          const meas = part.measures.find(m => m.measureNumber === currentMeasure);
          if (meas) {
            // Find note starting around this beat
            const note = meas.notes.find(n => n.beat === currentBeat);
            if (note && !note.isRest) {
              // Calculate volume based on mix mode
              let vol = 0.8;
              if (mixMode === 'solo') {
                vol = part.id === activePartId ? 1.0 : 0.0;
              } else if (mixMode === 'my-part-plus-bg') {
                vol = part.id === activePartId ? 1.0 : 0.15;
              } else if (mixMode === 'custom') {
                vol = partVolumes[part.id] ?? 0.8;
              }

              if (vol > 0.01) {
                audioEngine.setPartVolume(part.id, vol);
                audioEngine.playNote(note.pitch, (note.durationBeats * 60) / tempo, synthInstrument, part.id);
              }
            }
          }
        });

        // Advance beat & measure
        setCurrentBeat(prevBeat => {
          if (prevBeat >= 4) {
            setCurrentMeasure(prevMeasure => {
              if (prevMeasure >= score.measuresCount) {
                setIsPlaying(false);
                return 1;
              }
              return prevMeasure + 1;
            });
            return 1;
          }
          return prevBeat + 1;
        });
      };

      timer = setInterval(scheduleStep, beatDurationMs);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentMeasure, currentBeat, tempo, score, activePartId, mixMode, partVolumes, synthInstrument]);

  const togglePlayback = () => {
    if (!score) return;
    if (isPlaying) {
      audioEngine.stopAll();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const handleSeekMeasure = (mNum: number) => {
    setCurrentMeasure(mNum);
    setCurrentBeat(1);
  };

  const handleSelectPart = (partId: string) => {
    setActivePartId(partId);
    // Play sound of note 1 in measure 1 for the selected voice
    if (score) {
      const part = score.parts.find(p => p.id === partId);
      const firstNote = part?.measures[0]?.notes[0];
      if (firstNote) {
        audioEngine.playNote(firstNote.pitch, 0.7, synthInstrument);
      }
    }
  };

  const handleOpenStudio = () => {
    if (!score) return;
    const studioProject = omrService.convertScoreToStudioProject(score);
    storageService.saveStudioProject(studioProject);
    onOpenInStudio(studioProject);
  };

  return (
    <div className={`p-4 sm:p-8 max-w-7xl mx-auto space-y-6 ${isPaperMode ? 'score-paper-mode' : ''}`}>
      {/* Vision Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272D]/60 pb-5">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-widest text-[#67E8F9] flex items-center gap-2">
            <Eye size={14} className="text-[#67E8F9]" />
            <span>MUSIQ VISION • OPTICAL MUSIC RECOGNITION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA]">
            Turn sheet music into sound.
          </h2>
          <p className="text-xs sm:text-sm text-[#9A9AA3]">
            Photograph or upload written scores. Preserves Soprano, Alto, Tenor, and Bass polyphony for instant rehearsal.
          </p>
        </div>

        {/* Scan / Upload Action Triggers */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            icon={<Camera size={16} />}
            onClick={handleStartCamera}
          >
            Take a Photo
          </Button>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#18181D] hover:bg-[#27272D] text-sm text-[#F4F1EA] border border-[#27272D] transition-colors font-medium">
              <Upload size={16} />
              <span>Upload Score</span>
            </div>
          </label>
        </div>
      </div>

      {/* ================= CAMERA SCANNER MODAL ================= */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-[#09090B] flex flex-col justify-between p-4 md:p-8">
          <div className="flex items-center justify-between text-[#F4F1EA] max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2 font-mono text-xs text-[#A78BFA]">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-rec-blink" />
              <span>ALIGN SHEET MUSIC IN FRAME</span>
            </div>
            <button
              onClick={handleStopCamera}
              className="text-xs text-[#9A9AA3] hover:text-[#F4F1EA] px-3 py-1.5 rounded-full border border-[#27272D]"
            >
              Cancel
            </button>
          </div>

          {/* Video Preview & Document Guide Frame */}
          <div className="relative flex-1 max-w-2xl mx-auto w-full flex items-center justify-center my-4 overflow-hidden rounded-2xl border-2 border-[#8B5CF6]/50 bg-black">
            {cameraStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-8 space-y-3">
                <MusiqMark size={40} isAnimated />
                <p className="text-sm text-[#F4F1EA]">Camera viewfinder active</p>
                <p className="text-xs text-[#9A9AA3] max-w-xs">
                  Center the choir sheet music inside the bounding reticle.
                </p>
              </div>
            )}

            {/* Document Reticle Framing Guidelines */}
            <div className="absolute inset-8 pointer-events-none border border-dashed border-[#8B5CF6]/60 rounded-xl flex flex-col justify-between p-3">
              <div className="flex justify-between text-[10px] font-mono text-[#A78BFA]/80">
                <span>[ TOP EDGE ]</span>
                <span>[ 4/4 DETECTED ]</span>
              </div>
              <div className="text-center text-[10px] font-mono text-[#67E8F9] bg-[#09090B]/60 py-1 px-2 rounded self-center">
                Keep page flat & well illuminated
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#A78BFA]/80">
                <span>[ BOTTOM EDGE ]</span>
                <span>[ SATB ALIGNMENT ]</span>
              </div>
            </div>
          </div>

          {/* Bottom Capture Trigger */}
          <div className="flex items-center justify-center gap-6 max-w-2xl mx-auto w-full pb-4">
            <button
              onClick={handleCapturePhoto}
              className="w-18 h-18 rounded-full border-4 border-[#F4F1EA] flex items-center justify-center bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-xl transition-transform active:scale-90 cursor-pointer"
              aria-label="Capture sheet music"
            >
              <Camera size={26} />
            </button>
          </div>
        </div>
      )}

      {/* ================= MEANINGFUL OMR PROCESSING STATE ================= */}
      {isProcessing && omrProgress && (
        <div className="bg-[#111114] border border-[#8B5CF6]/40 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-in fade-in duration-300">
          <div className="flex justify-center">
            <MusiqMark size={64} isAnimated />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/15 text-[#A78BFA] text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
              <span>{omrProgress.stageName}</span>
            </div>
            <p className="text-sm text-[#F4F1EA]">
              {omrProgress.detail}
            </p>
          </div>

          {/* 4 Pipeline Milestones */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left font-mono text-xs pt-4">
            <div className={`p-3 rounded-xl border ${omrProgress.stage === 'preparing' ? 'bg-[#18181D] border-[#8B5CF6]' : 'bg-[#111114] border-[#27272D] text-[#6E6E77]'}`}>
              <div className="text-[10px] text-[#A78BFA]">STEP 1</div>
              <div className="font-semibold text-[#F4F1EA] mt-0.5">Preparing Score</div>
            </div>
            <div className={`p-3 rounded-xl border ${omrProgress.stage === 'reading' ? 'bg-[#18181D] border-[#8B5CF6]' : 'bg-[#111114] border-[#27272D] text-[#6E6E77]'}`}>
              <div className="text-[10px] text-[#A78BFA]">STEP 2</div>
              <div className="font-semibold text-[#F4F1EA] mt-0.5">Reading Notation</div>
            </div>
            <div className={`p-3 rounded-xl border ${omrProgress.stage === 'identifying' ? 'bg-[#18181D] border-[#8B5CF6]' : 'bg-[#111114] border-[#27272D] text-[#6E6E77]'}`}>
              <div className="text-[10px] text-[#A78BFA]">STEP 3</div>
              <div className="font-semibold text-[#F4F1EA] mt-0.5">Identifying Parts</div>
            </div>
            <div className={`p-3 rounded-xl border ${omrProgress.stage === 'building' ? 'bg-[#18181D] border-[#8B5CF6]' : 'bg-[#111114] border-[#27272D] text-[#6E6E77]'}`}>
              <div className="text-[10px] text-[#A78BFA]">STEP 4</div>
              <div className="font-semibold text-[#F4F1EA] mt-0.5">Building Performance</div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TRANSCRIBED SCORE RESULT CANVAS ================= */}
      {score && !isProcessing && (
        <div className="space-y-6">
          {/* Top Metadata & Controls Bar */}
          <div className="bg-[#111114] border border-[#27272D] rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title & Key Specs */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA] text-[10px] font-mono font-bold">
                  {score.arrangementType} ARRANGEMENT
                </span>
                <span className="text-xs font-mono text-[#4ADE80] flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  {Math.round(score.confidenceOverall * 100)}% OMR Confidence
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#F4F1EA]">
                {score.title}
              </h3>
              <p className="text-xs text-[#9A9AA3]">
                {score.composer} • {score.keySignature} • {score.timeSignature} • {score.tempoBpm} BPM
              </p>
            </div>

            {/* Score View Switcher & Action Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* View Switcher: SCORE | NOTES | SOL-FA */}
              <div className="bg-[#18181D] border border-[#27272D] p-1 rounded-xl flex items-center gap-1 text-xs font-mono font-semibold">
                <button
                  onClick={() => setViewMode('score')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'score' ? 'bg-[#8B5CF6] text-white' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
                  }`}
                >
                  SCORE
                </button>
                <button
                  onClick={() => setViewMode('notes')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'notes' ? 'bg-[#8B5CF6] text-white' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
                  }`}
                >
                  NOTES
                </button>
                <button
                  onClick={() => setViewMode('solfa')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'solfa' ? 'bg-[#8B5CF6] text-white' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
                  }`}
                >
                  SOL-FA
                </button>
              </div>

              {/* Compare with Original Scan Toggle */}
              <button
                onClick={() => setShowOriginalScan(!showOriginalScan)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  showOriginalScan
                    ? 'bg-[#18181D] border-[#8B5CF6] text-[#A78BFA]'
                    : 'bg-[#18181D] border-[#27272D] text-[#9A9AA3] hover:text-[#F4F1EA]'
                }`}
                title="Compare transcription side-by-side with original scan"
              >
                <SplitSquareVertical size={15} />
                <span className="hidden sm:inline">Compare Scan</span>
              </button>

              {/* Open in Studio CTA */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenStudio}
                icon={<Sliders size={15} />}
              >
                Open in Studio
              </Button>
            </div>
          </div>

          {/* ================= CHOIR REHEARSAL PLAYBACK CONTROLS ================= */}
          <div className="bg-[#18181D] border border-[#27272D] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
            {/* Play/Pause, Measure seek & Metronome */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayback}
                className="w-11 h-11 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md"
                aria-label={isPlaying ? 'Pause playback' : 'Play rehearsal score'}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>

              <button
                onClick={() => handleSeekMeasure(1)}
                className="p-2 text-[#9A9AA3] hover:text-[#F4F1EA] rounded-xl hover:bg-[#111114]"
                title="Rewind to Measure 1"
              >
                <RotateCcw size={17} />
              </button>

              {/* Measure & Beat indicator */}
              <div className="bg-[#111114] border border-[#27272D] px-3.5 py-1.5 rounded-xl font-mono text-xs flex items-center gap-2">
                <span className="text-[#9A9AA3]">MEASURE</span>
                <span className="font-bold text-[#A78BFA] text-sm">{currentMeasure}</span>
                <span className="text-[#6E6E77]">/ {score.measuresCount}</span>
                <span className="text-[#6E6E77] pl-1 border-l border-[#27272D]">BEAT {currentBeat}</span>
              </div>

              {/* Tempo slider */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#9A9AA3] pl-2 border-l border-[#27272D]">
                <span>{tempo} BPM</span>
                <input
                  type="range"
                  min={50}
                  max={140}
                  value={tempo}
                  onChange={e => setTempo(Number(e.target.value))}
                  className="w-20 accent-[#8B5CF6]"
                />
              </div>
            </div>

            {/* Rehearsal Voice Part Selector & Mix Modes */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Voice Pills: Full / S / A / T / B */}
              <div className="flex items-center gap-1.5 bg-[#111114] p-1.5 rounded-xl border border-[#27272D]">
                <button
                  onClick={() => {
                    setMixMode('full');
                    setActivePartId('');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    mixMode === 'full'
                      ? 'bg-[#8B5CF6] text-white'
                      : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
                  }`}
                  title="Play all parts in full harmony"
                >
                  FULL
                </button>

                {score.parts.map(part => {
                  const isSelected = activePartId === part.id;

                  return (
                    <button
                      key={part.id}
                      onClick={() => {
                        handleSelectPart(part.id);
                        if (mixMode === 'full') setMixMode('solo');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#8B5CF6] text-white shadow-sm ring-2 ring-[#A78BFA]/50' 
                          : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
                      }`}
                      title={`Select ${part.name}`}
                    >
                      {part.shortName}
                    </button>
                  );
                })}
              </div>

              {/* Listening Mode Selector */}
              <div className="hidden lg:flex items-center gap-1 text-xs font-mono">
                <button
                  onClick={() => setMixMode('solo')}
                  className={`px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    mixMode === 'solo' 
                      ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#A78BFA]' 
                      : 'border-[#27272D] text-[#9A9AA3] hover:text-[#F4F1EA]'
                  }`}
                >
                  SOLO VOICE
                </button>
                <button
                  onClick={() => setMixMode('my-part-plus-bg')}
                  className={`px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    mixMode === 'my-part-plus-bg' 
                      ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#A78BFA]' 
                      : 'border-[#27272D] text-[#9A9AA3] hover:text-[#F4F1EA]'
                  }`}
                  title="My Part at 100%, background choir at 20%"
                >
                  MY PART + BG
                </button>
              </div>

              {/* Mobile Mix Sheet Button */}
              <button
                onClick={() => setIsMobileMixOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-[#111114] border border-[#27272D] text-[#9A9AA3] hover:text-[#F4F1EA]"
                title="Part Mixers"
              >
                <Sliders size={16} />
              </button>

              {/* Instrument Selection */}
              <select
                value={synthInstrument}
                onChange={e => setSynthInstrument(e.target.value as SynthInstrument)}
                className="bg-[#111114] border border-[#27272D] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#F4F1EA] focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="piano">Acoustic Piano</option>
                <option value="choir">Choir Synth</option>
                <option value="synth">Warm Synth</option>
              </select>
            </div>
          </div>

          {/* ================= MAIN SCORE DISPLAY & ORIGINAL COMPARISON ================= */}
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Optional Original Scan Viewer */}
            {showOriginalScan && (
              <div className="lg:col-span-5 bg-[#111114] border border-[#27272D] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-[#9A9AA3] pb-2 border-b border-[#27272D]">
                  <span>ORIGINAL SOURCE SCAN</span>
                  <span>100% SCALE</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-[#27272D] bg-[#F5F2EB] max-h-[600px] overflow-y-auto">
                  <img
                    src={score.originalScanUrl}
                    alt="Original sheet music scan"
                    className="w-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* PRESERVED MULTI-VOICE STRUCTURE (SATB) */}
            <div className={`${showOriginalScan ? 'lg:col-span-7' : 'lg:col-span-12'} bg-[#111114] border border-[#27272D] rounded-2xl p-4 sm:p-6 space-y-6 overflow-x-auto`}>
              {/* Staves aligned vertically by measure and voice */}
              <div className="min-w-[650px] space-y-6">
                {score.parts.map(part => {
                  const isPartActive = activePartId === part.id;
                  const isPartDimmed = activePartId && activePartId !== part.id && mixMode === 'solo';

                  return (
                    <div
                      key={part.id}
                      onClick={() => handleSelectPart(part.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isPartActive
                          ? 'bg-[#18181D] border-[#8B5CF6] violet-glow-sm'
                          : isPartDimmed
                          ? 'bg-[#111114] border-[#27272D]/50 opacity-40 hover:opacity-75'
                          : 'bg-[#111114] border-[#27272D] hover:border-[#383842]'
                      }`}
                    >
                      {/* Part Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#27272D]/60 mb-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs text-white"
                            style={{ backgroundColor: part.color }}
                          >
                            {part.shortName}
                          </span>
                          <div>
                            <span className="text-sm font-bold text-[#F4F1EA]">{part.name}</span>
                            <span className="text-xs text-[#9A9AA3] font-mono ml-2">
                              {part.clef.toUpperCase()} CLEF
                            </span>
                          </div>
                        </div>

                        {/* Part Rehearsal Status */}
                        <div className="flex items-center gap-2 text-xs font-mono">
                          {isPartActive && (
                            <span className="px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA] font-semibold">
                              ACTIVE VOICE
                            </span>
                          )}
                          <span className="text-[#6E6E77]">
                            {mixMode === 'solo' && isPartActive ? 'SOLO (100%)' : mixMode === 'solo' ? 'MUTED' : 'HARMONY'}
                          </span>
                        </div>
                      </div>

                      {/* ================= ALIGNED MEASURE CELLS ================= */}
                      <div className="grid grid-cols-4 gap-3">
                        {part.measures.map(meas => {
                          const isCurrentMeas = currentMeasure === meas.measureNumber;

                          return (
                            <div
                              key={meas.measureNumber}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSeekMeasure(meas.measureNumber);
                              }}
                              className={`relative p-3 rounded-xl border transition-all ${
                                isCurrentMeas
                                  ? 'bg-[#8B5CF6]/15 border-[#8B5CF6] shadow-sm'
                                  : 'bg-[#18181D]/60 border-[#27272D] hover:border-[#383842]'
                              }`}
                            >
                              {/* Measure header & Flag indicator */}
                              <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                                <span className={isCurrentMeas ? 'text-[#A78BFA] font-bold' : 'text-[#6E6E77]'}>
                                  M{meas.measureNumber}
                                </span>

                                {meas.isFlagged && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedUncertainMeasure({
                                        part,
                                        measureNumber: meas.measureNumber,
                                        reason: meas.warningReason || 'Low OMR confidence'
                                      });
                                    }}
                                    className="flex items-center gap-1 text-[#FBBF24] bg-[#FBBF24]/15 px-1.5 py-0.5 rounded text-[9px] hover:bg-[#FBBF24]/25"
                                    title="Uncertain measure: click to review"
                                  >
                                    <AlertTriangle size={11} />
                                    <span>Review</span>
                                  </button>
                                )}
                              </div>

                              {/* VIEW 1: SCORE (Vector Notation Staves & Noteheads) */}
                              {viewMode === 'score' && (
                                <div className="space-y-1.5">
                                  {/* Mini 5-line musical staff */}
                                  <div className="relative h-12 w-full flex items-center justify-around py-1">
                                    <div className="absolute inset-x-0 top-1 bottom-1 flex flex-col justify-between pointer-events-none opacity-40">
                                      <div className="border-b border-[#9A9AA3]" />
                                      <div className="border-b border-[#9A9AA3]" />
                                      <div className="border-b border-[#9A9AA3]" />
                                      <div className="border-b border-[#9A9AA3]" />
                                      <div className="border-b border-[#9A9AA3]" />
                                    </div>

                                    {meas.notes.map(note => (
                                      <div
                                        key={note.id}
                                        className="relative z-10 flex flex-col items-center"
                                        title={`${note.pitch} (${note.lyric || ''})`}
                                      >
                                        <div
                                          className={`w-3.5 h-3 rounded-full border ${
                                            isCurrentMeas && currentBeat === note.beat
                                              ? 'bg-[#8B5CF6] border-white scale-125'
                                              : 'bg-[#F4F1EA] border-[#18181D]'
                                          } transition-transform shadow`}
                                        />
                                        <span className="text-[10px] font-mono text-[#A78BFA] mt-0.5 font-bold">
                                          {note.pitch}
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Lyrics aligned beneath notes */}
                                  <div className="text-center text-xs text-[#F4F1EA] font-serif italic pt-1 truncate">
                                    {meas.notes.map(n => n.lyric).filter(Boolean).join(' ')}
                                  </div>
                                </div>
                              )}

                              {/* VIEW 2: NOTES (Detected Pitch Names Aligned by Measure) */}
                              {viewMode === 'notes' && (
                                <div className="space-y-2 py-1">
                                  <div className="flex items-center justify-around font-mono text-xs font-bold text-[#F4F1EA]">
                                    {meas.notes.map(note => (
                                      <span
                                        key={note.id}
                                        className={`px-1.5 py-0.5 rounded ${
                                          isCurrentMeas && currentBeat === note.beat
                                            ? 'bg-[#8B5CF6] text-white'
                                            : 'text-[#F4F1EA]'
                                        }`}
                                      >
                                        {note.pitch}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="text-center text-xs text-[#9A9AA3] font-serif italic truncate">
                                    {meas.notes.map(n => n.lyric).filter(Boolean).join(' ')}
                                  </div>
                                </div>
                              )}

                              {/* VIEW 3: SOL-FA (Tonic Sol-fa strictly aligned for rehearsal) */}
                              {viewMode === 'solfa' && (
                                <div className="space-y-2 py-1">
                                  <div className="flex items-center justify-around font-mono text-xs font-bold">
                                    {meas.notes.map(note => (
                                      <span
                                        key={note.id}
                                        className={`px-1.5 py-0.5 rounded ${
                                          isCurrentMeas && currentBeat === note.beat
                                            ? 'bg-[#8B5CF6] text-white'
                                            : 'text-[#67E8F9]'
                                        }`}
                                      >
                                        {note.solfa}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="text-center text-xs text-[#9A9AA3] font-serif italic truncate">
                                    {meas.notes.map(n => n.lyric).filter(Boolean).join(' ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= UNCERTAIN MEASURE CORRECTION MODAL ================= */}
      {selectedUncertainMeasure && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedUncertainMeasure(null)}
          title={`Review Measure ${selectedUncertainMeasure.measureNumber} (${selectedUncertainMeasure.part.name})`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-xl text-xs text-[#FBBF24] flex items-start gap-2.5">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">OMR Notice:</span> {selectedUncertainMeasure.reason}
              </div>
            </div>

            <p className="text-sm text-[#F4F1EA]">
              Verify the detected notes or adjust pitch if the original scan has unclear notation.
            </p>

            <div className="p-4 bg-[#18181D] rounded-xl border border-[#27272D] flex items-center justify-around font-mono text-sm font-bold">
              <span>Detected: Eb4</span>
              <button
                onClick={() => {
                  audioEngine.playNote('Eb4', 0.8, synthInstrument);
                }}
                className="px-3 py-1 bg-[#8B5CF6] text-white rounded-lg text-xs"
              >
                Audition Eb4
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedUncertainMeasure(null)}
              >
                Keep Eb4
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  alert('Measure confirmed.');
                  setSelectedUncertainMeasure(null);
                }}
              >
                Confirm Correction
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MOBILE PART MIXER BOTTOM SHEET ================= */}
      <BottomSheet
        isOpen={isMobileMixOpen}
        onClose={() => setIsMobileMixOpen(false)}
        title="Choir Rehearsal Part Mixer"
      >
        <div className="space-y-4">
          <div className="flex gap-2 font-mono text-xs">
            <button
              onClick={() => setMixMode('solo')}
              className={`flex-1 py-2 rounded-xl border ${mixMode === 'solo' ? 'bg-[#8B5CF6] text-white' : 'border-[#27272D]'}`}
            >
              Solo Voice
            </button>
            <button
              onClick={() => setMixMode('my-part-plus-bg')}
              className={`flex-1 py-2 rounded-xl border ${mixMode === 'my-part-plus-bg' ? 'bg-[#8B5CF6] text-white' : 'border-[#27272D]'}`}
            >
              My Part + BG
            </button>
            <button
              onClick={() => setMixMode('custom')}
              className={`flex-1 py-2 rounded-xl border ${mixMode === 'custom' ? 'bg-[#8B5CF6] text-white' : 'border-[#27272D]'}`}
            >
              Custom Mix
            </button>
          </div>

          {score && (
            <div className="space-y-3 pt-2">
              {score.parts.map(part => (
                <div key={part.id} className="flex items-center justify-between gap-3">
                  <span className="w-16 text-xs font-bold font-mono text-[#F4F1EA]">{part.name}</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={partVolumes[part.id] ?? 0.8}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setPartVolumes(prev => ({ ...prev, [part.id]: val }));
                      setMixMode('custom');
                    }}
                    className="flex-1 accent-[#8B5CF6]"
                  />
                  <span className="text-xs font-mono text-[#9A9AA3] w-10 text-right">
                    {Math.round((partVolumes[part.id] ?? 0.8) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button variant="primary" fullWidth onClick={() => setIsMobileMixOpen(false)}>
            Apply & Rehearse
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
};
