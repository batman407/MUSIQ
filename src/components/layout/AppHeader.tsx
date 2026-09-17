import React from 'react';
import { Search, Eye, Upload } from 'lucide-react';
import { ViewMode } from '../../types';
import { MusiqMark } from '../brand/MusiqLogo';

interface AppHeaderProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onOpenSearch: () => void;
  onOpenNewModal?: () => void;
  title?: string;
  subtitle?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentView,
  onNavigate,
  onOpenSearch,
  title,
  subtitle
}) => {
  const getContextInfo = () => {
    switch (currentView) {
      case 'home':
        return { title: 'Overview', icon: null };
      case 'vision':
      case 'vision-capture':
      case 'vision-result':
        return { title: 'MUSIQ Vision • Transcribe', icon: Eye };
      case 'library':
        return { title: 'Transcription Library', icon: null };
      case 'settings':
        return { title: 'Settings', icon: null };
      default:
        return { title: 'MUSIQ', icon: null };
    }
  };

  const context = getContextInfo();
  const displayTitle = title || context.title;

  return (
    <header className="h-16 border-b border-[#27272D]/60 bg-[#09090B]/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Left: Mobile branding or Desktop Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
          <MusiqMark size={24} />
          <span className="font-bold tracking-[0.2em] text-sm text-[#F4F1EA]">MUSIQ</span>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {context.icon && (
            <context.icon size={17} className="text-[#8B5CF6]" />
          )}
          <h1 className="text-sm font-semibold text-[#F4F1EA] tracking-wide">
            {displayTitle}
          </h1>
          {subtitle && (
            <span className="text-xs text-[#9A9AA3] font-mono pl-2 border-l border-[#27272D]">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right: Search shortcut & Quick Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 bg-[#111114] hover:bg-[#18181D] text-[#9A9AA3] hover:text-[#F4F1EA] border border-[#27272D] px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
          title="Search transcriptions"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-block bg-[#18181D] px-1.5 py-0.5 rounded text-[10px] font-mono text-[#6E6E77] border border-[#27272D]">
            ⌘K
          </kbd>
        </button>

        {currentView !== 'vision' && currentView !== 'vision-result' && (
          <button
            onClick={() => onNavigate('vision')}
            className="flex items-center gap-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Upload Score</span>
          </button>
        )}
      </div>
    </header>
  );
};
