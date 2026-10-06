import React, { useState, useEffect, useCallback } from 'react';
import { api, MusicApiResponse } from './services/api';
import { RoomState, Playlist, FloatingReaction } from './types/music';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { RoomExplorer } from './components/RoomExplorer';
import { RoomView } from './components/RoomView';
import { MyLibrary } from './components/MyLibrary';
import { ReactionsOverlay } from './components/ReactionsOverlay';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MiniPlayerBar } from './components/MiniPlayerBar';
import { AudioUnlocker } from './components/AudioUnlocker';
import { Disc3 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'room' | 'library'>('room');
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('oda-salon-1');
  const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [clockDrift, setClockDrift] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [userProfile, setUserProfile] = useState(() => api.getUserProfile());

  // Desktop keyboard shortcuts (Space to toggle play/pause, N to skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (currentRoom) {
          if (currentRoom.playing) {
            handlePause(currentRoom.offsetSeconds);
          } else {
            handlePlay(currentRoom.offsetSeconds);
          }
        }
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRoom]);

  // Check URL query parameters for room id
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        setActiveRoomId(roomParam);
      }
    } catch {}
  }, []);

  // Fetch state from server
  const loadState = useCallback(async (roomIdToLoad?: string) => {
    const targetRoomId = roomIdToLoad || activeRoomId;
    try {
      const res = await api.fetchMusicState(targetRoomId);
      setRooms(res.rooms);
      setCurrentRoom(res.room);
      setQueue(res.queue);
      setPlaylists(res.playlists);
      setClockDrift(res.serverTime - Date.now());

      if (res.room) {
        setActiveRoomId(res.room.id);
      } else if (res.rooms.length > 0 && !res.room) {
        // Fallback to first room
        setActiveRoomId(res.rooms[0].id);
      }
    } catch (err) {
      console.warn('Error loading state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeRoomId]);

  useEffect(() => {
    loadState(activeRoomId);
  }, [activeRoomId, loadState]);

  // Connect WebSockets
  useEffect(() => {
    api.connectWebSocket(activeRoomId);

    const unsubRoom = api.on('room_updated', (updatedRoom: RoomState) => {
      if (updatedRoom && updatedRoom.id === activeRoomId) {
        setCurrentRoom(updatedRoom);
      }
    });

    const unsubChat = api.on('chat_message', (msg) => {
      setCurrentRoom((prev) => {
        if (!prev) return prev;
        const exists = prev.messages.some((m) => m.id === msg.id);
        if (exists) return prev;
        return {
          ...prev,
          messages: [...prev.messages, msg],
        };
      });
    });

    const unsubReaction = api.on('reaction', (react: FloatingReaction) => {
      setReactions((prev) => [...prev, react]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== react.id));
      }, 3500);
    });

    return () => {
      unsubRoom();
      unsubChat();
      unsubReaction();
    };
  }, [activeRoomId]);

  // Periodic polling fallback
  useEffect(() => {
    const timer = setInterval(() => {
      loadState(activeRoomId);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeRoomId, loadState]);

  // Actions
  const handlePlay = async (offset: number) => {
    try {
      await api.postAction('play', { room: activeRoomId, offset });
      loadState();
    } catch (err: any) {
      console.warn(err);
    }
  };

  const handlePause = async (offset: number) => {
    try {
      await api.postAction('pause', { room: activeRoomId, offset });
      loadState();
    } catch (err: any) {
      console.warn(err);
    }
  };

  const handleSeek = async (offset: number) => {
    try {
      await api.postAction('seek', { room: activeRoomId, offset, playing: true });
      loadState();
    } catch (err: any) {
      console.warn(err);
    }
  };

  const handleSkip = async () => {
    try {
      await api.postAction('skip', { room: activeRoomId });
      loadState();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVoteSkip = async () => {
    try {
      await api.postAction('voteSkip', { room: activeRoomId });
      loadState();
    } catch (err: any) {
      console.warn(err);
    }
  };

  const handleSendMessage = async (text: string) => {
    try {
      await api.postAction('message', { room: activeRoomId, text });
      loadState();
    } catch (err: any) {
      console.warn(err);
    }
  };

  const handleSendReaction = (emoji: string) => {
    api.sendReaction(activeRoomId, emoji, userProfile.name);
    // Also trigger locally for immediate feedback
    const localReact: FloatingReaction = {
      id: `local-${Date.now()}-${Math.random()}`,
      emoji,
      senderName: userProfile.name,
      x: Math.floor(Math.random() * 60 + 20),
      y: 80,
    };
    setReactions((prev) => [...prev, localReact]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== localReact.id));
    }, 3500);
  };

  const handleTriggerAiDj = async () => {
    try {
      await api.triggerAiDjAnnounce(activeRoomId);
      loadState();
    } catch (err: any) {
      alert(err.message || 'AI DJ anonsu başlatılamadı');
    }
  };

  const handleJoinRoom = async (roomId: string, password?: string, playlistId?: string) => {
    try {
      await api.postAction('join', {
        room: roomId,
        password,
        playlistId: playlistId || playlists[0]?.id,
      });
      setActiveRoomId(roomId);
      setActiveTab('room');
      loadState(roomId);
    } catch (err: any) {
      alert(err.message || 'Odaya katılınamadı');
    }
  };

  const handleCreateRoom = async (params: any) => {
    try {
      const res = await api.postAction('createRoom', {
        ...params,
        playlistId: params.playlistId || playlists[0]?.id,
      });
      if (res.newRoomId) {
        setActiveRoomId(res.newRoomId);
        setActiveTab('room');
        loadState(res.newRoomId);
      }
    } catch (err: any) {
      alert(err.message || 'Oda oluşturulamadı');
    }
  };

  const handleSelectActivePlaylist = async (playlistId: string) => {
    try {
      await api.postAction('join', {
        room: activeRoomId,
        playlistId,
      });
      loadState();
    } catch (err: any) {
      console.warn(err);
    }
  };

  const handleUpdateProfile = (name: string, avatar: string, color: string) => {
    api.setUserProfile(name, avatar, color);
    setUserProfile({ id: userProfile.id, name, avatar, color });
  };

  if (isLoading && !currentRoom) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Disc3 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold">SıraSende Yükleniyor...</h2>
        <p className="text-xs text-slate-400 mt-1">Birlikte dinlemenin en adil hali</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Floating Reactions across screen */}
      <ReactionsOverlay reactions={reactions} />

      {/* Sidebar Desktop */}
      <div className="hidden md:block">
        <Sidebar
          currentTab={activeTab}
          onSelectTab={setActiveTab}
          myRooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
          activeRoomId={activeRoomId}
          onSelectRoom={(id) => {
            setActiveRoomId(id);
            setActiveTab('room');
          }}
          onOpenCreateRoom={() => setActiveTab('rooms')}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm flex">
          <div className="w-72 bg-slate-950 h-full p-4">
            <Sidebar
              currentTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
              myRooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
              activeRoomId={activeRoomId}
              onSelectRoom={(id) => {
                setActiveRoomId(id);
                setActiveTab('room');
                setMobileMenuOpen(false);
              }}
              onOpenCreateRoom={() => {
                setActiveTab('rooms');
                setMobileMenuOpen(false);
              }}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navbar */}
        <Navbar
          room={currentRoom}
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Dynamic Tab Body with mobile safe area bottom padding */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-32 md:pb-16">
          <div className="max-w-7xl mx-auto pb-8">
            {activeTab === 'room' && currentRoom && (
              <RoomView
                room={currentRoom}
                queue={queue}
                userPlaylists={playlists}
                currentUserId={userProfile.id}
                clockDrift={clockDrift}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeek={handleSeek}
                onSkip={handleSkip}
                onVoteSkip={handleVoteSkip}
                onSendMessage={handleSendMessage}
                onSendReaction={handleSendReaction}
                onSelectActivePlaylist={handleSelectActivePlaylist}
                onOpenLibrary={() => setActiveTab('library')}
              />
            )}

            {activeTab === 'rooms' && (
              <RoomExplorer
                rooms={rooms}
                activeRoomId={activeRoomId}
                userPlaylists={playlists}
                onJoinRoom={handleJoinRoom}
                onCreateRoom={handleCreateRoom}
              />
            )}

            {activeTab === 'library' && (
              <MyLibrary
                playlists={playlists}
                currentUserId={userProfile.id}
                activeRoomId={activeRoomId}
                onRefreshPlaylists={() => loadState()}
                onSelectPlaylistForRoom={(plId) => {
                  handleSelectActivePlaylist(plId);
                  setActiveTab('room');
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mini Player Bar: Visible when not on 'room' tab but music is loaded */}
      {activeTab !== 'room' && currentRoom && currentRoom.currentTrack && (
        <MiniPlayerBar
          room={currentRoom}
          isPlaying={currentRoom.playing}
          onPlay={() => handlePlay(currentRoom.offsetSeconds)}
          onPause={() => handlePause(currentRoom.offsetSeconds)}
          onSkip={handleSkip}
          onOpenRoom={() => setActiveTab('room')}
        />
      )}

      {/* iOS / Android Autoplay Policy Audio Unlocker */}
      <AudioUnlocker
        isPlaying={currentRoom?.playing || false}
        onUnlock={() => {
          if (currentRoom) handlePlay(currentRoom.offsetSeconds);
        }}
      />

      {/* Mobile Bottom Navigation Bar (iOS / Android) */}
      <MobileBottomNav
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        isPlaying={currentRoom?.playing || false}
        hasActiveRoom={!!currentRoom}
      />
    </div>
  );
}
