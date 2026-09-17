import React from 'react';
import { Eye, FileText, Music, Play, ArrowRight, Download, Camera, Volume2 } from 'lucide-react';
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
            Open MUSIQ
          </Button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
        {/* Brand Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#27272D] bg-[#111114] mb-8 text-xs font-mono text-[#67E8F9] tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-[#67E8F9] animate-pulse" />
          Optical Music Recognition
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#F4F1EA] max-w-4xl leading-[1.1]">
          Turn sheet music into sound.
        </h1>

        {/* Supporting Concept */}
        <p className="mt-6 text-lg sm:text-xl text-[#9A9AA3] max-w-2xl font-normal leading-relaxed">
          Scan paper scores, digitize PDFs, rehearse vocal and instrumental parts, and export production-ready MusicXML, MIDI, and PDF.
        </p>

        {/* Primary CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Button
            size="lg"
            variant="primary"
            icon={<Camera size={18} />}
            onClick={onStart}
            className="w-full sm:w-auto"
          >
            Upload or Scan Score
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              const el = document.getElementById('workflow');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto"
          >
            Explore the Workflow
          </Button>
        </div>

        {/* Product Capabilities Grid */}
        <section id="workflow" className="mt-24 w-full border border-[#27272D] bg-[#111114] rounded-2xl p-6 sm:p-10 shadow-2xl text-left overflow-hidden">
          <div className="text-xs font-mono uppercase text-[#67E8F9] tracking-wider font-semibold mb-2">
            The Transcription Pipeline
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA] mb-8">
            From paper or PDF to interactive sound.
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-[#18181D] border border-[#27272D] rounded-xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA]">
                <Camera size={20} />
              </div>
              <div className="text-xs font-mono text-[#8B5CF6] font-semibold">STEP 01</div>
              <h3 className="text-base font-bold text-[#F4F1EA]">Scan or Upload</h3>
              <p className="text-xs text-[#9A9AA3] leading-relaxed">
                Take high-contrast photos of physical sheet music or upload multi-page PDF documents.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#18181D] border border-[#27272D] rounded-xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#67E8F9]/20 border border-[#67E8F9]/40 flex items-center justify-center text-[#67E8F9]">
                <Eye size={20} />
              </div>
              <div className="text-xs font-mono text-[#67E8F9] font-semibold">STEP 02</div>
              <h3 className="text-base font-bold text-[#F4F1EA]">OMR Recognition</h3>
              <p className="text-xs text-[#9A9AA3] leading-relaxed">
                Audiveris OMR engine reads staves, clefs, key signatures, notes, accidentals, and dynamics.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#18181D] border border-[#27272D] rounded-xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#4ADE80]/20 border border-[#4ADE80]/40 flex items-center justify-center text-[#4ADE80]">
                <Volume2 size={20} />
              </div>
              <div className="text-xs font-mono text-[#4ADE80] font-semibold">STEP 03</div>
              <h3 className="text-base font-bold text-[#F4F1EA]">Interactive Rehearsal</h3>
              <p className="text-xs text-[#9A9AA3] leading-relaxed">
                Play back with cursor tracking, solo or mute individual parts, toggle note names and tonic sol-fa.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-[#18181D] border border-[#27272D] rounded-xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
                <Download size={20} />
              </div>
              <div className="text-xs font-mono text-[#F59E0B] font-semibold">STEP 04</div>
              <h3 className="text-base font-bold text-[#F4F1EA]">Universal Export</h3>
              <p className="text-xs text-[#9A9AA3] leading-relaxed">
                Export standard MusicXML for Sibelius, Dorico, Finale, or MuseScore, plus MIDI and clean PDF.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="mt-24 w-full max-w-4xl text-center">
          <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-[#67E8F9] font-semibold">
            BUILT FOR MUSICIANS & ENSEMBLES
          </h3>
          <p className="text-2xl sm:text-3xl font-bold text-[#F4F1EA] mt-2">
            Engineered for genuine rehearsal and transcription needs.
          </p>

          <div className="mt-10 grid sm:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-[#111114] border border-[#27272D] space-y-3">
              <div className="text-sm font-semibold text-[#67E8F9] flex items-center gap-2">
                <Music size={16} />
                <span>Multi-Part Polyphony</span>
              </div>
              <p className="text-xs text-[#9A9AA3] leading-relaxed">
                Preserves separate parts and voices across complex choral and instrumental scores without collapsing harmonies.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#111114] border border-[#27272D] space-y-3">
              <div className="text-sm font-semibold text-[#8B5CF6] flex items-center gap-2">
                <Play size={16} />
                <span>Section Practice Modes</span>
              </div>
              <p className="text-xs text-[#9A9AA3] leading-relaxed">
                Hear your voice prominent over background accompaniment, loop challenging passages, and adjust playback speed.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#111114] border border-[#27272D] space-y-3">
              <div className="text-sm font-semibold text-[#4ADE80] flex items-center gap-2">
                <FileText size={16} />
                <span>Zero Fake Content</span>
              </div>
              <p className="text-xs text-[#9A9AA3] leading-relaxed">
                Your uploaded score is the sole source of truth. No placeholder songs, no hardcoded scores, no simulated results.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Button
              size="lg"
              variant="primary"
              icon={<ArrowRight size={18} />}
              onClick={onStart}
            >
              Get Started with Your First Score
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#27272D]/60 py-8 px-6 text-center text-xs text-[#9A9AA3]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MusiqMark size={20} />
            <span className="font-semibold text-[#F4F1EA]">MUSIQ</span>
            <span>— Sheet music digitization & rehearsal.</span>
          </div>
          <div>© {new Date().getFullYear()} MUSIQ. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
