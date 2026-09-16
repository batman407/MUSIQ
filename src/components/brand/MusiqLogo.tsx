import React from 'react';

interface MusiqMarkProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  isAnimated?: boolean;
  color?: string;
}

const SIZE_MAP = {
  xs: 20,
  sm: 26,
  md: 34,
  lg: 48,
  xl: 64
};

/**
 * MusiqMark - The signature geometric M originating from the path of a musical note.
 * A continuous geometric stroke flowing from the notehead up through the stem,
 * across the beam, into the cadence, naturally forming the letter M.
 */
export const MusiqMark: React.FC<MusiqMarkProps> = ({
  size = 'md',
  className = '',
  isAnimated = false,
  color = '#8B5CF6'
}) => {
  const dimension = typeof size === 'number' ? size : SIZE_MAP[size] || 34;

  return (
    <svg 
      width={dimension} 
      height={dimension} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none ${isAnimated ? 'animate-pulse-subtle' : ''} ${className}`}
      aria-label="MUSIQ Mark"
    >
      {/* Glow aura (restrained) */}
      <filter id="musiq-mark-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      {/* Note Head Origin - circular melodic anchor */}
      <circle 
        cx="11.5" 
        cy="31.5" 
        r="4.2" 
        fill="#A78BFA"
      />

      {/* The continuous geometric musical note M path */}
      <path
        d="M 11.5 31.5 
           L 11.5 12 
           C 11.5 10 13 9 14.8 10 
           L 24 19 
           L 33.2 10 
           C 35 9 36.5 10 36.5 12 
           L 36.5 31.5 
           C 36.5 34.5 39 36 41 34.5"
        stroke={color}
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Second notehead / harmonic terminal */}
      <circle 
        cx="24" 
        cy="19" 
        r="2" 
        fill="#67E8F9" 
        opacity="0.85"
      />
    </svg>
  );
};

interface MusiqWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const MusiqWordmark: React.FC<MusiqWordmarkProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
  onClick
}) => {
  const textSizes = {
    sm: 'text-base tracking-[0.24em]',
    md: 'text-xl tracking-[0.28em]',
    lg: 'text-3xl tracking-[0.3em]',
    xl: 'text-4xl tracking-[0.32em]'
  };

  const markSizes: Record<string, 'sm' | 'md' | 'lg' | 'xl'> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl'
  };

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      role="banner"
    >
      <MusiqMark size={markSizes[size]} />
      <div className="flex flex-col">
        <div className="flex items-center leading-none">
          <span className={`font-bold font-sans text-[#F4F1EA] ${textSizes[size]}`}>
            <span className="text-[#A78BFA]">M</span>USIQ
          </span>
        </div>
        {showTagline && (
          <span className="text-[9px] uppercase font-mono tracking-[0.26em] text-[#9A9AA3] mt-1.5 font-medium">
            Music starts here.
          </span>
        )}
      </div>
    </div>
  );
};
