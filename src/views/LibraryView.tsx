import React, { useState } from 'react';
import { Sparkles, Sliders, Eye, Search, Star, Play, ArrowRight, Music, Filter } from 'lucide-react';
import { LibraryItem, GeneratedSong, ScoreProject, StudioProject, ViewMode } from '../types';
import { storageService } from '../services/storageService';

interface LibraryViewProps {
  onNavigate: (view: ViewMode) => void;
  onSelectSong: (song: GeneratedSong) => void;
  onSelectScore: (score: ScoreProject) => void;
  onSelectStudio: (project: StudioProject) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onNavigate,
  onSelectSong,
  onSelectScore,
  onSelectStudio
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'song' | 'studio' | 'score'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const libraryItems = storageService.getLibraryItems();
  const songs = storageService.getSongs();
  const scores = storageService.getScores();
  const studioProjects = storageService.getStudioProjects();

  const filteredItems = libraryItems.filter(item => {
    if (activeFilter !== 'all' && item.type !== activeFilter) return false;
    if (showFavoritesOnly && !item.favorite) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenItem = (item: LibraryItem) => {
    if (item.type === 'song') {
      const song = songs.find(s => s.id === item.originalRefId) || songs[0];
      if (song) {
        onSelectSong(song);
        onNavigate('create');
      }
    } else if (item.type === 'score') {
      const score = scores.find(s => s.id === item.originalRefId) || scores[0];
      if (score) {
        onSelectScore(score);
        onNavigate('vision-result');
      }
    } else if (item.type === 'studio') {
      const project = studioProjects.find(p => p.id === item.originalRefId) || studioProjects[0];
      if (project) {
        onSelectStudio(project);
        onNavigate('studio');
      }
    }
  };

  const toggleFavorite = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = libraryItems.map(item => 
      item.id === itemId ? { ...item, favorite: !item.favorite } : item
    );
    storageService.saveLibraryItems(updated);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272D]/60 pb-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#A78BFA]">
            UNIFIED REPOSITORY
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F1EA]">
            Library
          </h2>
          <p className="text-xs sm:text-sm text-[#9A9AA3]">
            All generated songs, scanned sheet music scores, and multitrack studio projects.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#111114] p-1.5 rounded-xl border border-[#27272D] text-xs font-mono">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFilter === 'all' ? 'bg-[#8B5CF6] text-white font-semibold' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
            }`}
          >
            All ({libraryItems.length})
          </button>
          <button
            onClick={() => setActiveFilter('song')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFilter === 'song' ? 'bg-[#8B5CF6] text-white font-semibold' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
            }`}
          >
            Songs
          </button>
          <button
            onClick={() => setActiveFilter('score')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFilter === 'score' ? 'bg-[#8B5CF6] text-white font-semibold' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
            }`}
          >
            Scores
          </button>
          <button
            onClick={() => setActiveFilter('studio')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeFilter === 'studio' ? 'bg-[#8B5CF6] text-white font-semibold' : 'text-[#9A9AA3] hover:text-[#F4F1EA]'
            }`}
          >
            Studio
          </button>
        </div>
      </div>

      {/* Search & Favorites Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-[#9A9AA3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search titles, tags, keys..."
            className="w-full bg-[#111114] border border-[#27272D] focus:border-[#8B5CF6] rounded-xl pl-10 pr-3 py-2 text-xs text-[#F4F1EA] placeholder-[#6E6E77] focus:outline-none"
          />
        </div>

        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono border transition-colors cursor-pointer ${
            showFavoritesOnly
              ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#A78BFA]'
              : 'bg-[#111114] border-[#27272D] text-[#9A9AA3] hover:text-[#F4F1EA]'
          }`}
        >
          <Star size={14} fill={showFavoritesOnly ? '#A78BFA' : 'none'} />
          <span>Starred Only</span>
        </button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const typeBadge = {
            song: { label: 'SONG', color: 'bg-[#8B5CF6]/20 text-[#A78BFA] border-[#8B5CF6]/30', icon: Sparkles },
            score: { label: 'SCORE', color: 'bg-[#67E8F9]/20 text-[#67E8F9] border-[#67E8F9]/30', icon: Eye },
            studio: { label: 'STUDIO', color: 'bg-[#4ADE80]/20 text-[#4ADE80] border-[#4ADE80]/30', icon: Sliders }
          }[item.type];

          const Icon = typeBadge.icon;

          return (
            <div
              key={item.id}
              onClick={() => handleOpenItem(item)}
              className="group bg-[#111114] border border-[#27272D] hover:border-[#8B5CF6]/50 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border flex items-center gap-1 ${typeBadge.color}`}>
                      <Icon size={11} />
                      {typeBadge.label}
                    </span>
                    <span className="text-[10px] font-mono text-[#6E6E77]">
                      {item.date}
                    </span>
                  </div>

                  <button
                    onClick={(e) => toggleFavorite(item.id, e)}
                    className="text-[#6E6E77] hover:text-[#FBBF24] p-1 transition-colors"
                  >
                    <Star size={15} fill={item.favorite ? '#FBBF24' : 'none'} className={item.favorite ? 'text-[#FBBF24]' : ''} />
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#F4F1EA] truncate group-hover:text-[#A78BFA] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#9A9AA3] truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-[#18181D] text-[10px] font-mono text-[#9A9AA3] border border-[#27272D]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#9A9AA3] pt-3 border-t border-[#27272D]/60">
                <span>{item.meta}</span>
                <span className="text-[#8B5CF6] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Open →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-[#111114] border border-[#27272D] rounded-2xl p-12 text-center space-y-3">
          <Music size={28} className="text-[#6E6E77] mx-auto" />
          <h4 className="text-base font-semibold text-[#F4F1EA]">No items found</h4>
          <p className="text-xs text-[#9A9AA3] max-w-xs mx-auto">
            Try adjusting your search query or clear the filter.
          </p>
        </div>
      )}
    </div>
  );
};
