import React, { useState, useEffect } from 'react';
import { Playlist, Track } from '../types/music';
import {
  Plus,
  Music,
  Trash2,
  ExternalLink,
  Search,
  Link,
  Play,
  FolderPlus,
  Check,
  Disc,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';

interface MyLibraryProps {
  playlists: Playlist[];
  currentUserId: string;
  activeRoomId?: string;
  onRefreshPlaylists: () => void;
  onSelectPlaylistForRoom?: (playlistId: string) => void;
}

export const MyLibrary: React.FC<MyLibraryProps> = ({
  playlists,
  currentUserId,
  activeRoomId,
  onRefreshPlaylists,
  onSelectPlaylistForRoom,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(
    playlists[0]?.id || ''
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  // Add track form state
  const [addMode, setAddMode] = useState<'search' | 'url'>('search');
  const [urlInput, setUrlInput] = useState('');
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const [resolvedTrack, setResolvedTrack] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!selectedPlaylistId && playlists.length > 0) {
      setSelectedPlaylistId(playlists[0].id);
    }
  }, [playlists, selectedPlaylistId]);

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    try {
      const res = await api.postAction('createPlaylist', {
        name: newPlaylistName.trim(),
        description: newPlaylistDesc.trim(),
      });
      if (res.playlist) {
        setSelectedPlaylistId(res.playlist.id);
      }
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setShowCreateModal(false);
      onRefreshPlaylists();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolveUrl = async () => {
    if (!urlInput.trim()) return;
    setIsResolvingUrl(true);
    setResolvedTrack(null);
    try {
      const trackData = await api.parseMediaUrl(urlInput.trim());
      setResolvedTrack(trackData);
    } catch (err: any) {
      alert(err.message || 'Geçersiz müzik bağlantısı');
    } finally {
      setIsResolvingUrl(false);
    }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.searchMedia(q.trim());
      setSearchResults(res);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddTrack = async (trackData: any) => {
    if (!selectedPlaylistId) return;
    try {
      await api.postAction('addTrack', {
        playlistId: selectedPlaylistId,
        title: trackData.title,
        artist: trackData.artist,
        url: trackData.url || `https://www.youtube.com/watch?v=${trackData.id}`,
        provider: trackData.provider || 'youtube',
        duration: trackData.duration || 200,
        thumbnail: trackData.thumbnail,
        room: activeRoomId,
      });
      setSuccessMsg(`"${trackData.title}" listeye eklendi!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      onRefreshPlaylists();
      setResolvedTrack(null);
      setUrlInput('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!selectedPlaylistId) return;
    try {
      await api.postAction('removeTrack', {
        playlistId: selectedPlaylistId,
        trackId,
      });
      onRefreshPlaylists();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Kişisel Çalma Listelerim
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Odalara katıldığında bu listelerindeki parçalar sırayla (round-robin) diğer dinleyicilerle paylaşılır.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-indigo-400" />
            <span>Yeni Liste Oluştur</span>
          </button>

          {activePlaylist && (
            <button
              onClick={() => setShowAddTrackModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Şarkı Ekle</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Playlist Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {playlists.map((pl) => (
          <button
            key={pl.id}
            onClick={() => setSelectedPlaylistId(pl.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border flex items-center gap-2 ${
              pl.id === selectedPlaylistId
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-md'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Disc className="w-3.5 h-3.5 text-indigo-400" />
            <span>{pl.name}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">
              {pl.tracks.length}
            </span>
          </button>
        ))}
      </div>

      {/* Active Playlist Detail view */}
      {activePlaylist ? (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {activePlaylist.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {activePlaylist.description || 'Açıklama yok'} • {activePlaylist.tracks.length} parça
              </p>
            </div>

            {onSelectPlaylistForRoom && activeRoomId && (
              <button
                onClick={() => onSelectPlaylistForRoom(activePlaylist.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-medium border border-purple-500/30 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Bu Listeyi Odaya Bağla</span>
              </button>
            )}
          </div>

          {/* Track List */}
          <div className="divide-y divide-slate-800/60 mt-2">
            {activePlaylist.tracks.map((track, idx) => (
              <div
                key={track.id}
                className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-slate-800/30 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-center text-xs font-mono text-slate-500">
                    {idx + 1}
                  </span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                    <img
                      src={track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop'}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">
                      {track.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500">
                    {Math.floor(track.duration / 60)}:
                    {(track.duration % 60).toString().padStart(2, '0')}
                  </span>

                  {track.url && (
                    <a
                      href={track.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                      title="Kaynak bağlantı"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => handleRemoveTrack(track.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Listeden Çıkar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {activePlaylist.tracks.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Music className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm text-slate-300 font-medium">Bu listede henüz şarkı yok</p>
                <p className="text-xs text-slate-500 mt-1">
                  YouTube veya Spotify bağlantısı yapıştırarak ya da hazır arama kataloğundan şarkı ekleyebilirsiniz.
                </p>
                <button
                  onClick={() => setShowAddTrackModal(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                >
                  Şarkı Ekle
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <p>Henüz bir çalma listeniz yok. Başlamak için yeni bir liste oluşturun.</p>
        </div>
      )}

      {/* Modal: Create Playlist */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Yeni Çalma Listesi Oluştur</h3>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Liste Adı
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Akşam Yolculukları, Favoriler"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Açıklama (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: En sevdiğim lo-fi & indie parçalar"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                >
                  Listeyi Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Track (Search or URL) */}
      {showAddTrackModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              "{activePlaylist?.name}" Listesine Şarkı Ekle
            </h3>

            {/* Mode Toggle */}
            <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setAddMode('search')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  addMode === 'search'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Katalogdan Ara
              </button>
              <button
                type="button"
                onClick={() => setAddMode('url')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  addMode === 'url'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                YouTube / Spotify URL Yapıştır
              </button>
            </div>

            {addMode === 'search' ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Şarkı veya sanatçı adı ara (Örn: Barış Manço, M83, Madrigal)..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/80 pr-1">
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-800/40 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={result.thumbnail}
                          alt={result.title}
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {result.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {result.artist}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddTrack(result)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-medium transition-colors"
                      >
                        + Ekle
                      </button>
                    </div>
                  ))}

                  {searchQuery && searchResults.length === 0 && !isSearching && (
                    <p className="text-center py-6 text-xs text-slate-500">
                      Sonuç bulunamadı. "YouTube URL" sekmesinden doğrudan bağlantı yapıştırabilirsiniz!
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    YouTube veya Spotify Bağlantısı
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=... veya Spotify parça linki"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleResolveUrl}
                      disabled={isResolvingUrl || !urlInput.trim()}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium disabled:opacity-50"
                    >
                      {isResolvingUrl ? 'Getiriliyor...' : 'Getir'}
                    </button>
                  </div>
                </div>

                {resolvedTrack && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={resolvedTrack.thumbnail}
                        alt={resolvedTrack.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-indigo-400">
                          {resolvedTrack.provider}
                        </span>
                        <p className="text-xs font-bold text-white truncate">
                          {resolvedTrack.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {resolvedTrack.artist}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddTrack({ ...resolvedTrack, url: urlInput })}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                    >
                      Listeye Ekle
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowAddTrackModal(false);
                  setResolvedTrack(null);
                  setUrlInput('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
