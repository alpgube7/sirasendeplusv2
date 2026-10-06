import React, { useState } from 'react';
import { RoomMember, Playlist } from '../types/music';
import {
  Users,
  Crown,
  Music,
  Share2,
  Check,
  Lock,
  Radio,
  Settings,
} from 'lucide-react';

interface RoomMembersProps {
  members: RoomMember[];
  hostId: string;
  currentUserId: string;
  roomId: string;
  roomName: string;
  userPlaylists: Playlist[];
  onSelectActivePlaylist: (playlistId: string) => void;
}

export const RoomMembers: React.FC<RoomMembersProps> = ({
  members,
  hostId,
  currentUserId,
  roomId,
  roomName,
  userPlaylists,
  onSelectActivePlaylist,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?room=${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentMember = members.find((m) => m.userId === currentUserId);

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 backdrop-blur-xl shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Odadakiler</h3>
            <p className="text-[11px] text-slate-400">{members.length} Dinleyici Aktif</p>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
          title="Oda davet bağlantısını kopyala"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Kopyalandı!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Davet Et</span>
            </>
          )}
        </button>
      </div>

      {/* Select Which Playlist you bring to this room */}
      <div className="py-2.5 border-b border-slate-800/60">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
          Bu Odaya Getirdiğin Listen:
        </label>
        <select
          value={currentMember?.activePlaylistId || ''}
          onChange={(e) => onSelectActivePlaylist(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">(Liste seçilmedi - Yalnızca Dinleyici)</option>
          {userPlaylists.map((pl) => (
            <option key={pl.id} value={pl.id}>
              {pl.name} ({pl.tracks.length} parça)
            </option>
          ))}
        </select>
      </div>

      {/* Members list */}
      <div className="space-y-2 mt-3 overflow-y-auto max-h-[220px] pr-1">
        {members.map((member) => {
          const isHost = member.userId === hostId;
          const isMe = member.userId === currentUserId;

          return (
            <div
              key={member.userId}
              className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                isMe
                  ? 'bg-indigo-950/20 border border-indigo-500/20'
                  : 'bg-slate-900/40 border border-slate-800/40 hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <img
                    src={
                      member.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop'
                    }
                    alt={member.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-xs text-white truncate">
                      {member.name} {isMe && '(Sen)'}
                    </span>
                    {isHost && (
                      <span title="Oda Kurucusu" className="inline-flex">
                        <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Music className="w-3 h-3 text-indigo-400" />
                    <span>{member.trackCount} parça sırada</span>
                  </div>
                </div>
              </div>

              <div>
                {member.trackCount > 0 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    DJ Sırasında
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] text-slate-500 bg-slate-800/50">
                    Dinleyici
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
