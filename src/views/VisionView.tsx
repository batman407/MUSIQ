import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, Sliders, Eye, FileText, ChevronLeft, ChevronRight, 
  RotateCcw, AlertTriangle, CheckCircle2, Download, ArrowLeft, RefreshCw, 
  Layers, Music, Info, XCircle
} from 'lucide-react';
import { ScoreProject, StudioProject } from '../types';
import { omrService, OMRJobProgress, OMRHealthStatus } from '../services/omrService';
import { storageService } from '../services/storageService';
import { Button } from '../components/common/Button';
import { MusiqMark } from '../components/brand/MusiqLogo';
import { MusicXmlRenderer } from '../components/notation/MusicXmlRenderer';
import { ExportModal } from '../components/notation/ExportModal';

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
  // Score state: null = blank state
  const [score, setScore] = useState<ScoreProject | null>(currentScore);
  const [activeTab, setActiveTab] = useState<'original' | 'transcribed'>('original');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // OMR Execution state
  const [isProcessing, setIsProcessing] = useState(false);
  const [omrProgress, setOmrProgress] = useState<OMRJobProgress | null>(null);
  const [healthStatus, setHealthStatus] = useState<OMRHealthStatus | null>(null);

  // Export Modal state
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Sync currentScore from props
  useEffect(() => {
    if (currentScore) {
      setScore(currentScore);
      if (currentScore.rawMusicXml) {
        setActiveTab('transcribed');
      }
    }
  }, [currentScore]);

  // Check OMR backend health once on mount
  useEffect(() => {
    omrService.checkHealth().then(status => setHealthStatus(status));
  }, []);

  // Handle Camera
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

        // Convert base64 to File object
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const photoFile = new File([blob], `photo-score-${Date.now()}.jpg`, { type: 'image/jpeg' });
            createProjectFromFile(photoFile, [dataUrl]);
          });
        return;
      }
    }
    handleStopCamera();
  };

  // Handle File Upload (PDF, PNG, JPG, MusicXML)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    const isXml = file.name.endsWith('.xml') || file.name.endsWith('.musicxml');
    const isMxl = file.name.endsWith('.mxl');

    if (isXml) {
      // Direct MusicXML upload: parse and load directly
      const reader = new FileReader();
      reader.onload = () => {
        const xmlText = reader.result as string;
        try {
          const newScore = omrService.parseMusicXmlToScore(xmlText, file.name, '', [], file.type, file.size);
          setScore(newScore);
          setActiveTab('transcribed');
          storageService.saveScore(newScore);
          onScoreTranscribed(newScore);
        } catch (err: any) {
          alert(`Failed to parse MusicXML: ${err.message}`);
        }
      };
      reader.readAsText(file);
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    createProjectFromFile(file, [fileUrl]);
  };

  // Initialize ScoreProject strictly from the user's uploaded file
  const createProjectFromFile = (file: File, pageUrls: string[]) => {
    setUploadedFile(file);
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const newProject: ScoreProject = {
      id: `score-${Date.now()}`,
      title: cleanTitle,
      originalFilename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      arrangementType: 'Unprocessed Score',
      parts: [],
      measuresCount: 0,
      pagesCount: pageUrls.length || 1,
      currentPage: 1,
      pages: pageUrls,
      originalScanUrl: pageUrls[0],
      recognitionStatus: 'idle',
      createdAt: new Date().toISOString()
    };

    setScore(newProject);
    setActiveTab('original');
    setCurrentPage(1);
  };

  // Execute OMR Transcription
  const handleTranscribe = async () => {
    if (!score || !uploadedFile) {
      // If we only have score with originalScanUrl
      if (!uploadedFile) {
        alert('Please re-select the source file to send to the OMR backend.');
        return;
      }
      return;
    }

    setIsProcessing(true);
    setOmrProgress({
      status: 'uploading',
      stageMessage: 'Checking OMR service connectivity...'
    });

    try {
      const transcribedScore = await omrService.processScore(
        uploadedFile,
        score.pages,
        (prog) => setOmrProgress(prog)
      );

      setScore(transcribedScore);
      setActiveTab('transcribed');
      storageService.saveScore(transcribedScore);
      onScoreTranscribed(transcribedScore);
    } catch (err: any) {
      console.error('[OMR Error]', err);
      setScore(prev => prev ? {
        ...prev,
        recognitionStatus: err.message.includes('not connected') ? 'unconnected' : 'failed',
        errorMessage: err.message
      } : null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to empty state
  const handleResetToBlank = () => {
    setScore(null);
    setUploadedFile(null);
    setOmrProgress(null);
    setActiveTab('original');
  };

  const handleOpenStudio = () => {
    if (!score) return;
    const studioProject = omrService.convertScoreToStudioProject(score);
    storageService.saveStudioProject(studioProject);
    onOpenInStudio(studioProject);
  };

  // =========================================================================
  // 1. BLANK STATE: User has not uploaded anything yet
  // Must show ONLY:
  // "Turn sheet music into sound."
  // [ Take a Photo ] [ Upload Score ]
  // "Upload PDF, PNG or JPG."
  // NO demo score, NO composer, NO measures, NO SATB, NO confidence, NO playback
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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F4F1EA] tracking-tight">
            Turn sheet music into sound.
          </h1>
          <p className="text-sm text-[#9A9AA3] leading-relaxed">
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
                className="text-xs text-[#9A9AA3] hover:text-[#F4F1EA] px-3 py-1.5 rounded-full border border-[#27272D]"
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

        {/* Backend Status Pill */}
        <div className="pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111114] border border-[#27272D] text-xs font-mono text-[#9A9AA3]">
            <span className={`w-2 h-2 rounded-full ${healthStatus?.connected ? 'bg-[#4ADE80]' : 'bg-[#FBBF24]'}`} />
            <span>OMR Backend: {healthStatus?.connected ? 'Connected' : 'Standalone / Docker Ready'}</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. PROCESSING STATE: Genuine progress without fake setTimeout
  // =========================================================================
  if (isProcessing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 animate-in fade-in">
        <div className="flex justify-center">
          <MusiqMark size={64} isAnimated />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] text-xs font-mono font-bold">
            <RefreshCw size={12} className="animate-spin" />
            <span>{omrProgress?.status.toUpperCase() || 'PROCESSING'}</span>
          </div>
          <h3 className="text-xl font-bold text-[#F4F1EA]">
            {omrProgress?.stageMessage || 'Transcribing score with Optical Music Recognition...'}
          </h3>
          <p className="text-xs text-[#9A9AA3]">
            Target document: {score?.originalFilename || score?.title}
          </p>
        </div>

        {/* Real Progress Bar */}
        {omrProgress?.progressPercent !== undefined && (
          <div className="w-full bg-[#18181D] rounded-full h-2 overflow-hidden border border-[#27272D]">
            <div 
              className="bg-[#8B5CF6] h-full transition-all duration-300"
              style={{ width: `${omrProgress.progressPercent}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 3. FAILURE / UNCONNECTED STATE: Transparent error handling
  // If recognition fails or OMR backend is disconnected:
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
                {isUnconnected ? 'Transcription service unavailable.' : "We couldn't transcribe this score."}
              </h3>
              <p className="text-sm text-[#9A9AA3]">
                {isUnconnected 
                  ? 'OMR service is not connected. The Audiveris optical recognition server is required for document transcription.'
                  : score.errorMessage || 'Optical recognition could not extract notation from this file.'}
              </p>
            </div>
          </div>

          {isUnconnected && (
            <div className="p-4 bg-[#18181D] border border-[#27272D] rounded-xl text-xs font-mono text-[#F4F1EA] space-y-2">
              <div className="text-[#67E8F9] font-bold">Running the OMR Server Container:</div>
              <pre className="p-2.5 bg-black rounded text-[#A78BFA] overflow-x-auto">
                cd server && docker compose up --build
              </pre>
              <div className="text-[11px] text-[#9A9AA3]">
                Once running on port 3001, click "Try Again" to transcribe immediately.
              </div>
            </div>
          )}

          {/* Recovery Options: Try Again, Upload Another Score, View Original */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={<RefreshCw size={15} />}
              onClick={handleTranscribe}
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
  // 4. USER SCORE LOADED (ORIGINAL / TRANSCRIBED VIEW)
  // Source of truth is ALWAYS the user's uploaded file.
  // Multi-page navigation (Page X of Y), View Toggle (Original vs Transcribed),
  // OpenSheetMusicDisplay renderer, and Export dialog.
  // =========================================================================
  const isPdf = score?.mimeType?.includes('pdf') || score?.originalFilename?.endsWith('.pdf');
  const hasTranscribedXml = Boolean(score?.rawMusicXml);

  return (
    <div className={`p-4 sm:p-8 max-w-7xl mx-auto space-y-6 ${isPaperMode ? 'score-paper-mode' : ''}`}>
      {/* Top Score Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272D]/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToBlank}
              className="text-xs font-mono text-[#9A9AA3] hover:text-[#F4F1EA] flex items-center gap-1 mr-2"
            >
              <ArrowLeft size={13} />
              <span>Upload New</span>
            </button>
            <span className="px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#A78BFA] text-[10px] font-mono font-bold">
              {score?.arrangementType || 'DOCUMENT'}
            </span>
            {hasTranscribedXml && (
              <span className="text-xs font-mono text-[#4ADE80] flex items-center gap-1">
                <CheckCircle2 size={13} />
                Transcribed
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA]">
            {score?.title}
          </h2>
          <p className="text-xs text-[#9A9AA3] font-mono">
            File: {score?.originalFilename} {score?.fileSize ? `(${Math.round(score.fileSize / 1024)} KB)` : ''} • {score?.pagesCount || 1} Page{score?.pagesCount === 1 ? '' : 's'}
            {score?.composer ? ` • Composer: ${score.composer}` : ''}
          </p>
        </div>

        {/* Primary Action Controls: View Switcher (Original / Transcribed) & Export */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Switcher: ORIGINAL vs TRANSCRIBED */}
          <div className="bg-[#18181D] border border-[#27272D] p-1 rounded-xl flex items-center gap-1 text-xs font-mono font-bold">
            <button
              onClick={() => setActiveTab('original')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'original' ? 'bg-[#8B5CF6] text-white' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
              }`}
            >
              <FileText size={13} />
              <span>ORIGINAL</span>
            </button>
            <button
              onClick={() => {
                if (hasTranscribedXml) {
                  setActiveTab('transcribed');
                } else {
                  handleTranscribe();
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'transcribed' ? 'bg-[#8B5CF6] text-white' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
              }`}
            >
              <Music size={13} />
              <span>TRANSCRIBED</span>
            </button>
          </div>

          {/* Transcribe Trigger if not yet transcribed */}
          {!hasTranscribedXml && (
            <Button
              variant="primary"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={handleTranscribe}
            >
              Run OMR Transcription
            </Button>
          )}

          {/* Export Dialog Trigger */}
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={14} />}
            onClick={() => setIsExportOpen(true)}
          >
            Export
          </Button>

          {/* Open in Studio (only if parts exist) */}
          {score?.parts && score.parts.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              icon={<Sliders size={14} />}
              onClick={handleOpenStudio}
            >
              Open in Studio
            </Button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'original' ? (
        /* ================= 4A. ORIGINAL DOCUMENT VIEW ================= */
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
                className="w-full h-[700px] rounded-xl border border-[#27272D] bg-white"
              />
            ) : score?.pages && score.pages[currentPage - 1] ? (
              <img
                src={score.pages[currentPage - 1]}
                alt={`Original Score Page ${currentPage}`}
                className="max-h-[700px] object-contain rounded-xl shadow-lg"
              />
            ) : (
              <div className="text-center p-8 space-y-2 text-[#9A9AA3]">
                <FileText size={48} className="mx-auto text-[#6E6E77]" />
                <p>Original file loaded: {score?.originalFilename}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= 4B. TRANSCRIBED NOTATION VIEW (OSMD) ================= */
        <div className="space-y-6">
          {score?.rawMusicXml ? (
            <div className="space-y-4">
              <MusicXmlRenderer musicXml={score.rawMusicXml} />

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
                Click "Run OMR Transcription" to submit {score?.originalFilename} to the recognition engine.
              </p>
              <Button
                variant="primary"
                size="md"
                icon={<RefreshCw size={15} />}
                onClick={handleTranscribe}
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
