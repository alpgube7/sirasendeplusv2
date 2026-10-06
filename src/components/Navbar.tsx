import React, { useState } from 'react';
import {
  Radio,
  Users,
  Sparkles,
  Bot,
  User,
  Settings,
  Bell,
  Volume2,
  Menu,
} from 'lucide-react';
import { RoomState } from '../types/music';

interface NavbarProps {
  room: RoomState | null;
  userProfile: { id: string; name: string; avatar: string; color: string };
  onUpdateProfile: (name: string, avatar: string, color: string) => void;
  onOpenAiDj?: () => void;
  onToggleMobileMenu?: () => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
];

export const Navbar: React.FC<NavbarProps> = ({
  room,
  userProfile,
  onUpdateProfile,
  onOpenAiDj,
  onToggleMobileMenu,
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editAvatar, setEditAvatar] = useState(userProfile.avatar);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    onUpdateProfile(editName.trim(), editAvatar, userProfile.color);
    setShowProfileModal(false);
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Active Room Info or Mobile menu toggle */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {room ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm md:text-base font-bold text-white truncate max-w-[200px] md:max-w-xs">
                {room.name}
              </h2>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
              <Users className="w-3 h-3 text-indigo-400" />
              {room.members.length} Dinleyici
            </span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            SıraSende Müzik Salonu — Bir odaya katılın veya yeni bir oda kurun
          </div>
        )}
      </div>

      {/* Right: User Profile */}
      <div className="flex items-center gap-3">
        {/* User Profile trigger */}
        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
          title="Profilini düzenle"
        >
          <img
            src={userProfile.avatar}
            alt={userProfile.name}
            className="w-7 h-7 rounded-full object-cover border border-slate-700"
          />
          <span className="text-xs font-medium text-slate-300 hidden sm:inline truncate max-w-[100px]">
            {userProfile.name}
          </span>
        </button>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Profilini Güncelle</h3>
            <p className="text-xs text-slate-400 mb-4">
              Odada ve şarkı sırasında diğer dinleyicilere bu isim ve avatar ile görüneceksin.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Görünen İsmin
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">
                  Avatar Seç
                </label>
                <div className="flex items-center gap-2 justify-center">
                  {AVATAR_OPTIONS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditAvatar(av)}
                      className={`relative rounded-full overflow-hidden p-0.5 border-2 transition-transform ${
                        editAvatar === av
                          ? 'border-indigo-500 scale-110 shadow-lg'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={av} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
