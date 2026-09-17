import React, { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { ZoomIn, ZoomOut, RotateCcw, AlertCircle, RefreshCw } from 'lucide-react';

interface MusicXmlRendererProps {
  musicXml: string;
  zoom?: number;
  onRenderSuccess?: () => void;
  onRenderError?: (error: string) => void;
}

export const MusicXmlRenderer: React.FC<MusicXmlRendererProps> = ({
  musicXml,
  zoom = 1.0,
  onRenderSuccess,
  onRenderError
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);

  useEffect(() => {
    let isCancelled = false;

    const renderScore = async () => {
      if (!containerRef.current || !musicXml) return;

      setIsLoading(true);
      setRenderError(null);

      try {
        // Clear previous SVG / canvas elements
        containerRef.current.innerHTML = '';

        const osmd = new OpenSheetMusicDisplay(containerRef.current, {
          autoResize: true,
          backend: 'svg',
          drawTitle: true,
          drawSubtitle: true,
          drawComposer: true,
          drawLyricist: true,
          drawPartNames: true,
          drawPartAbbreviations: true,
          drawMeasureNumbers: true,
          followCursor: false
        });

        osmdRef.current = osmd;
        osmd.zoom = currentZoom;

        await osmd.load(musicXml);

        if (!isCancelled) {
          osmd.render();
          setIsLoading(false);
          onRenderSuccess?.();
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('[OSMD Error]', err);
          const errorMsg = err?.message || 'Failed to render sheet music notation from MusicXML.';
          setRenderError(errorMsg);
          setIsLoading(false);
          onRenderError?.(errorMsg);
        }
      }
    };

    renderScore();

    return () => {
      isCancelled = true;
    };
  }, [musicXml]);

  // Handle zoom changes
  const handleZoom = (delta: number) => {
    const nextZoom = Math.max(0.5, Math.min(2.0, currentZoom + delta));
    setCurrentZoom(nextZoom);
    if (osmdRef.current) {
      osmdRef.current.zoom = nextZoom;
      try {
        osmdRef.current.render();
      } catch {
        // ignore
      }
    }
  };

  const handleResetZoom = () => {
    setCurrentZoom(1.0);
    if (osmdRef.current) {
      osmdRef.current.zoom = 1.0;
      try {
        osmdRef.current.render();
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="relative w-full flex flex-col bg-white text-black rounded-xl overflow-hidden border border-[#27272D] shadow-inner">
      {/* Notation Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#F4F1EA] border-b border-[#E2DED4] text-[#18181D] text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="font-semibold tracking-wider">NOTATION RENDERER • OPENSHEETMUSICDISPLAY</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-[#71717A] mr-2">
            {Math.round(currentZoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(-0.15)}
            className="p-1 rounded hover:bg-[#E5E0D5] text-[#27272D] transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={() => handleZoom(0.15)}
            className="p-1 rounded hover:bg-[#E5E0D5] text-[#27272D] transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 rounded hover:bg-[#E5E0D5] text-[#27272D] transition-colors"
            title="Reset Zoom"
            aria-label="Reset Zoom"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-3 text-sm text-[#71717A]">
          <RefreshCw size={18} className="animate-spin text-[#8B5CF6]" />
          <span>Typesetting notation from MusicXML...</span>
        </div>
      )}

      {/* Error state */}
      {renderError && (
        <div className="p-6 m-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#DC2626] space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle size={16} />
            <span>Notation Rendering Issue</span>
          </div>
          <p>{renderError}</p>
          <p className="text-[11px] text-[#991B1B]">
            The raw MusicXML can still be inspected and exported via the Export dialog.
          </p>
        </div>
      )}

      {/* Sheet Music Output Canvas / SVG Container */}
      <div 
        ref={containerRef}
        id="osmd-notation-canvas"
        className="w-full overflow-x-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px]"
      />
    </div>
  );
};
