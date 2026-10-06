import React from 'react';
import {
  Compass,
  Radio,
  ListMusic,
  Sparkles,
  Bot,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'rooms' | 'room' | 'library';
  onSelectTab: (tab: 'rooms' | 'room' | 'library') => void;
  isPlaying: boolean;
  hasActiveRoom: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  isPlaying,
  hasActiveRoom,
}) => {
  const tabs = [
    {
      id: 'rooms' as const,
      label: 'Odalar',
      icon: Compass,
    },
    {
      id: 'room' as const,
      label: 'Canlı Oda',
      icon: Radio,
      badge: hasActiveRoom && isPlaying,
    },
    {
      id: 'library' as const,
      label: 'Listelerim',
      icon: ListMusic,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/80 pb-safe pt-1.5 px-2 transition-all">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative min-h-[48px] touch-manipulation active:scale-95 ${
                isActive
                  ? 'text-indigo-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-slate-950" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-[64px]">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
