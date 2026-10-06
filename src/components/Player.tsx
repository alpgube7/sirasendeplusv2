import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Track, RoomState } from '../types/music';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  ExternalLink,
  Vote,
  Music2,
  CheckCircle2,
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

// Global iframe script loaders
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytPromise: Promise<any> | null = null;
function loadYouTubeApi(): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytPromise) return ytPromise;
  ytPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('yt-iframe-api');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'yt-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => reject(new Error('YouTube API yüklenemedi'));
      document.head.appendChild(script);
    }
    const oldReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      oldReady?.();
      resolve(window.YT);
    };
  });
  return ytPromise;
}

interface PlayerProps {
  room: RoomState;
  clockDrift: number;
  currentUserId: string;
  isHost: boolean;
  onPlay: (offset: number) => void;
  onPause: (offset: number) => void;
  onSeek: (offset: number) => void;
  onSkip: () => void;
  onVoteSkip: () => void;
  onTriggerAiDj?: () => void;
}

export const Player: React.FC<PlayerProps> = ({
  room,
  clockDrift,
  currentUserId,
  isHost,
  onPlay,
  onPause,
  onSeek,
  onSkip,
  onVoteSkip,
  onTriggerAiDj,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [volume, setVolume] = useState<number>(75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  const track = room.currentTrack;
  const isPlaying = room.playing;

  // Extract YouTube ID if applicable
  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      if (u.hostname === 'youtu.be') return u.pathname.slice(1);
      if (u.hostname.includes('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v) return v;
        const parts = u.pathname.split('/').filter(Boolean);
        if (['shorts', 'embed', 'live'].includes(parts[0])) return parts[1];
      }
    } catch {}
    return null;
  };

  const ytVideoId = track ? getYouTubeId(track.url) : null;
  const isAiTrack = track?.provider === 'ai' || !!track?.audioBlobUrl;
  const isSpotify = track?.provider === 'spotify';

  // Compute synchronized target time
  const calculateSyncTime = useCallback(() => {
    if (!room.startedAt) return room.offsetSeconds || 0;
    const elapsed = room.playing
      ? (Date.now() + clockDrift - room.startedAt) / 1000
      : 0;
    return Math.max(0, room.offsetSeconds + elapsed);
  }, [room.startedAt, room.offsetSeconds, room.playing, clockDrift]);

  // Initialize YouTube player
  useEffect(() => {
    if (!ytVideoId || !containerRef.current) return;

    let isCancelled = false;
    const holder = document.createElement('div');
    holder.id = `yt-embed-${Date.now()}`;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(holder);

    loadYouTubeApi()
      .then((YT) => {
        if (isCancelled) return;
        ytPlayerRef.current = new YT.Player(holder.id, {
          width: '100%',
          height: '100%',
          videoId: ytVideoId,
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              if (isCancelled) return;
              setIsPlayerReady(true);
              e.target.setVolume(isMuted ? 0 : volume);
              const target = calculateSyncTime();
              e.target.seekTo(target, true);
              if (isPlaying) {
                e.target.playVideo();
              }
              const d = e.target.getDuration();
              if (d && d > 0) setDuration(d);
            },
            onStateChange: (e: any) => {
              // Ended state = 0
              if (e.data === 0) {
                if (isHost || room.currentDjUserId === currentUserId) {
                  onSkip();
                }
              }
            },
          },
        });
      })
      .catch((err) => console.warn('YouTube load error:', err));

    return () => {
      isCancelled = true;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
    };
  }, [ytVideoId]);

  // Sync YouTube playback
  useEffect(() => {
    if (!ytPlayerRef.current || !isPlayerReady) return;
    try {
      const targetTime = calculateSyncTime();
      const current = ytPlayerRef.current.getCurrentTime?.() || 0;
      if (Math.abs(current - targetTime) > 3.5) {
        ytPlayerRef.current.seekTo(targetTime, true);
      }
      if (isPlaying) {
        ytPlayerRef.current.playVideo();
      } else {
        ytPlayerRef.current.pauseVideo();
      }
    } catch {}
  }, [isPlaying, room.offsetSeconds, room.startedAt, isPlayerReady, calculateSyncTime]);

  // Volume change
  useEffect(() => {
    if (ytPlayerRef.current && isPlayerReady) {
      try {
        ytPlayerRef.current.setVolume(isMuted ? 0 : volume);
      } catch {}
    }
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted, isPlayerReady]);

  // Time ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const sync = calculateSyncTime();
      setCurrentTime(sync);

      if (track?.duration && duration !== track.duration) {
        setDuration(track.duration);
      }

      // Check auto skip when song naturally ends
      if (duration > 0 && sync >= duration - 0.5) {
        if (isHost || room.currentDjUserId === currentUserId) {
          onSkip();
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [calculateSyncTime, duration, isHost, room.currentDjUserId, currentUserId, onSkip, track?.duration]);

  // Format time mm:ss
  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const hasVotedToSkip = room.skipVotes.some((v) => v.userId === currentUserId);
  const isMyTurn = room.currentDjUserId === currentUserId;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl p-5 md:p-6 transition-all duration-300">
      {/* Background glow decoration */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />

      {/* Main Track Info & Cover Banner */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        {/* Cover Art / Video display */}
        <div className="relative group w-36 h-36 md:w-44 md:h-44 flex-shrink-0 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg">
          {/* Hidden YouTube iframe wrapper */}
          <div
            ref={containerRef}
            className={`w-full h-full ${ytVideoId ? 'block' : 'hidden'}`}
          />

          {/* Fallback image / Album Art when not showing video directly */}
          {(!ytVideoId || !isPlaying) && (
            <img
              src={track?.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop'}
              alt={track?.title || 'Şarkı'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}

          {/* AI Track HTML5 Audio Player */}
          {isAiTrack && track?.audioBlobUrl && (
            <audio
              ref={audioRef}
              src={track.audioBlobUrl}
              autoPlay={isPlaying}
              loop={false}
              onEnded={() => {
                if (isHost || isMyTurn) onSkip();
              }}
            />
          )}

          {/* Play/Pause state overlay */}
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {isPlaying ? (
              <span className="p-3 rounded-full bg-indigo-500/80 text-white shadow-lg">
                <Music2 className="w-6 h-6 animate-pulse" />
              </span>
            ) : (
              <span className="p-3 rounded-full bg-slate-800/80 text-white shadow-lg">
                <Play className="w-6 h-6 fill-white" />
              </span>
            )}
          </div>

          {/* Live DJ Turn indicator badge on album cover */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900/90 border border-slate-700/60 backdrop-blur-md shadow-md text-[11px] text-slate-200">
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: isMyTurn ? '#10B981' : '#6366F1' }}
              />
              <span className="truncate font-medium">
                {isMyTurn ? '🎉 Sıra Sende!' : `DJ: ${room.currentDjName || 'Oda'}`}
              </span>
            </div>
          </div>
        </div>

        {/* Track Title, Artist, DJ info and Controls */}
        <div className="flex-1 w-full flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Radio className="w-3 h-3 animate-pulse text-indigo-400" />
                  Ortak Oda Canlı Yayın
                </span>
                {track?.provider && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                    {track.provider}
                  </span>
                )}
                <span className="text-xs text-emerald-400/90 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Senkronize
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight line-clamp-1">
                {track?.title || 'Oda Başlatılmayı Bekliyor'}
              </h2>
              <p className="text-base text-slate-400 font-medium mt-0.5 line-clamp-1">
                {track?.artist || 'Listenizden bir şarkı ekleyin ve başlatın'}
              </p>
            </div>

            {/* Quick Actions (external link) */}
            <div className="flex items-center gap-2">
              {track?.url && (
                <a
                  href={track.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Orijinal bağlantıyı aç"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Sound wave visualizer */}
          <div className="my-3">
            <AudioVisualizer isPlaying={isPlaying} color="#818cf8" barCount={40} className="h-8 w-full" />
          </div>

          {/* Progress scrubber bar with touch-friendly hit area */}
          <div className="space-y-1.5">
            <div
              className="relative w-full py-2.5 -my-1 cursor-pointer group touch-none"
              onClick={(e) => {
                if (!isHost && !isMyTurn) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                const newOffset = ratio * duration;
                onSeek(newOffset);
              }}
              onTouchStart={(e) => {
                if (!isHost && !isMyTurn) return;
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = touch.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                onSeek(ratio * duration);
              }}
            >
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(100, (currentTime / Math.max(1, duration)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls & Skip Voting */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800/60">
            {/* Left: Play/Pause/Skip */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setHasInteracted(true);
                  if (isPlaying) {
                    onPause(currentTime);
                  } else {
                    onPlay(currentTime);
                  }
                }}
                className={`min-w-[44px] min-h-[44px] p-3 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-lg touch-manipulation ${
                  isPlaying
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
                title={isPlaying ? 'Durdur' : 'Oynat'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              <button
                onClick={onSkip}
                disabled={!isHost && !isMyTurn}
                className={`min-w-[40px] min-h-[40px] p-2.5 rounded-full flex items-center justify-center transition-colors touch-manipulation ${
                  isHost || isMyTurn
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white active:scale-95'
                    : 'bg-slate-800/30 text-slate-600 cursor-not-allowed'
                }`}
                title={isHost || isMyTurn ? 'Sonraki Parçaya Geç (Round-Robin)' : 'Sadece oda kurucusu veya sıradaki DJ geçebilir'}
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Vote Skip Button for everyone */}
              <button
                onClick={onVoteSkip}
                className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-full text-xs font-medium border transition-colors touch-manipulation active:scale-95 ${
                  hasVotedToSkip
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title="Şarkıyı geçmek için topluluk oyu ver"
              >
                <Vote className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Geçme Oyu ({room.skipVotes.length}/{room.requiredSkipVotes})</span>
              </button>
            </div>

            {/* Right: Volume Slider */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white transition-colors touch-manipulation"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 sm:w-24 accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer touch-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
