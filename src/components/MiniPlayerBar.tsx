import React from 'react';
import { Track, RoomState } from '../types/music';
import { Play, Pause, SkipForward, Disc3, Radio } from 'lucide-react';

interface MiniPlayerBarProps {
  room: RoomState;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
  onOpenRoom: () => void;
}

export const MiniPlayerBar: React.FC<MiniPlayerBarProps> = ({
  room,
  isPlaying,
  onPlay,
  onPause,
  onSkip,
  onOpenRoom,
}) => {
  const track = room.currentTrack;
  if (!track) return null;

  return (
    <div className="fixed bottom-[58px] md:bottom-4 left-3 right-3 md:left-72 md:right-8 z-30 animate-fade-in">
      <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/60 shadow-2xl backdrop-blur-2xl">
        {/* Clickable Area to jump back to room */}
        <div
          onClick={onOpenRoom}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
            <img
              src={
                track.thumbnail ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop'
              }
              alt={track.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Disc3 className="w-4 h-4 text-indigo-400 animate-spin" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] text-indigo-400 font-semibold truncate">
                {room.name}
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
              {track.title}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {track.artist} • DJ: {room.currentDjName || 'Oda'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isPlaying) onPause();
              else onPlay();
            }}
            className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-transform"
            title={isPlaying ? 'Durdur' : 'Oynat'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Sonraki Parça"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
