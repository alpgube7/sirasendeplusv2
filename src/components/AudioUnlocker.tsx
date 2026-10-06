import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, Music } from 'lucide-react';

interface AudioUnlockerProps {
  isPlaying: boolean;
  onUnlock: () => void;
}

export const AudioUnlocker: React.FC<AudioUnlockerProps> = ({ isPlaying, onUnlock }) => {
  const [hasInteracted, setHasInteracted] = useState(() => {
    try {
      return sessionStorage.getItem('ss_audio_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleGlobalInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        try {
          sessionStorage.setItem('ss_audio_unlocked', 'true');
        } catch {}
        onUnlock();
      }
    };

    window.addEventListener('touchstart', handleGlobalInteraction, { passive: true, once: true });
    window.addEventListener('click', handleGlobalInteraction, { passive: true, once: true });

    return () => {
      window.removeEventListener('touchstart', handleGlobalInteraction);
      window.removeEventListener('click', handleGlobalInteraction);
    };
  }, [hasInteracted, onUnlock]);

  if (hasInteracted || !isPlaying) return null;

  return (
    <div className="fixed top-20 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-bounce">
      <button
        onClick={() => {
          setHasInteracted(true);
          try {
            sessionStorage.setItem('ss_audio_unlocked', 'true');
          } catch {}
          onUnlock();
        }}
        className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-600/40 border border-white/20 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/20">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold leading-tight">Müzik Odası Yayında!</p>
            <p className="text-[11px] text-white/80">Sesi etkinleştirmek için buraya dokunun</p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-md">
          Sesi Aç
        </span>
      </button>
    </div>
  );
};
