import React, { useState } from 'react';
import {
  Radio,
  Users,
  Lock,
  Plus,
  Play,
  Search,
  Sparkles,
  Music,
  Shield,
  Disc,
} from 'lucide-react';
import { Playlist } from '../types/music';

interface RoomSummary {
  id: string;
  name: string;
  description: string;
  genre: string;
  coverImage?: string;
  hasPassword: boolean;
  memberCount: number;
  currentTrack: { title: string; artist: string; dj: string } | null;
  playing: boolean;
  hostName: string;
}

interface RoomExplorerProps {
  rooms: RoomSummary[];
  activeRoomId?: string;
  userPlaylists: Playlist[];
  onJoinRoom: (roomId: string, password?: string, playlistId?: string) => void;
  onCreateRoom: (params: {
    name: string;
    description: string;
    genre: string;
    password?: string;
    playlistId?: string;
    coverImage?: string;
  }) => void;
}

const GENRE_TAGS = ['Tümü', 'Karışık & Keşif', 'Synthwave / Lofi', 'Rock & Indie', 'Akustik'];

export const RoomExplorer: React.FC<RoomExplorerProps> = ({
  rooms,
  activeRoomId,
  userPlaylists,
  onJoinRoom,
  onCreateRoom,
}) => {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Tümü');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinModalRoom, setJoinModalRoom] = useState<RoomSummary | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(userPlaylists[0]?.id || '');

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newGenre, setNewGenre] = useState('Karışık & Keşif');
  const [newPassword, setNewPassword] = useState('');
  const [newCover, setNewCover] = useState(
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop'
  );

  const filteredRooms = rooms.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.genre.toLowerCase().includes(search.toLowerCase()) ||
      r.currentTrack?.title?.toLowerCase().includes(search.toLowerCase());
    const matchGenre = selectedGenre === 'Tümü' || r.genre.includes(selectedGenre);
    return matchSearch && matchGenre;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onCreateRoom({
      name: newName.trim(),
      description: newDesc.trim(),
      genre: newGenre,
      password: newPassword.trim() || undefined,
      playlistId: selectedPlaylistId || undefined,
      coverImage: newCover,
    });

    setShowCreateModal(false);
    setNewName('');
    setNewDesc('');
    setNewPassword('');
  };

  const handleJoinClick = (room: RoomSummary) => {
    if (room.hasPassword) {
      setJoinModalRoom(room);
    } else {
      onJoinRoom(room.id, undefined, selectedPlaylistId);
    }
  };

  const handlePasswordJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinModalRoom) return;
    onJoinRoom(joinModalRoom.id, passwordInput, selectedPlaylistId);
    setJoinModalRoom(null);
    setPasswordInput('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-purple-950/70 border border-indigo-500/20 p-6 md:p-8 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
            Müzik Salonundaki Canlı Odalar
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Bir Odaya Katıl ya da Kendin Kur.
          </h2>
          <p className="text-slate-300 text-sm mt-1 leading-relaxed">
            Herkes kendi listesini getirir, parça sırası adil biçimde döner. "Bir sen, bir ben: SıraSende."
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="relative z-10 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all transform active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Oda Kur</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Oda adı, çalan şarkı veya tür ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Genre Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {GENRE_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedGenre(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border ${
                selectedGenre === tag
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map((room) => {
          const isActive = room.id === activeRoomId;
          return (
            <div
              key={room.id}
              className={`rounded-2xl border backdrop-blur-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-indigo-500/40 hover:shadow-xl group ${
                isActive
                  ? 'bg-indigo-950/20 border-indigo-500/50 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/70 border-slate-800/80'
              }`}
            >
              <div>
                {/* Room Cover Photo */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-950">
                  <img
                    src={
                      room.coverImage ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop'
                    }
                    alt={room.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-900/80 backdrop-blur-md text-white border border-slate-700/60 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {room.memberCount} Dinleyici
                    </span>

                    {room.hasPassword && (
                      <span className="p-1 rounded-full bg-slate-900/80 text-amber-400 border border-slate-700/60">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Genre Tag */}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-600/80 text-white backdrop-blur-sm">
                      {room.genre}
                    </span>
                  </div>
                </div>

                {/* Room Info */}
                <div className="p-5">
                  <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {room.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {room.description}
                  </p>

                  {/* Currently Playing Track in Room */}
                  <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5">
                    <Disc
                      className={`w-4 h-4 text-indigo-400 flex-shrink-0 ${
                        room.playing ? 'animate-spin' : ''
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-500 block">ŞU AN ÇALAN:</span>
                      <p className="text-xs font-semibold text-white truncate">
                        {room.currentTrack?.title || 'Şarkı Bekleniyor'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {room.currentTrack?.artist || 'Oda başlatılmadı'} • DJ: {room.currentTrack?.dj || 'Oda'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => handleJoinClick(room)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  {isActive ? (
                    <span>Şu Anda Bu Odadasın</span>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Odaya Katıl & Dinle</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Room */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Yeni Müzik Odası Kur</h3>
            <p className="text-xs text-slate-400 mb-4">
              Odanı aç, arkadaşlarınla birlikte listelerinizden sırayla müzik dinleyin.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Oda Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Gece Sohbeti & Lo-Fi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Açıklama
                </label>
                <input
                  type="text"
                  placeholder="Örn: Herkesin listesinden bir parça."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Müzik Türü
                  </label>
                  <select
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Karışık & Keşif">Karışık & Keşif</option>
                    <option value="Synthwave / Lofi">Synthwave / Lofi</option>
                    <option value="Rock & Indie">Rock & Indie</option>
                    <option value="Akustik">Akustik & Sakin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Şifre (İsteğe Bağlı)
                  </label>
                  <input
                    type="password"
                    placeholder="Boş = Herkese Açık"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Başlangıç Çalma Listen
                </label>
                <select
                  value={selectedPlaylistId}
                  onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">(Liste seçilmedi)</option>
                  {userPlaylists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name} ({pl.tracks.length} parça)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                >
                  Odayı Kur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Password Join */}
      {joinModalRoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              "{joinModalRoom.name}" Şifreli Oda
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Bu odaya katılmak için oda şifresini girmeniz gerekmektedir.
            </p>

            <form onSubmit={handlePasswordJoin} className="space-y-4">
              <input
                type="password"
                required
                autoFocus
                placeholder="Oda Şifresi..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setJoinModalRoom(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                >
                  Giriş Yap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
