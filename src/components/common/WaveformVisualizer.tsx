import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../../services/audioEngine';

interface WaveformVisualizerProps {
  peaks?: number[];
  progress?: number; // 0 to 1
  isPlaying?: boolean;
  onSeek?: (ratio: number) => void;
  height?: number;
  barWidth?: number;
  gap?: number;
  className?: string;
  isRealtime?: boolean;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  peaks = [0.2, 0.4, 0.7, 0.9, 0.6, 0.8, 0.5, 0.9, 0.7, 0.3, 0.6, 0.8, 0.4, 0.2],
  progress = 0,
  isPlaying = false,
  onSeek,
  height = 56,
  barWidth = 3,
  gap = 2,
  className = '',
  isRealtime = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Handle seeking by clicking or dragging on waveform
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = x / rect.width;
    onSeek(ratio);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      if (isRealtime && isPlaying) {
        const analyser = audioEngine.getAnalyser();
        if (analyser) {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);

          const step = Math.floor(bufferLength / 36);
          const activeWidth = w;
          const totalBars = 36;
          const bW = Math.max(2, (activeWidth / totalBars) - 2);

          for (let i = 0; i < totalBars; i++) {
            const val = dataArray[i * step] / 255;
            const barH = Math.max(4, val * (h - 8));
            const x = i * (bW + 2);
            const y = (h - barH) / 2;

            // Gradient: active violet
            ctx.fillStyle = '#8B5CF6';
            ctx.beginPath();
            ctx.roundRect(x, y, bW, barH, 2);
            ctx.fill();
          }

          animFrameId.current = requestAnimationFrame(draw);
          return;
        }
      }

      // Static or playback progress peak bars
      const numBars = peaks.length;
      const totalBarSpace = barWidth + gap;
      const totalWidthNeeded = numBars * totalBarSpace;
      const scaleX = w / Math.max(totalWidthNeeded, 1);

      const progressX = w * progress;

      for (let i = 0; i < numBars; i++) {
        const val = peaks[i];
        const barH = Math.max(4, val * (h - 6));
        const x = i * totalBarSpace * scaleX;
        const y = (h - barH) / 2;

        const isPast = x <= progressX;

        // Violet for played portion, subtle graphite for remaining
        ctx.fillStyle = isPast ? '#8B5CF6' : '#27272D';
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(2, barWidth * scaleX), barH, 2);
        ctx.fill();
      }

      // Playhead vertical line
      if (progress > 0 && progress < 1) {
        ctx.fillStyle = '#A78BFA';
        ctx.fillRect(progressX - 1, 2, 2, h - 4);
      }
    };

    draw();

    if (isPlaying && isRealtime) {
      animFrameId.current = requestAnimationFrame(draw);
    }

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [peaks, progress, isPlaying, isRealtime, height, barWidth, gap]);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className={`w-full h-full block ${onSeek ? 'cursor-pointer' : ''}`}
        style={{ height: `${height}px` }}
      />
    </div>
  );
};
