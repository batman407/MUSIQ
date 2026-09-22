import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, Upload, Eye, FileText, ChevronLeft, ChevronRight, 
  CheckCircle2, Download, ArrowLeft, RefreshCw, 
  Music, Music2, XCircle, Columns, Maximize2
} from 'lucide-react';
import { ScoreProject } from '../types';
import { omrService, OMRJobProgress, OMRHealthStatus } from '../services/omrService';
import { storageService } from '../services/storageService';
import { Button } from '../components/common/Button';
import { MusiqMark } from '../components/brand/MusiqLogo';
import { MusicXmlViewer } from '../components/notation/MusicXmlViewer';
import { ExportModal } from '../components/notation/ExportModal';
import { NotesView } from '../components/transcription/NotesView';
import { SolfaView } from '../components/transcription/SolfaView';
import { TonicSolfaSheet } from '../components/transcription/TonicSolfaSheet';
import { parseMusicXml, ParsedScore } from '../services/musicXmlParser';

export type VisionTabMode = 'original' | 'score' | 'notes' | 'solfa' | 'compare';

interface VisionViewProps {
  currentScore: ScoreProject | null;
  onScoreTranscribed: (score: ScoreProject) => void;
  isPaperMode?: boolean;
}

export const VisionView: React.FC<VisionViewProps> = ({
  currentScore,
  onScoreTranscribed,
  isPaperMode = false
}) => {
  // Score state
  const [score, setScore] = useState<ScoreProject | null>(currentScore);
  const [activeTab, setActiveTab] = useState<VisionTabMode>('original');
  const [solfaMode, setSolfaMode] = useState<'reading' | 'sheet'>('sheet');
  const [selectedPartId, setSelectedPartId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [uploadedFile, setUploadedFile] = useState<File | Blob | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Object URL tracking for clean revocation
  const createdObjectUrlsRef = useRef<string[]>([]);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // OMR Execution state
  const [isProcessing, setIsProcessing] = useState(false);
  const [omrProgress, setOmrProgress] = useState<OMRJobProgress | null>(null);
  const [healthStatus, setHealthStatus] = useState<OMRHealthStatus | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Export Modal state
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Register an object URL to be cleaned on unmount
  const trackObjectUrl = (url: string) => {
    createdObjectUrlsRef.current.push(url);
    return url;
  };

  // Clean all tracked object URLs on unmount
  useEffect(() => {
    return () => {
      createdObjectUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      createdObjectUrlsRef.current = [];
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Parse structured MusicXML into generic ParsedScore
  const parsedScore = useMemo<ParsedScore | null>(() => {
    if (!score?.rawMusicXml) return null;
    try {
      return parseMusicXml(score.rawMusicXml, score.title || score.originalFilename);
    } catch (e) {
      console.error('[MusicXML Parse Error]', e);
      return null;
    }
  }, [score?.rawMusicXml, score?.title, score?.originalFilename]);

  // Sync currentScore from props
  useEffect(() => {
    if (currentScore) {
      setScore(currentScore);
      if (currentScore.rawMusicXml) {
        setActiveTab('score');
      }
    }
  }, [currentScore]);

  // Check OMR backend health once on mount
  useEffect(() => {
    omrService.checkHealth().then(status => setHealthStatus(status)).catch(() => {});
  }, []);

  // Handle Camera Capture
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
      // Fallback
    }
  };

  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1200;
      canvas.height = videoRef.current.videoHeight || 1600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        handleStopCamera();

        // Convert base64 dataUrl to Blob/File object
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const photoName = `photo-score-${Date.now()}.jpg`;
            const photoFile = new File([blob], photoName, { type: 'image/jpeg' });
            const previewUrl = trackObjectUrl(URL.createObjectURL(photoFile));
            startScoreWorkflow(photoFile, [previewUrl], photoName);
          });
        return;
      }
    }
    handleStopCamera();
  };

  // Handle File Upload (PDF, PNG, JPG, JPEG, or direct MusicXML)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isXml = file.name.endsWith('.xml') || file.name.endsWith('.musicxml');

    if (isXml) {
      // Direct MusicXML file: parse and load directly
      const reader = new FileReader();
      reader.onload = () => {
        const xmlText = reader.result as string;
        try {
          const newScore = omrService.parseMusicXmlToScore(xmlText, file.name, '', [], file.type, file.size);
          setScore(newScore);
          setActiveTab('score');
          storageService.saveScore(newScore);
          onScoreTranscribed(newScore);
        } catch (err: any) {
          alert(`Failed to parse MusicXML: ${err.message}`);
        }
      };
      reader.readAsText(file);
      return;
    }

    const previewUrl = trackObjectUrl(URL.createObjectURL(file));
    startScoreWorkflow(file, [previewUrl], file.name);
  };

  // Start unified Score Workflow (immediately preserves original preview, then initiates OMR)
  const startScoreWorkflow = (file: File | Blob, pageUrls: string[], filename: string) => {
    setUploadedFile(file);
    setUploadedFileName(filename);

    const cleanTitle = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const newProject: ScoreProject = {
      id: `score-${Date.now()}`,
      title: cleanTitle,
      originalFilename: filename,
      mimeType: file instanceof File ? file.type : 'image/jpeg',
      fileSize: file.size,
      arrangementType: 'Sheet Music',
      parts: [],
      measuresCount: 0,
      pagesCount: pageUrls.length || 1,
      currentPage: 1,
      pages: pageUrls,
      originalScanUrl: pageUrls[0],
      recognitionStatus: 'uploading',
      createdAt: new Date().toISOString()
    };

    setScore(newProject);
    setActiveTab('original');
    setCurrentPage(1);

    // Automatically trigger genuine OMR processing
    runTranscription(file, filename, pageUrls, newProject);
  };

  // Execute OMR Transcription with real Railway backend polling
  const runTranscription = async (
    file: File | Blob,
    filename: string,
    pageUrls: string[],
    existingProject: ScoreProject
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsProcessing(true);
    setOmrProgress({
      status: 'uploading',
      stageMessage: 'Connecting to recognition service...'
    });

    try {
      const transcribedScore = await omrService.processScore(
        file,
        pageUrls,
        filename,
        (prog) => {
          setOmrProgress(prog);
        },
        abortController.signal
      );

      setScore(transcribedScore);
      setActiveTab('score');
      storageService.saveScore(transcribedScore);
      onScoreTranscribed(transcribedScore);
    } catch (err: any) {
      if (abortController.signal.aborted) return;
      console.error('[OMR Execution Error]', err);

      const isUnavailable = err.message?.includes('temporarily unavailable') || err.message?.includes('not connected');

      setScore(prev => (prev ? {
        ...prev,
        recognitionStatus: isUnavailable ? 'unconnected' : 'failed',
        errorMessage: err.message || "We couldn't transcribe this score."
      } : null));
    } finally {
      setIsProcessing(false);
    }
  };

  // User clicked "Try Again"
  const handleRetryTranscription = () => {
    if (!uploadedFile || !score) return;
    runTranscription(uploadedFile, uploadedFileName || score.originalFilename, score.pages, score);
  };

  // Reset to empty state (New Transcription)
  const handleResetToBlank = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setScore(null);
    setUploadedFile(null);
    setUploadedFileName('');
    setOmrProgress(null);
    setActiveTab('original');
  };

  // =========================================================================
  // 1. BLANK STATE: User has not uploaded anything yet
  // Must show ONLY:
  // "Turn sheet music into sound."
  // [ Take a Photo ] [ Upload Score ]
  // "Upload PDF, PNG or JPG."
  // =========================================================================
  if (!score && !isProcessing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center space-y-8 animate-in fade-in duration-300">
        <div className="flex justify-center">
          <MusiqMark size={64} isAnimated />
        </div>

        <div className="space-y-3 max-w-xl mx-auto">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#67E8F9] font-semibold">
            MUSIQ VISION • OPTICAL MUSIC RECOGNITION
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F4F1EA] tracking-tight">
            Turn sheet music into sound.
          </h1>
          <p className="text-sm sm:text-base text-[#9A9AA3] leading-relaxed">
            Upload PDF, PNG or JPG.
          </p>
        </div>

        {/* Action Triggers: Take a Photo & Upload Score */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            variant="primary"
            size="lg"
            icon={<Camera size={18} />}
            onClick={handleStartCamera}
          >
            Take a Photo
          </Button>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.xml,.musicxml,.mxl"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#18181D] hover:bg-[#27272D] text-sm text-[#F4F1EA] border border-[#27272D] transition-colors font-semibold shadow-lg">
              <Upload size={18} />
              <span>Upload Score</span>
            </div>
          </label>
        </div>

        {/* Camera Viewfinder Modal */}
        {isCameraOpen && (
          <div className="fixed inset-0 z-50 bg-[#09090B] flex flex-col justify-between p-4 md:p-8">
            <div className="flex items-center justify-between text-[#F4F1EA] max-w-2xl mx-auto w-full">
              <div className="flex items-center gap-2 font-mono text-xs text-[#A78BFA]">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-rec-blink" />
                <span>ALIGN SHEET MUSIC IN FRAME</span>
              </div>
              <button
                onClick={handleStopCamera}
                className="text-xs text-[#9A9AA3] hover:text-[#F4F1EA] px-3 py-1.5 rounded-full border border-[#27272D] cursor-pointer"
              >
                Cancel
              </button>
            </div>

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
                </div>
              )}
            </div>

            <div className="flex items-center justify-center pb-4">
              <button
                onClick={handleCapturePhoto}
                className="w-16 h-16 rounded-full border-4 border-[#F4F1EA] flex items-center justify-center bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-xl transition-transform active:scale-95 cursor-pointer"
                aria-label="Capture page"
              >
                <Camera size={24} />
              </button>
            </div>
          </div>
        )}

        {/* Service Availability Pill */}
        <div className="pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111114] border border-[#27272D] text-xs font-mono text-[#9A9AA3]">
            <span className={`w-2 h-2 rounded-full ${healthStatus?.connected ? 'bg-[#4ADE80]' : 'bg-[#FBBF24]'}`} />
            <span>Transcription Engine: {healthStatus?.connected ? 'Online' : 'Checking connection...'}</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. PROCESSING STATE: Truthful progress & Original Preview preservation
  // User can view their original document while processing
  // =========================================================================
  if (isProcessing) {
    const isPdf = score?.mimeType?.includes('pdf') || score?.originalFilename?.endsWith('.pdf');

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
        {/* Progress Banner */}
        <div className="bg-[#111114] border border-[#8B5CF6]/40 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
          <div className="flex justify-center">
            <MusiqMark size={56} isAnimated />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] text-xs font-mono font-bold">
              <RefreshCw size={12} className="animate-spin" />
              <span>{omrProgress?.status.toUpperCase() || 'PROCESSING'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#F4F1EA]">
              {omrProgress?.stageMessage || 'Reading musical notation...'}
            </h3>
            <p className="text-xs text-[#9A9AA3] font-mono">
              Target: {score?.originalFilename || uploadedFileName}
            </p>
          </div>
        </div>

        {/* Original File Preview during recognition */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#9A9AA3] px-1">
            <span>ORIGINAL SOURCE PREVIEW</span>
            <span>Page {currentPage} of {score?.pagesCount || 1}</span>
          </div>

          <div className="bg-[#111114] border border-[#27272D] rounded-2xl p-4 flex flex-col items-center justify-center min-h-[420px] overflow-hidden">
            {isPdf ? (
              <iframe
                src={`${score?.originalScanUrl}#page=${currentPage}`}
                title="Original PDF Document Preview"
                className="w-full h-[520px] rounded-xl border border-[#27272D] bg-white"
              />
            ) : score?.pages && score.pages[currentPage - 1] ? (
              <img
                src={score.pages[currentPage - 1]}
                alt={`Original Score Page ${currentPage}`}
                className="max-h-[520px] object-contain rounded-xl shadow-lg"
              />
            ) : (
              <div className="text-center p-8 space-y-2 text-[#9A9AA3]">
                <FileText size={48} className="mx-auto text-[#6E6E77]" />
                <p>Original file: {score?.originalFilename}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. FAILURE / UNCONNECTED STATE: Transparent error handling
  // "We couldn't transcribe this score."
  // Options: Try Again, Upload Another Score, View Original
  // NEVER show another composition.
  // =========================================================================
  if (score && (score.recognitionStatus === 'failed' || score.recognitionStatus === 'unconnected')) {
    const isUnconnected = score.recognitionStatus === 'unconnected';

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-[#111114] border border-[#EF4444]/40 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-3">
            <XCircle size={28} className="text-[#EF4444] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#F4F1EA]">
                {isUnconnected ? 'Transcription is temporarily unavailable.' : "We couldn't transcribe this score."}
              </h3>
              <p className="text-sm text-[#9A9AA3]">
                {isUnconnected 
                  ? 'The optical music recognition service is temporarily unreachable. Please try again shortly.'
                  : score.errorMessage || 'Optical recognition could not extract notation from this file.'}
              </p>
            </div>
          </div>

          {/* Recovery Actions: Try Again, View Original, Upload Another Score */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={<RefreshCw size={15} />}
              onClick={handleRetryTranscription}
            >
              Try Again
            </Button>

            <Button
              variant="secondary"
              size="md"
              icon={<Upload size={15} />}
              onClick={handleResetToBlank}
            >
              Upload Another Score
            </Button>

            <Button
              variant="ghost"
              size="md"
              icon={<Eye size={15} />}
              onClick={() => {
                setScore(prev => prev ? { ...prev, recognitionStatus: 'idle' } : null);
                setActiveTab('original');
              }}
            >
              View Original
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. RESULT SCREEN (ORIGINAL | TRANSCRIPTION | COMPARE)
  // Header: [filename] + Transcription complete
  // Primary actions: Export, New Transcription
  // Secondary actions: Zoom In, Zoom Out, Fit Width
  // =========================================================================
  const isPdf = score?.mimeType?.includes('pdf') || score?.originalFilename?.endsWith('.pdf');
  const hasTranscribedXml = Boolean(score?.rawMusicXml);

  return (
    <div className={`p-4 sm:p-8 max-w-7xl mx-auto space-y-6 ${isPaperMode ? 'score-paper-mode' : ''}`}>
      {/* Top Header: Filename, Status & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272D]/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToBlank}
              className="text-xs font-mono text-[#9A9AA3] hover:text-[#F4F1EA] flex items-center gap-1 mr-2 cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>New Transcription</span>
            </button>
            <span className="px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA] text-[10px] font-mono font-bold uppercase">
              {score?.arrangementType || 'SCORE'}
            </span>
            {hasTranscribedXml && (
              <span className="text-xs font-mono text-[#4ADE80] flex items-center gap-1">
                <CheckCircle2 size={13} />
                Transcription complete
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA] truncate max-w-2xl">
            {score?.title || score?.originalFilename}
          </h2>
          <p className="text-xs text-[#9A9AA3] font-mono">
            File: {score?.originalFilename} {score?.fileSize ? `(${Math.round(score.fileSize / 1024)} KB)` : ''} • {score?.pagesCount || 1} Page{score?.pagesCount === 1 ? '' : 's'}
            {score?.composer ? ` • Composer: ${score.composer}` : ''}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Switcher: ORIGINAL | SCORE | NOTES | SOL-FA (plus COMPARE on desktop) */}
          <div className="bg-[#18181D] border border-[#27272D] p-1 rounded-xl flex items-center gap-1 text-xs font-mono font-bold">
            <button
              onClick={() => setActiveTab('original')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'original' ? 'bg-[#8B5CF6] text-white shadow' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
              }`}
            >
              <FileText size={13} />
              <span>ORIGINAL</span>
            </button>
            <button
              onClick={() => setActiveTab('score')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'score' ? 'bg-[#8B5CF6] text-white shadow' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
              }`}
            >
              <Music size={13} />
              <span>SCORE</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'notes' ? 'bg-[#8B5CF6] text-white shadow' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
              }`}
            >
              <Music2 size={13} />
              <span>NOTES</span>
            </button>
            <button
              onClick={() => setActiveTab('solfa')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'solfa' ? 'bg-[#8B5CF6] text-white shadow' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
              }`}
            >
              <FileText size={13} />
              <span>SOL-FA</span>
            </button>
            {/* Desktop Compare Toggle */}
            <button
              onClick={() => setActiveTab('compare')}
              className={`hidden md:flex px-3 py-1.5 rounded-lg transition-colors cursor-pointer items-center gap-1.5 ${
                activeTab === 'compare' ? 'bg-[#8B5CF6] text-white shadow' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
              }`}
            >
              <Columns size={13} />
              <span>COMPARE</span>
            </button>
          </div>

          {/* New Transcription Action */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToBlank}
          >
            New Transcription
          </Button>

          {/* Export Action */}
          <Button
            variant="primary"
            size="sm"
            icon={<Download size={14} />}
            onClick={() => setIsExportOpen(true)}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'compare' ? (
        /* ================= 4A. DESKTOP COMPARE VIEW (Side-by-side) ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Document Half */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#9A9AA3] px-2">
              <span className="font-bold text-[#67E8F9]">ORIGINAL DOCUMENT</span>
              <span>Page {currentPage} of {score?.pagesCount || 1}</span>
            </div>
            <div className="bg-[#111114] border border-[#27272D] rounded-2xl p-4 flex items-center justify-center min-h-[600px] overflow-hidden">
              {isPdf ? (
                <iframe
                  src={`${score?.originalScanUrl}#page=${currentPage}`}
                  title="Original PDF Document"
                  className="w-full h-[700px] rounded-xl border border-[#27272D] bg-white"
                />
              ) : score?.pages && score.pages[currentPage - 1] ? (
                <img
                  src={score.pages[currentPage - 1]}
                  alt={`Original Score Page ${currentPage}`}
                  className="max-h-[700px] object-contain rounded-xl shadow-lg"
                />
              ) : (
                <div className="text-center p-8 text-[#9A9AA3]">Original file: {score?.originalFilename}</div>
              )}
            </div>
          </div>

          {/* Transcribed Notation Half */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-[#9A9AA3] px-2 font-bold text-[#A78BFA]">
              TRANSCRIBED NOTATION (OSMD)
            </div>
            {score?.rawMusicXml ? (
              <MusicXmlViewer musicXml={score.rawMusicXml} />
            ) : (
              <div className="p-12 text-center bg-[#111114] border border-[#27272D] rounded-2xl text-sm text-[#9A9AA3]">
                No transcription available.
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'original' ? (
        /* ================= 4B. ORIGINAL DOCUMENT TAB ================= */
        <div className="space-y-4">
          {/* Multi-Page Navigation Bar */}
          <div className="bg-[#111114] border border-[#27272D] rounded-xl px-4 py-2.5 flex items-center justify-between font-mono text-xs text-[#F4F1EA]">
            <div className="flex items-center gap-2">
              <span className="text-[#9A9AA3]">DOCUMENT VIEWER:</span>
              <span className="font-bold text-[#A78BFA]">{score?.originalFilename}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1 rounded hover:bg-[#18181D] disabled:opacity-30 cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                Page {currentPage} of {score?.pagesCount || score?.pages?.length || 1}
              </span>
              <button
                disabled={currentPage >= (score?.pagesCount || score?.pages?.length || 1)}
                onClick={() => setCurrentPage(prev => Math.min((score?.pagesCount || score?.pages?.length || 1), prev + 1))}
                className="p-1 rounded hover:bg-[#18181D] disabled:opacity-30 cursor-pointer"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Document Content Render */}
          <div className="bg-[#111114] border border-[#27272D] rounded-2xl p-4 flex flex-col items-center justify-center min-h-[600px] overflow-hidden">
            {isPdf ? (
              <iframe
                src={`${score?.originalScanUrl}#page=${currentPage}`}
                title="Original PDF Score Viewer"
                className="w-full h-[750px] rounded-xl border border-[#27272D] bg-white"
              />
            ) : score?.pages && score.pages[currentPage - 1] ? (
              <img
                src={score.pages[currentPage - 1]}
                alt={`Original Score Page ${currentPage}`}
                className="max-h-[750px] object-contain rounded-xl shadow-lg"
              />
            ) : (
              <div className="text-center p-8 space-y-2 text-[#9A9AA3]">
                <FileText size={48} className="mx-auto text-[#6E6E77]" />
                <p>Original file loaded: {score?.originalFilename}</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'notes' ? (
        /* ================= 4C. NOTES TRANSCRIPTION TAB ================= */
        <div className="space-y-6">
          {parsedScore ? (
            <NotesView
              parsedScore={parsedScore}
              selectedPartId={selectedPartId}
              onSelectPart={setSelectedPartId}
            />
          ) : (
            <div className="p-12 text-center bg-[#111114] border border-[#27272D] rounded-2xl space-y-4">
              <Music2 size={40} className="mx-auto text-[#67E8F9]" />
              <h3 className="text-lg font-bold text-[#F4F1EA]">No Note Names available</h3>
              <p className="text-xs text-[#9A9AA3] max-w-md mx-auto">
                Submit this score to the recognition engine to extract note names from MusicXML.
              </p>
            </div>
          )}
        </div>
      ) : activeTab === 'solfa' ? (
        /* ================= 4D. TONIC SOL-FA TAB (SHEET + READING MODES) ================= */
        <div className="space-y-6">
          {/* Sub-mode Switcher: SHEET vs READING */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272D]/60 pb-3 print:hidden">
            <div className="text-xs font-mono text-[#9A9AA3] flex items-center gap-2">
              <span>SOL-FA VIEW MODE:</span>
              <span className="text-[#A78BFA] font-bold">
                {solfaMode === 'sheet' ? 'Traditional Choral Sheet (Printable A4)' : 'Interactive Reading Cards'}
              </span>
            </div>

            <div className="bg-[#18181D] border border-[#27272D] p-1 rounded-xl flex items-center gap-1 text-xs font-mono font-bold">
              <button
                onClick={() => setSolfaMode('sheet')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  solfaMode === 'sheet' ? 'bg-[#8B5CF6] text-white shadow' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
                }`}
              >
                <span>SHEET</span>
              </button>
              <button
                onClick={() => setSolfaMode('reading')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  solfaMode === 'reading' ? 'bg-[#8B5CF6] text-white shadow' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
                }`}
              >
                <span>READING</span>
              </button>
            </div>
          </div>

          {parsedScore ? (
            solfaMode === 'sheet' ? (
              <TonicSolfaSheet
                parsedScore={parsedScore}
                onOpenExport={() => setIsExportOpen(true)}
              />
            ) : (
              <SolfaView
                parsedScore={parsedScore}
                selectedPartId={selectedPartId}
                onSelectPart={setSelectedPartId}
              />
            )
          ) : (
            <div className="p-12 text-center bg-[#111114] border border-[#27272D] rounded-2xl space-y-4">
              <FileText size={40} className="mx-auto text-[#8B5CF6]" />
              <h3 className="text-lg font-bold text-[#F4F1EA]">No Tonic Sol-Fa available</h3>
              <p className="text-xs text-[#9A9AA3] max-w-md mx-auto">
                Submit this score to the recognition engine to compute Movable-Do sol-fa from MusicXML.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ================= 4E. SCORE NOTATION TAB (OSMD) ================= */
        <div className="space-y-6">
          {score?.rawMusicXml ? (
            <div className="space-y-4">
              <MusicXmlViewer musicXml={score.rawMusicXml} />

              {/* Dynamic Parts Summary */}
              {score.parts && score.parts.length > 0 && (
                <div className="p-4 bg-[#111114] border border-[#27272D] rounded-xl space-y-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#A78BFA]">
                    RECOGNIZED PARTS & INSTRUMENTATION ({score.parts.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {score.parts.map(part => (
                      <span
                        key={part.id}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#18181D] border border-[#27272D] text-[#F4F1EA] flex items-center gap-1.5"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: part.color }} />
                        <span className="font-bold">{part.name}</span>
                        <span className="text-[#9A9AA3]">({part.clef} clef)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#111114] border border-[#27272D] rounded-2xl space-y-4">
              <Music size={40} className="mx-auto text-[#8B5CF6]" />
              <h3 className="text-lg font-bold text-[#F4F1EA]">No transcription generated yet</h3>
              <p className="text-xs text-[#9A9AA3] max-w-md mx-auto">
                Submit this score to the recognition engine to typeset musical notation.
              </p>
              <Button
                variant="primary"
                size="md"
                icon={<RefreshCw size={15} />}
                onClick={handleRetryTranscription}
              >
                Run OMR Transcription
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Export Modal */}
      {score && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          score={score}
        />
      )}
    </div>
  );
};
