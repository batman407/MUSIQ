import React, { useEffect, useState } from 'react';
import { storageService } from '../../services/storageService';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasSeen = storageService.hasSeenIntro();

    if (prefersReducedMotion) {
      storageService.setIntroSeen();
      onComplete();
      return;
    }

    if (hasSeen) {
      // Snappy returning user intro (650ms)
      setStep(4);
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(onComplete, 350);
      }, 650);
      return () => clearTimeout(timer);
    }

    // First visit: 4-beat deliberate rhythmic sequence (~2.8s total)
    // Beat 1 (0ms): Point appears
    setStep(1);

    // Beat 2 (600ms): Pulse of sound expands
    const t2 = setTimeout(() => setStep(2), 600);

    // Beat 3 (1200ms): Musical note geometry draws path of M
    const t3 = setTimeout(() => setStep(3), 1200);

    // Beat 4 (1900ms): M settles, "USIQ" reveals, tagline appears
    const t4 = setTimeout(() => setStep(4), 1900);

    // Transition out (2700ms)
    const t5 = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        storageService.setIntroSeen();
        onComplete();
      }, 450);
    }, 2750);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  const handleSkip = () => {
    storageService.setIntroSeen();
    setIsFadingOut(true);
    setTimeout(onComplete, 200);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09090B] transition-opacity duration-500 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      }`}
      style={{ transitionProperty: 'opacity, transform' }}
    >
      {/* Skip button for user convenience */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 text-xs text-[#9A9AA3] hover:text-[#F4F1EA] px-3 py-1.5 rounded-full border border-[#27272D] hover:border-[#383842] transition-colors"
      >
        Skip
      </button>

      <div className="relative flex flex-col items-center justify-center">
        {/* Sound origin pulse circle */}
        {step >= 2 && (
          <div 
            className="absolute w-28 h-28 rounded-full border border-[#8B5CF6]/30 pointer-events-none transition-all duration-1000 ease-out"
            style={{
              transform: step >= 3 ? 'scale(2.2)' : 'scale(1)',
              opacity: step >= 3 ? 0 : 0.8
            }}
          />
        )}

        {/* SVG Canvas for geometric note M tracing */}
        <div className="relative flex items-center justify-center">
          <svg 
            width="120" 
            height="120" 
            viewBox="0 0 48 48" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform duration-700 ease-out"
            style={{
              transform: step >= 4 ? 'translateX(-38px)' : 'translateX(0)'
            }}
          >
            {/* Beat 1 & 2: Notehead appears & glows */}
            {step >= 1 && (
              <circle 
                cx="11.5" 
                cy="31.5" 
                r="4.2" 
                fill="#A78BFA"
                className="transition-all duration-500 ease-out"
                style={{
                  transform: step >= 1 ? 'scale(1)' : 'scale(0)',
                  transformOrigin: '11.5px 31.5px'
                }}
              />
            )}

            {/* Beat 3: Continuous note stroke tracing M */}
            <path
              d="M 11.5 31.5 
                 L 11.5 12 
                 C 11.5 10 13 9 14.8 10 
                 L 24 19 
                 L 33.2 10 
                 C 35 9 36.5 10 36.5 12 
                 L 36.5 31.5 
                 C 36.5 34.5 39 36 41 34.5"
              stroke="#8B5CF6"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 140,
                strokeDashoffset: step < 3 ? 140 : 0,
                transition: 'stroke-dashoffset 0.85s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />

            {/* Harmonic apex note */}
            {step >= 3 && (
              <circle 
                cx="24" 
                cy="19" 
                r="2.2" 
                fill="#67E8F9"
                className="transition-opacity duration-300"
                style={{ opacity: step >= 3 ? 1 : 0 }}
              />
            )}
          </svg>

          {/* Beat 4: "USIQ" revealed beside M */}
          <div 
            className="absolute left-[54%] overflow-hidden transition-all duration-700 ease-out whitespace-nowrap"
            style={{
              width: step >= 4 ? '150px' : '0px',
              opacity: step >= 4 ? 1 : 0,
              transform: step >= 4 ? 'translateX(0)' : 'translateX(-15px)'
            }}
          >
            <span className="text-4xl font-bold font-sans tracking-[0.24em] text-[#F4F1EA]">
              USIQ
            </span>
          </div>
        </div>

        {/* Tagline: MUSIC STARTS HERE. */}
        <div 
          className="mt-6 transition-all duration-700 ease-out text-center overflow-hidden"
          style={{
            opacity: step >= 4 ? 1 : 0,
            transform: step >= 4 ? 'translateY(0)' : 'translateY(10px)'
          }}
        >
          <p className="text-xs uppercase font-mono tracking-[0.3em] text-[#9A9AA3] font-medium">
            Music starts here.
          </p>
        </div>
      </div>
    </div>
  );
};
