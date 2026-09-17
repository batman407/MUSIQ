import React, { useState } from 'react';
import { Sparkles, Sliders, Eye, ArrowRight, Music, Check, Volume2 } from 'lucide-react';
import { MusiqWordmark, MusiqMark } from '../components/brand/MusiqLogo';
import { Button } from '../components/common/Button';

interface LandingPageProps {
  onStart: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStart,
  onOpenAuth
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'studio' | 'vision'>('create');

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F4F1EA] flex flex-col selection:bg-[#8B5CF6]/30">
      {/* Editorial Header */}
      <header className="h-20 border-b border-[#27272D]/60 px-6 md:px-12 flex items-center justify-between max-w-7xl mx-auto w-full">
        <MusiqWordmark size="md" showTagline={false} />

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth('signin')}
            className="text-sm font-medium text-[#9A9AA3] hover:text-[#F4F1EA] px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <Button
            size="sm"
            variant="primary"
            onClick={onStart}
          >
            Enter Studio
          </Button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
        {/* Brand Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#27272D] bg-[#111114] mb-8 text-xs font-mono text-[#A78BFA] tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
          Music Starts Here
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#F4F1EA] max-w-4xl leading-[1.1]">
          The Intelligent Music Canvas.
        </h1>

        {/* Supporting Concept */}
        <p className="mt-6 text-lg sm:text-xl text-[#9A9AA3] max-w-2xl font-normal leading-relaxed">
          Create it. Produce it. Read it. Hear it. <br className="hidden sm:inline" />
          A unified ecosystem connecting raw musical ideas, professional multitrack production, and optical score reading.
        </p>

        {/* Primary CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Button
            size="lg"
            variant="primary"
            icon={<Sparkles size={18} />}
            onClick={onStart}
            className="w-full sm:w-auto"
          >
            Start Creating
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              const el = document.getElementById('ecosystem');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto"
          >
            Explore the Ecosystem
          </Button>
        </div>

        {/* Interactive Product Demonstration Showcase */}
        <section className="mt-20 w-full border border-[#27272D] bg-[#111114] rounded-2xl p-4 sm:p-8 shadow-2xl text-left overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-[#27272D]/70">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#9A9AA3] hover:text-[#F4F1EA] hover:bg-[#18181D]'
              }`}
            >
              <Sparkles size={16} />
              <span>MUSIQ CREATE</span>
            </button>

            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#9A9AA3] hover:text-[#F4F1EA] hover:bg-[#18181D]'
              }`}
            >
              <Sliders size={16} />
              <span>MUSIQ STUDIO</span>
            </button>

            <button
              onClick={() => setActiveTab('vision')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'vision'
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#9A9AA3] hover:text-[#F4F1EA] hover:bg-[#18181D]'
              }`}
            >
              <Eye size={16} />
              <span>MUSIQ VISION</span>
            </button>
          </div>

          {/* Tab Previews */}
          <div className="mt-6">
            {activeTab === 'create' && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="text-xs font-mono uppercase text-[#A78BFA] tracking-wider font-semibold">
                    01 • Idea to Complete Song
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA]">
                    Turn any feeling, phrase, or gibberish into music.
                  </h2>
                  <p className="text-sm text-[#9A9AA3] leading-relaxed">
                    Type a title, humming thought, or full lyric concept. Choose genres from Afrobeats, Gospel, and R&B to Amapiano and Classical. Receive full verse-chorus arrangements with stems ready for production.
                  </p>
                  <div className="pt-2">
                    <Button size="sm" variant="secondary" onClick={onStart} icon={<ArrowRight size={14} />}>
                      Try MUSIQ Create
                    </Button>
                  </div>
                </div>

                {/* Simulated Create Preview Card */}
                <div className="bg-[#18181D] border border-[#27272D] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#9A9AA3]">
                    <span className="font-mono">PROMPT PREVIEW</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA] font-medium">Afrobeats • 104 BPM</span>
                  </div>
                  <div className="p-3 bg-[#111114] rounded-lg border border-[#27272D]/70 text-xs font-mono text-[#F4F1EA]">
                    "Midnight in Lagos — hustle every day, nobody knows what I sacrifice..."
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA]">
                      <Music size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#F4F1EA]">Midnight in Lagos</div>
                      <div className="text-xs text-[#9A9AA3]">6 Sections • Lead Vocals + Harmony Stems</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'studio' && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="text-xs font-mono uppercase text-[#A78BFA] tracking-wider font-semibold">
                    02 • Browser Production Environment
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA]">
                    Shape every sound in a calm, focused workspace.
                  </h2>
                  <p className="text-sm text-[#9A9AA3] leading-relaxed">
                    A responsive workstation that gives desktop depth and mobile focus. Arrange clips, balance stems, shape 3-band EQ, reverb, and delays with zero unnecessary visual clutter.
                  </p>
                  <div className="pt-2">
                    <Button size="sm" variant="secondary" onClick={onStart} icon={<ArrowRight size={14} />}>
                      Open Studio
                    </Button>
                  </div>
                </div>

                {/* Simulated Studio Timeline Preview */}
                <div className="bg-[#18181D] border border-[#27272D] rounded-xl p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#27272D] text-[#9A9AA3]">
                    <span>MULTITRACK TIMELINE</span>
                    <span className="text-[#8B5CF6] font-semibold">BAR 04 : 01</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-[10px] text-[#9A9AA3] truncate">01 Drums</span>
                    <div className="flex-1 h-6 bg-[#EF4444]/20 border border-[#EF4444]/40 rounded flex items-center px-2 text-[10px] text-[#EF4444]">
                      Afrobeat Groove 104 BPM
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-[10px] text-[#9A9AA3] truncate">02 Bass</span>
                    <div className="flex-1 h-6 bg-[#FBBF24]/20 border border-[#FBBF24]/40 rounded flex items-center px-2 text-[10px] text-[#FBBF24]">
                      Sub Bassline F#
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-[10px] text-[#9A9AA3] truncate">03 Vocals</span>
                    <div className="flex-1 h-6 bg-[#8B5CF6]/30 border border-[#8B5CF6] rounded flex items-center px-2 text-[10px] text-[#A78BFA] font-semibold">
                      Main Vocal Take 01
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vision' && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="text-xs font-mono uppercase text-[#A78BFA] tracking-wider font-semibold">
                    03 • Optical Score Recognition & Choir Rehearsal
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA]">
                    Turn sheet music into sound.
                  </h2>
                  <p className="text-sm text-[#9A9AA3] leading-relaxed">
                    Photograph or upload written scores. MUSIQ preserves Soprano, Alto, Tenor, and Bass polyphonic relationships. Solo any part or hear your voice balanced over background harmony.
                  </p>
                  <div className="pt-2">
                    <Button size="sm" variant="secondary" onClick={onStart} icon={<ArrowRight size={14} />}>
                      Scan Sheet Music
                    </Button>
                  </div>
                </div>

                {/* Multi-Part Score Transcription Architecture */}
                <div className="bg-[#18181D] border border-[#27272D] rounded-xl p-4 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#27272D] text-[#9A9AA3]">
                    <span>MULTI-PART NOTATION PREVIEW</span>
                    <span className="text-[#67E8F9] font-semibold">STRUCTURED XML</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 items-center p-1.5 rounded bg-[#111114]">
                    <span className="text-[#8B5CF6] font-bold">PART 1</span>
                    <span className="col-span-4 text-[#9A9AA3] truncate">Treble Clef • Key Signature • Notes</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 items-center p-1.5 rounded bg-[#8B5CF6]/20 border border-[#8B5CF6]">
                    <span className="text-[#A78BFA] font-bold">PART 2</span>
                    <span className="col-span-4 text-[#F4F1EA] font-semibold truncate">Alto Clef / Horn / Voice • Pitches & Rhythms</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 items-center p-1.5 rounded bg-[#111114]">
                    <span className="text-[#67E8F9] font-bold">PART 3</span>
                    <span className="col-span-4 text-[#9A9AA3] truncate">Bass Clef • Polyphonic Staves & Barlines</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 items-center p-1.5 rounded bg-[#111114]">
                    <span className="text-[#4ADE80] font-bold">PART 4</span>
                    <span className="col-span-4 text-[#9A9AA3] truncate">Continuous Multi-Page Systems & Measures</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Ecosystem Connectivity Section */}
        <section id="ecosystem" className="mt-28 w-full max-w-4xl text-center">
          <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-[#A78BFA] font-semibold">
            CONNECTED ECOSYSTEM
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-[#F4F1EA] mt-2">
            One fluid path from inspiration to master.
          </p>

          <div className="mt-12 grid sm:grid-cols-2 gap-6 text-left">
            {/* Flow 1 */}
            <div className="p-6 rounded-2xl bg-[#111114] border border-[#27272D] space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#8B5CF6]">
                <Sparkles size={16} />
                <span>The Creation Journey</span>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#F4F1EA]">
                  <span className="w-5 h-5 rounded-full bg-[#18181D] flex items-center justify-center text-[#A78BFA] text-[10px]">1</span>
                  <span>Idea / Prompt / Lyrics</span>
                </div>
                <div className="pl-2.5 border-l border-[#27272D] text-[#9A9AA3] py-0.5 ml-2.5">
                  AI arrangements with stems & sections
                </div>
                <div className="flex items-center gap-2 text-[#F4F1EA]">
                  <span className="w-5 h-5 rounded-full bg-[#18181D] flex items-center justify-center text-[#A78BFA] text-[10px]">2</span>
                  <span>Open in MUSIQ Studio</span>
                </div>
                <div className="pl-2.5 border-l border-[#27272D] text-[#9A9AA3] py-0.5 ml-2.5">
                  Multi-track mixing, effects & arrangements
                </div>
                <div className="flex items-center gap-2 text-[#4ADE80]">
                  <span className="w-5 h-5 rounded-full bg-[#18181D] flex items-center justify-center text-[#4ADE80] text-[10px]">✓</span>
                  <span>Export Master Audio</span>
                </div>
              </div>
            </div>

            {/* Flow 2 */}
            <div className="p-6 rounded-2xl bg-[#111114] border border-[#27272D] space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#67E8F9]">
                <Eye size={16} />
                <span>The Sheet Music Journey</span>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#F4F1EA]">
                  <span className="w-5 h-5 rounded-full bg-[#18181D] flex items-center justify-center text-[#67E8F9] text-[10px]">1</span>
                  <span>Camera Photo / PDF Score</span>
                </div>
                <div className="pl-2.5 border-l border-[#27272D] text-[#9A9AA3] py-0.5 ml-2.5">
                  OMR transcription preserving SATB harmony
                </div>
                <div className="flex items-center gap-2 text-[#F4F1EA]">
                  <span className="w-5 h-5 rounded-full bg-[#18181D] flex items-center justify-center text-[#67E8F9] text-[10px]">2</span>
                  <span>Choir Rehearsal & Solo Voice</span>
                </div>
                <div className="pl-2.5 border-l border-[#27272D] text-[#9A9AA3] py-0.5 ml-2.5">
                  Score, Note Names, and Tonic Sol-fa views
                </div>
                <div className="flex items-center gap-2 text-[#4ADE80]">
                  <span className="w-5 h-5 rounded-full bg-[#18181D] flex items-center justify-center text-[#4ADE80] text-[10px]">✓</span>
                  <span>Open Stems in Studio</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#27272D]/60 py-8 px-6 text-center text-xs text-[#9A9AA3]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MusiqMark size={20} />
            <span className="font-semibold text-[#F4F1EA]">MUSIQ</span>
            <span>— Music starts here.</span>
          </div>
          <div>© {new Date().getFullYear()} MUSIQ. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};
