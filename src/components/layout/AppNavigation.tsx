import React from 'react';
import { Home, Sparkles, Sliders, Eye, Library, Settings, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { ViewMode } from '../../types';
import { MusiqMark } from '../brand/MusiqLogo';

interface AppNavigationProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  isRailCollapsed: boolean;
  onToggleRail: () => void;
  userRole?: string;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({
  currentView,
  onNavigate,
  isRailCollapsed,
  onToggleRail,
  userRole
}) => {
  const navItems: { id: ViewMode; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'create', label: 'Create', icon: Sparkles },
    { id: 'studio', label: 'Studio', icon: Sliders },
    { id: 'vision', label: 'Vision', icon: Eye },
    { id: 'library', label: 'Library', icon: Library }
  ];

  const isNavActive = (id: ViewMode) => {
    if (id === 'vision' && (currentView === 'vision' || currentView === 'vision-capture' || currentView === 'vision-result')) {
      return true;
    }
    return currentView === id;
  };

  return (
    <>
      {/* ================= DESKTOP LEFT RAIL ================= */}
      <aside 
        className={`hidden md:flex flex-col justify-between border-r border-[#27272D] bg-[#09090B] transition-all duration-200 z-30 select-none ${
          isRailCollapsed ? 'w-[68px]' : 'w-60'
        } shrink-0 h-screen sticky top-0`}
      >
        {/* Top Branding */}
        <div>
          <div className="h-16 flex items-center px-4.5 border-b border-[#27272D]/40 justify-between">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 cursor-pointer text-left focus:outline-none"
            >
              <MusiqMark size={30} />
              {!isRailCollapsed && (
                <span className="font-bold tracking-[0.24em] text-base text-[#F4F1EA]">
                  <span className="text-[#A78BFA]">M</span>USIQ
                </span>
              )}
            </button>

            <button
              onClick={onToggleRail}
              className="p-1 rounded-md text-[#9A9AA3] hover:text-[#F4F1EA] hover:bg-[#18181D] transition-colors"
              title={isRailCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              {isRailCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-1.5 mt-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = isNavActive(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    active 
                      ? 'bg-[#18181D] text-[#F4F1EA] border border-[#27272D]' 
                      : 'text-[#9A9AA3] hover:text-[#F4F1EA] hover:bg-[#111114]'
                  } ${isRailCollapsed ? 'justify-center px-0' : ''}`}
                  title={item.label}
                >
                  <Icon 
                    size={19} 
                    className={active ? 'text-[#8B5CF6]' : 'text-[#9A9AA3]'} 
                  />
                  {!isRailCollapsed && <span>{item.label}</span>}
                  {!isRailCollapsed && active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rails: Settings & Account */}
        <div className="p-2 border-t border-[#27272D]/40 space-y-1">
          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              currentView === 'settings' 
                ? 'bg-[#18181D] text-[#F4F1EA] border border-[#27272D]' 
                : 'text-[#9A9AA3] hover:text-[#F4F1EA] hover:bg-[#111114]'
            } ${isRailCollapsed ? 'justify-center px-0' : ''}`}
            title="Settings"
          >
            <Settings size={18} className={currentView === 'settings' ? 'text-[#8B5CF6]' : 'text-[#9A9AA3]'} />
            {!isRailCollapsed && <span>Settings</span>}
          </button>

          <div className={`pt-2 flex items-center gap-3 px-2 ${isRailCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-[#18181D] border border-[#27272D] flex items-center justify-center text-[#A78BFA] shrink-0 font-mono text-xs">
              <User size={15} />
            </div>
            {!isRailCollapsed && (
              <div className="flex flex-col text-left truncate">
                <span className="text-xs font-semibold text-[#F4F1EA] truncate">Creator Space</span>
                <span className="text-[10px] text-[#9A9AA3] truncate">{userRole || 'Musician'}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#09090B]/95 backdrop-blur-md border-t border-[#27272D] z-40 px-3 flex items-center justify-around select-none safe-area-pb"
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isNavActive(item.id);

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center justify-center py-1 flex-1 transition-colors"
            >
              <div className={`p-1 rounded-lg ${active ? 'bg-[#8B5CF6]/15' : ''}`}>
                <Icon 
                  size={20} 
                  className={active ? 'text-[#8B5CF6]' : 'text-[#9A9AA3]'} 
                />
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-[#F4F1EA]' : 'text-[#9A9AA3]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
