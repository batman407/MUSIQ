import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { ZoomIn, ZoomOut, RotateCcw, AlertCircle, RefreshCw, Maximize2 } from 'lucide-react';

export interface MusicXmlViewerProps {
  musicXml: string;
  zoom?: number;
  onRenderSuccess?: () => void;
  onRenderError?: (error: string) => void;
}

export const MusicXmlViewer: React.FC<MusicXmlViewerProps> = ({
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

  // Compute responsive default zoom
  const computeFitWidthZoom = useCallback(() => {
    if (!containerRef.current) return 1.0;
    const containerWidth = containerRef.current.clientWidth;
    if (containerWidth < 480) return 0.65;
    if (containerWidth < 768) return 0.8;
    if (containerWidth < 1024) return 0.95;
    return 1.0;
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const renderScore = async () => {
      if (!containerRef.current) return;

      if (!musicXml || typeof musicXml !== 'string' || !musicXml.includes('<score-partwise')) {
        setRenderError('No valid MusicXML content available to render.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setRenderError(null);

      try {
        // Clear previous SVG / canvas notation before typesetting new project
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
          console.error('[OSMD Typesetting Error]', err);
          const errorMsg = err?.message || 'Failed to typeset musical notation from this score.';
          setRenderError(errorMsg);
          setIsLoading(false);
          onRenderError?.(errorMsg);
        }
      }
    };

    renderScore();

    return () => {
      isCancelled = true;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      osmdRef.current = null;
    };
  }, [musicXml]);

  // Window resize handler with debounce
  useEffect(() => {
    let resizeTimer: any = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (osmdRef.current && containerRef.current) {
          try {
            osmdRef.current.render();
          } catch {
            // ignore resize re-render errors
          }
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Zoom actions
  const handleZoom = (delta: number) => {
    const nextZoom = Math.max(0.4, Math.min(2.5, Math.round((currentZoom + delta) * 100) / 100));
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

  const handleFitWidth = () => {
    const fitZoom = computeFitWidthZoom();
    setCurrentZoom(fitZoom);
    if (osmdRef.current) {
      osmdRef.current.zoom = fitZoom;
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
    <div className="relative w-full flex flex-col bg-white text-black rounded-2xl overflow-hidden border border-[#27272D] shadow-2xl">
      {/* Notation Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#F4F1EA] border-b border-[#E2DED4] text-[#18181D] text-xs font-mono select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="font-semibold tracking-wider text-[#18181D]">NOTATION VIEWER • COMPLETE TRANSCRIPTION</span>
        </div>

        {/* Toolbar Zoom & Fit Controls */}
        <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
          <span className="text-[11px] text-[#71717A] min-w-[3rem] text-right font-bold mr-1">
            {Math.round(currentZoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(-0.15)}
            className="p-1.5 rounded-lg hover:bg-[#E5E0D5] text-[#27272D] transition-colors cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={() => handleZoom(0.15)}
            className="p-1.5 rounded-lg hover:bg-[#E5E0D5] text-[#27272D] transition-colors cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={handleFitWidth}
            className="p-1.5 rounded-lg hover:bg-[#E5E0D5] text-[#27272D] transition-colors cursor-pointer"
            title="Fit Width"
            aria-label="Fit Width"
          >
            <Maximize2 size={15} />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg hover:bg-[#E5E0D5] text-[#27272D] transition-colors cursor-pointer"
            title="Reset 100%"
            aria-label="Reset 100%"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 gap-3 text-sm text-[#71717A] font-medium">
          <RefreshCw size={20} className="animate-spin text-[#8B5CF6]" />
          <span>Typesetting notation from MusicXML...</span>
        </div>
      )}

      {/* Error State */}
      {renderError && (
        <div className="p-6 m-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#DC2626] space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle size={17} />
            <span>Notation Typesetting Issue</span>
          </div>
          <p>{renderError}</p>
          <p className="text-[11px] text-[#991B1B]">
            The complete MusicXML transcription is still safe and can be exported using the Export button.
          </p>
        </div>
      )}

      {/* Complete Scrollable Notation Canvas */}
      <div 
        ref={containerRef}
        id="osmd-notation-canvas"
        className="w-full overflow-x-auto overflow-y-visible p-4 sm:p-8 md:p-12 flex flex-col items-center justify-start min-h-[500px]"
      />
    </div>
  );
};

export const MusicXmlRenderer = MusicXmlViewer;
export default MusicXmlViewer;
