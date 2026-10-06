import React from 'react';
import { Track, RoomMember } from '../types/music';
import {
  ListMusic,
  Disc3,
  Clock,
  Sparkles,
  User,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface QueueItemData {
  track: Track;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerColor: string;
  queueIndex: number;
}

interface RoundRobinQueueProps {
  queue: QueueItemData[];
  currentTrack: Track | null;
  currentDjName: string | null;
  members: RoomMember[];
  currentUserId: string;
  onOpenLibrary: () => void;
}

export const RoundRobinQueue: React.FC<RoundRobinQueueProps> = ({
  queue,
  currentTrack,
  currentDjName,
  members,
  currentUserId,
  onOpenLibrary,
}) => {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl flex flex-col h-full">
      {/* Header with Philosophy */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ListMusic className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-base">
              Adil Sıralama Kuyruğu (Round-Robin)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Her katılımcının listesinden sırayla 1 parça çalınır. Kimse sırayı işgal edemez.
          </p>
        </div>

        <button
          onClick={onOpenLibrary}
          className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium transition-colors"
        >
          + Listeni Ekle
        </button>
      </div>

      {/* Visual Turn Rotation Order (Whose turn is coming?) */}
      <div className="py-3 px-1 border-b border-slate-800/40">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Dönüşüm Sırası
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {members
            .filter((m) => m.trackCount > 0)
            .map((member, idx) => {
              const isCurrent = member.name === currentDjName;
              return (
                <div
                  key={member.userId}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap border ${
                    isCurrent
                      ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
                  }`}
                >
                  <img
                    src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop'}
                    alt={member.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="font-medium">{member.name}</span>
                  {isCurrent && (
                    <span className="text-[10px] px-1 py-0.2 bg-indigo-500 text-white rounded font-bold">
                      ÇALIYOR
                    </span>
                  )}
                  {idx < members.filter((m) => m.trackCount > 0).length - 1 && (
                    <ArrowRight className="w-3 h-3 text-slate-600 ml-1" />
                  )}
                </div>
              );
            })}
          {members.filter((m) => m.trackCount > 0).length === 0 && (
            <p className="text-xs text-slate-500 italic">
              Henüz listesi olan aktif katılımcı yok.
            </p>
          )}
        </div>
      </div>

      {/* Upcoming tracks list */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2 max-h-[360px]">
        {/* Currently Playing Card */}
        {currentTrack && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-white shadow-sm">
            <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900">
              <img
                src={currentTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop'}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Disc3 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                  ŞU AN ÇALIYOR
                </span>
                <span className="text-slate-500 text-[10px]">•</span>
                <span className="text-[11px] text-slate-300 font-medium truncate">
                  DJ: {currentDjName || 'Oda'}
                </span>
              </div>
              <p className="font-semibold text-sm text-white truncate">
                {currentTrack.title}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {currentTrack.artist}
              </p>
            </div>
          </div>
        )}

        {/* Queue Items */}
        {queue.map((item, index) => {
          const isMyTrack = item.ownerId === currentUserId;
          return (
            <div
              key={`${item.track.id}-${index}`}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                isMyTrack
                  ? 'bg-slate-800/70 border-purple-500/30 text-slate-200'
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              <div className="w-6 text-center text-xs font-mono font-bold text-slate-500">
                #{index + 1}
              </div>

              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                <img
                  src={item.track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop'}
                  alt={item.track.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs text-white truncate">
                  {item.track.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {item.track.artist}
                </p>
              </div>

              {/* Owner Avatar & Turn Badge */}
              <div className="flex items-center gap-1.5 flex-shrink-0 pl-2 border-l border-slate-800">
                <img
                  src={item.ownerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop'}
                  alt={item.ownerName}
                  className="w-5 h-5 rounded-full object-cover"
                  title={`Liste sahibi: ${item.ownerName}`}
                />
                <span className="text-[11px] font-medium text-slate-400 truncate max-w-[70px]">
                  {isMyTrack ? 'Sen' : item.ownerName}
                </span>
              </div>
            </div>
          );
        })}

        {queue.length === 0 && !currentTrack && (
          <div className="text-center py-8 px-4 text-slate-500">
            <ListMusic className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">
              Henüz sırada bir parça yok
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Katılımcılar listeleriyle odaya katıldığında burada sırayla listelenir.
            </p>
            <button
              onClick={onOpenLibrary}
              className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              Listemden Şarkı Ekle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
