import React, { useState } from 'react';
import { Sun, Volume2, Database, RefreshCw } from 'lucide-react';
import { storageService, MusiqSettings } from '../services/storageService';
import { audioEngine, SynthInstrument } from '../services/audioEngine';
import { Button } from '../components/common/Button';

interface SettingsViewProps {
  onReplayIntro: () => void;
  onPaperModeToggle: (enabled: boolean) => void;
  isPaperMode: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onReplayIntro,
  onPaperModeToggle,
  isPaperMode
}) => {
  const [settings, setSettings] = useState<MusiqSettings>(storageService.getSettings());
  const [masterVolume, setMasterVolume] = useState<number>(0.8);

  const handleInstrumentChange = (inst: SynthInstrument) => {
    const updated = { ...settings, defaultInstrument: inst };
    setSettings(updated);
    storageService.saveSettings(updated);
    audioEngine.playNote('C4', 0.6, inst);
  };

  const handlePaperToggle = (checked: boolean) => {
    const updated = { ...settings, paperScoreMode: checked };
    setSettings(updated);
    storageService.saveSettings(updated);
    onPaperModeToggle(checked);
  };

  const handleResetData = () => {
    if (window.confirm('Clear all saved transcription scores and preferences?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[#27272D]/60 pb-5">
        <div className="text-xs font-mono uppercase tracking-widest text-[#A78BFA]">
          WORKSPACE PREFERENCES
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA]">
          Settings
        </h2>
        <p className="text-xs sm:text-sm text-[#9A9AA3]">
          Configure audio engines, score appearance, and production defaults.
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance & Paper Mode */}
        <section className="bg-[#111114] border border-[#27272D] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F4F1EA]">
            <Sun size={17} className="text-[#8B5CF6]" />
            <span>Appearance & Score Canvas</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-[#27272D]/60">
            <div>
              <div className="text-sm font-semibold text-[#F4F1EA]">Warm Paper Score Mode (Vision)</div>
              <div className="text-xs text-[#9A9AA3] max-w-md">
                Renders sheet music on a warm parchment canvas (#F5F2EB) like traditional choir songbooks while retaining dark application chrome.
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPaperMode}
              onChange={e => handlePaperToggle(e.target.checked)}
              className="w-5 h-5 accent-[#8B5CF6] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-semibold text-[#F4F1EA]">MUSIQ Brand Intro</div>
              <div className="text-xs text-[#9A9AA3]">
                Replay the 4-beat geometric musical-note M entrance animation.
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onReplayIntro}
              icon={<RefreshCw size={13} />}
            >
              Replay Intro
            </Button>
          </div>
        </section>

        {/* Audio Engine & Synthesizers */}
        <section className="bg-[#111114] border border-[#27272D] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F4F1EA]">
            <Volume2 size={17} className="text-[#67E8F9]" />
            <span>Web Audio Engine & Vision Synthesizer</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#F4F1EA]">Default Rehearsal Instrument</label>
            <div className="grid grid-cols-3 gap-3">
              {(['piano', 'choir', 'synth'] as SynthInstrument[]).map(inst => (
                <button
                  key={inst}
                  onClick={() => handleInstrumentChange(inst)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.defaultInstrument === inst
                      ? 'bg-[#18181D] border-[#8B5CF6] violet-glow-sm'
                      : 'bg-[#111114] border-[#27272D] hover:border-[#383842]'
                  }`}
                >
                  <div className={`text-xs font-bold capitalize ${settings.defaultInstrument === inst ? 'text-[#A78BFA]' : 'text-[#F4F1EA]'}`}>
                    {inst === 'piano' ? 'Acoustic Piano' : inst === 'choir' ? 'Choir Voice Pad' : 'Warm Synth'}
                  </div>
                  <div className="text-[10px] text-[#6E6E77] font-mono mt-0.5">
                    Web Audio Synthesis
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="py-2">
            <div className="flex justify-between text-xs text-[#9A9AA3] mb-1.5">
              <span>Master Output Volume</span>
              <span className="font-mono text-[#F4F1EA]">{Math.round(masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={masterVolume}
              onChange={e => {
                const vol = parseFloat(e.target.value);
                setMasterVolume(vol);
                audioEngine.setMasterVolume(vol);
              }}
              className="w-full accent-[#8B5CF6]"
            />
          </div>
        </section>

        {/* Storage Reset */}
        <section className="bg-[#111114] border border-[#27272D] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F4F1EA]">
            <Database size={17} className="text-[#FBBF24]" />
            <span>Local Storage & Factory Reset</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-semibold text-[#F4F1EA]">Clear Local Data & Cache</div>
              <div className="text-xs text-[#9A9AA3]">
                Clears locally stored transcription scores, cached notation, and resets workspace preferences.
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleResetData}
            >
              Reset Data
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};
