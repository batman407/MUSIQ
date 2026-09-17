import React, { useState, useEffect } from 'react';
import { ViewMode, ScoreProject, User } from './types';
import { storageService } from './services/storageService';

// Brand & Intro
import { IntroAnimation } from './components/brand/IntroAnimation';

// Layout
import { AppNavigation } from './components/layout/AppNavigation';
import { AppHeader } from './components/layout/AppHeader';

// Views
import { LandingPage } from './views/LandingPage';
import { HomeView } from './views/HomeView';
import { VisionView } from './views/VisionView';
import { LibraryView } from './views/LibraryView';
import { SettingsView } from './views/SettingsView';
import { AuthModal } from './views/AuthModal';
import { OnboardingModal } from './views/OnboardingModal';
import { Modal } from './components/common/Modal';

export function App() {
  // Intro animation state
  const [showIntro, setShowIntro] = useState<boolean>(true);

  // Navigation view state
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [isRailCollapsed, setIsRailCollapsed] = useState<boolean>(false);

  // Active Score State (Source of truth: user uploads)
  const [currentScore, setCurrentScore] = useState<ScoreProject | null>(() => {
    const scores = storageService.getScores();
    return scores[0] || null;
  });

  // User & Onboarding
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getUser());
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Global Search Modal (Cmd+K)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');

  // Paper Score Mode for Vision
  const [isPaperMode, setIsPaperMode] = useState<boolean>(() => {
    return storageService.getSettings().paperScoreMode;
  });

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Vision Score transcription completion
  const handleScoreTranscribed = (score: ScoreProject) => {
    setCurrentScore(score);
    setCurrentView('vision-result');
  };

  // Navigate helper
  const navigateTo = (view: ViewMode) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F4F1EA] flex flex-col selection:bg-[#8B5CF6]/30">
      {/* 4-Beat Rhythmic Intro Animation */}
      {showIntro && (
        <IntroAnimation
          onComplete={() => {
            setShowIntro(false);
          }}
        />
      )}

      {/* Public Landing Page */}
      {currentView === 'landing' ? (
        <LandingPage
          onStart={() => {
            if (!currentUser) {
              setIsOnboardingOpen(true);
            }
            navigateTo('home');
          }}
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setIsAuthOpen(true);
          }}
        />
      ) : (
        /* Authenticated Application Shell (Desktop Rail + Mobile Bottom Bar) */
        <div className="flex h-screen overflow-hidden bg-[#09090B]">
          {/* Left Navigation Rail (Desktop) & Bottom Navigation Bar (Mobile) */}
          <AppNavigation
            currentView={currentView}
            onNavigate={navigateTo}
            isRailCollapsed={isRailCollapsed}
            onToggleRail={() => setIsRailCollapsed(!isRailCollapsed)}
            userRole={currentUser?.role}
          />

          {/* Main Content Viewport */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
            {/* Contextual Top Header */}
            <AppHeader
              currentView={currentView}
              onNavigate={navigateTo}
              onOpenSearch={() => setIsSearchModalOpen(true)}
              title={
                currentView === 'vision-result' 
                  ? currentScore?.title 
                  : undefined
              }
            />

            {/* Dynamic Views */}
            <main className="flex-1">
              {currentView === 'home' && (
                <HomeView
                  onNavigate={navigateTo}
                  onSelectScore={score => {
                    setCurrentScore(score);
                    navigateTo('vision-result');
                  }}
                  scores={storageService.getScores()}
                  userRole={currentUser?.role}
                />
              )}

              {(currentView === 'vision' || currentView === 'vision-capture' || currentView === 'vision-result') && (
                <VisionView
                  currentScore={currentScore}
                  onScoreTranscribed={handleScoreTranscribed}
                  isPaperMode={isPaperMode}
                />
              )}

              {currentView === 'library' && (
                <LibraryView
                  onNavigate={navigateTo}
                  onSelectScore={score => {
                    setCurrentScore(score);
                    navigateTo('vision-result');
                  }}
                />
              )}

              {currentView === 'settings' && (
                <SettingsView
                  onReplayIntro={() => setShowIntro(true)}
                  onPaperModeToggle={(enabled) => setIsPaperMode(enabled)}
                  isPaperMode={isPaperMode}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Global Search Modal (⌘K) */}
      <Modal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="Search Transcriptions"
        maxWidth="md"
      >
        <div className="space-y-4">
          <input
            type="text"
            autoFocus
            value={globalSearchTerm}
            onChange={e => setGlobalSearchTerm(e.target.value)}
            placeholder="Search scores by title or filename..."
            className="w-full bg-[#18181D] border border-[#27272D] focus:border-[#8B5CF6] rounded-xl px-4 py-2.5 text-sm text-[#F4F1EA] focus:outline-none"
          />

          <div className="space-y-1.5 max-h-60 overflow-y-auto font-mono text-xs">
            {storageService.getScores()
              .filter(s => !globalSearchTerm || s.title.toLowerCase().includes(globalSearchTerm.toLowerCase()) || s.originalFilename?.toLowerCase().includes(globalSearchTerm.toLowerCase()))
              .map(sc => (
                <div
                  key={sc.id}
                  onClick={() => {
                    setCurrentScore(sc);
                    navigateTo('vision-result');
                    setIsSearchModalOpen(false);
                  }}
                  className="p-2.5 rounded-lg hover:bg-[#18181D] cursor-pointer flex items-center justify-between text-[#F4F1EA]"
                >
                  <span className="truncate">{sc.title || sc.originalFilename}</span>
                  <span className="text-[#67E8F9] shrink-0 ml-2">SCORE →</span>
                </div>
              ))}
            {storageService.getScores().length === 0 && (
              <div className="py-6 text-center text-[#9A9AA3]">
                No transcriptions found. Upload a score to get started.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsOnboardingOpen(true);
        }}
      />

      {/* Onboarding Persona Question Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={(role) => {
          if (currentUser) {
            setCurrentUser({ ...currentUser, role: role as User['role'] });
          }
          navigateTo('home');
        }}
      />
    </div>
  );
}

export default App;
