import React, { useState } from 'react';
import { Sparkles, Sliders, Eye, Search, ArrowRight, Play, Clock, Music } from 'lucide-react';
import { ViewMode, GeneratedSong, ScoreProject, StudioProject } from '../types';
import { WaveformVisualizer } from '../components/common/WaveformVisualizer';

interface HomeViewProps {
  onNavigate: (view: ViewMode) => void;
  onSelectSong: (song: GeneratedSong) => void;
  onSelectScore: (score: ScoreProject) => void;
  onSelectStudio: (project: StudioProject) => void;
  songs: GeneratedSong[];
  scores: ScoreProject[];
  studioProjects: StudioProject[];
  userRole?: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onSelectSong,
  onSelectScore,
  onSelectStudio,
  songs,
  scores,
  studioProjects,
  userRole
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter recents based on search
  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredScores = scores.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.composer && s.composer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredStudio = studioProjects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-10">
      {/* Primary Prompt / Greeting */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest text-[#A78BFA]">
          {userRole ? `${userRole} WORKSPACE` : 'STUDIO OVERVIEW'}
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F1EA]">
          What do you want to make?
        </h2>
        <p className="text-sm text-[#9A9AA3] max-w-xl">
          Start from a new prompt, open the multitrack production canvas, or transcribe written sheet music.
        </p>
      </div>

      {/* Universal Search Bar */}
      <div className="relative max-w-xl">
        <Search size={17} className="absolute left-4 top-3.5 text-[#9A9AA3]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search songs, sheet music scores, studio projects..."
          className="w-full bg-[#111114] border border-[#27272D] hover:border-[#383842] focus:border-[#8B5CF6] rounded-2xl pl-11 pr-4 py-3 text-sm text-[#F4F1EA] placeholder-[#6E6E77] focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3.5 text-xs text-[#9A9AA3] hover:text-[#F4F1EA]"
          >
            Clear
          </button>
        )}
      </div>

      {/* 3 Core Action Gateways */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Gateway 1: Create a Song */}
        <div
          onClick={() => onNavigate('create')}
          className="group p-6 rounded-2xl bg-[#111114] border border-[#27272D] hover:border-[#8B5CF6]/50 hover:bg-[#18181D] transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-6"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#A78BFA] group-hover:scale-105 transition-transform">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F4F1EA] flex items-center gap-2">
                Create a Song
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#8B5CF6]" />
              </h3>
              <p className="text-xs text-[#9A9AA3] mt-1 leading-relaxed">
                Turn a title, random words, feelings, or lyrical idea into a complete structured song with vocals and stems.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#A78BFA]">
            <span>Start with an idea</span>
            <span>→</span>
          </div>
        </div>

        {/* Gateway 2: New Studio Project */}
        <div
          onClick={() => onNavigate('studio')}
          className="group p-6 rounded-2xl bg-[#111114] border border-[#27272D] hover:border-[#8B5CF6]/50 hover:bg-[#18181D] transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-6"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#67E8F9]/15 border border-[#67E8F9]/30 flex items-center justify-center text-[#67E8F9] group-hover:scale-105 transition-transform">
              <Sliders size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F4F1EA] flex items-center gap-2">
                New Studio Project
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#67E8F9]" />
              </h3>
              <p className="text-xs text-[#9A9AA3] mt-1 leading-relaxed">
                Open the browser multitrack workstation to arrange clips, mix tracks, apply EQ & reverb, or record audio.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#67E8F9]">
            <span>Open production canvas</span>
            <span>→</span>
          </div>
        </div>

        {/* Gateway 3: Scan Sheet Music */}
        <div
          onClick={() => onNavigate('vision')}
          className="group p-6 rounded-2xl bg-[#111114] border border-[#27272D] hover:border-[#8B5CF6]/50 hover:bg-[#18181D] transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-6"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#4ADE80]/15 border border-[#4ADE80]/30 flex items-center justify-center text-[#4ADE80] group-hover:scale-105 transition-transform">
              <Eye size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F4F1EA] flex items-center gap-2">
                Scan Sheet Music
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#4ADE80]" />
              </h3>
              <p className="text-xs text-[#9A9AA3] mt-1 leading-relaxed">
                Photograph or upload written scores. Convert notes into SATB polyphonic playback, sol-fa, and stems.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#4ADE80]">
            <span>Take photo or upload</span>
            <span>→</span>
          </div>
        </div>
      </div>

      {/* Recents Section: Visual Previews */}
      <div className="space-y-8 pt-4">
        {/* Recent Generated Songs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#8B5CF6]" />
              <h3 className="text-sm font-semibold tracking-wide text-[#F4F1EA] uppercase">
                Generated Songs
              </h3>
            </div>
            <button
              onClick={() => onNavigate('library')}
              className="text-xs text-[#9A9AA3] hover:text-[#F4F1EA] transition-colors"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSongs.map(song => (
              <div
                key={song.id}
                onClick={() => {
                  onSelectSong(song);
                  onNavigate('create');
                }}
                className="group bg-[#111114] border border-[#27272D] hover:border-[#8B5CF6]/50 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={song.artworkUrl}
                      alt={song.title}
                      className="w-14 h-14 rounded-xl object-cover border border-[#27272D]"
                    />
                    <div className="truncate">
                      <h4 className="text-sm font-semibold text-[#F4F1EA] truncate group-hover:text-[#A78BFA] transition-colors">
                        {song.title}
                      </h4>
                      <p className="text-xs text-[#9A9AA3] truncate">
                        {song.genre} • {song.mood}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-mono text-[#6E6E77]">
                        {song.tempo} BPM • {song.key}
                      </span>
                    </div>
                  </div>

                  {/* Waveform preview */}
                  <div className="py-1">
                    <WaveformVisualizer peaks={song.waveformPeaks} height={28} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#9A9AA3] pt-2 border-t border-[#27272D]/60 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {Math.floor(song.durationSeconds / 60)}:{(song.durationSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-[#8B5CF6] group-hover:translate-x-0.5 transition-transform">
                    Open song →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Scanned Scores (Vision) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-[#67E8F9]" />
              <h3 className="text-sm font-semibold tracking-wide text-[#F4F1EA] uppercase">
                Scanned Sheet Music (Vision)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('library')}
              className="text-xs text-[#9A9AA3] hover:text-[#F4F1EA] transition-colors"
            >
              View all
            </button>
          </div>

          {filteredScores.length === 0 ? (
            <div 
              onClick={() => onNavigate('vision')}
              className="p-8 rounded-2xl bg-[#111114] border border-[#27272D] hover:border-[#67E8F9]/40 transition-colors cursor-pointer text-center space-y-2"
            >
              <p className="text-sm font-medium text-[#F4F1EA]">No scanned sheet music yet</p>
              <p className="text-xs text-[#9A9AA3]">Upload or photograph sheet music to transcribe it into structured notation.</p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181D] border border-[#27272D] text-xs font-mono text-[#67E8F9]">
                  <Eye size={13} />
                  <span>Scan or Upload a Score →</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScores.map(score => (
                <div
                  key={score.id}
                  onClick={() => {
                    onSelectScore(score);
                    onNavigate('vision-result');
                  }}
                  className="group bg-[#111114] border border-[#27272D] hover:border-[#67E8F9]/50 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#A78BFA] text-[10px] font-mono font-semibold">
                        {score.arrangementType || 'SCORE'}
                      </span>
                      {score.pagesCount && (
                        <span className="text-[11px] font-mono text-[#9A9AA3]">
                          {score.pagesCount} Page{score.pagesCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-[#F4F1EA] truncate group-hover:text-[#67E8F9] transition-colors">
                        {score.title || score.originalFilename}
                      </h4>
                      {score.composer && (
                        <p className="text-xs text-[#9A9AA3] truncate mt-0.5">
                          {score.composer}
                        </p>
                      )}
                    </div>

                    {/* Voice parts preview pills */}
                    {score.parts && score.parts.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                        {score.parts.slice(0, 4).map(part => (
                          <span
                            key={part.id}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#18181D] border border-[#27272D] text-[#F4F1EA]"
                          >
                            {part.shortName || part.name.slice(0, 3)}
                          </span>
                        ))}
                        {score.parts.length > 4 && (
                          <span className="text-[10px] font-mono text-[#9A9AA3]">
                            +{score.parts.length - 4}
                          </span>
                        )}
                        {score.measuresCount > 0 && (
                          <span className="text-[11px] font-mono text-[#9A9AA3] ml-auto">
                            {score.measuresCount} Meas
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#9A9AA3] pt-3 border-t border-[#27272D]/60 mt-3">
                    <span>{score.keySignature ? `${score.keySignature} • ` : ''}{score.tempoBpm ? `${score.tempoBpm} BPM` : 'Score Project'}</span>
                    <span className="text-[#67E8F9] group-hover:translate-x-0.5 transition-transform">
                      View score →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Studio Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-[#4ADE80]" />
              <h3 className="text-sm font-semibold tracking-wide text-[#F4F1EA] uppercase">
                Studio Sessions
              </h3>
            </div>
            <button
              onClick={() => onNavigate('library')}
              className="text-xs text-[#9A9AA3] hover:text-[#F4F1EA] transition-colors"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudio.map(project => (
              <div
                key={project.id}
                onClick={() => {
                  onSelectStudio(project);
                  onNavigate('studio');
                }}
                className="group bg-[#111114] border border-[#27272D] hover:border-[#4ADE80]/50 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-[#18181D] text-[#9A9AA3] text-[10px] font-mono border border-[#27272D]">
                      {project.tracks.length} TRACKS
                    </span>
                    <span className="text-[11px] font-mono text-[#9A9AA3]">
                      {project.bpm} BPM • {project.key}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#F4F1EA] truncate group-hover:text-[#4ADE80] transition-colors">
                      {project.title}
                    </h4>
                    <p className="text-xs text-[#9A9AA3] truncate mt-0.5">
                      Multitrack arrangement • {project.timeSignature}
                    </p>
                  </div>

                  {/* Track color blocks preview */}
                  <div className="flex items-center gap-1 h-3 pt-1">
                    {project.tracks.map(trk => (
                      <div
                        key={trk.id}
                        className="flex-1 h-2 rounded-sm"
                        style={{ backgroundColor: trk.color }}
                        title={trk.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#9A9AA3] pt-3 border-t border-[#27272D]/60 mt-3">
                  <span>Session Ready</span>
                  <span className="text-[#4ADE80] group-hover:translate-x-0.5 transition-transform">
                    Open in Studio →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
