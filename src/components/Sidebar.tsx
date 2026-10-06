import React from 'react';
import {
  Compass,
  Radio,
  ListMusic,
  Sparkles,
  Bot,
  Plus,
  Music2,
  Disc,
  Headphones,
} from 'lucide-react';

interface SidebarProps {
  currentTab: 'rooms' | 'room' | 'library';
  onSelectTab: (tab: 'rooms' | 'room' | 'library') => void;
  myRooms: Array<{ id: string; name: string }>;
  activeRoomId?: string;
  onSelectRoom: (roomId: string) => void;
  onOpenCreateRoom: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  myRooms,
  activeRoomId,
  onSelectRoom,
  onOpenCreateRoom,
}) => {
  return (
    <aside className="w-64 bg-slate-950/90 border-r border-slate-800/80 flex flex-col h-screen p-4 flex-shrink-0 z-30 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="pb-6 border-b border-slate-800/60">
        <div
          onClick={() => onSelectTab('rooms')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Music2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight flex items-center">
              SıraSende<span className="text-indigo-400">.</span>
            </h1>
            <span className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase block">
              MÜZİK BİZİ BULUŞTURUR
            </span>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="py-4 space-y-1.5">
        <button
          onClick={() => onSelectTab('rooms')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            currentTab === 'rooms'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Müzik Salonu & Odalar</span>
        </button>

        <button
          onClick={() => onSelectTab('room')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            currentTab === 'room'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Ortak Dinleme Odası</span>
        </button>

        <button
          onClick={() => onSelectTab('library')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            currentTab === 'library'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Çalma Listelerim</span>
        </button>
      </nav>

      {/* Quick Action: New Room */}
      <div className="pt-2 pb-4">
        <button
          onClick={onOpenCreateRoom}
          className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors hover:bg-slate-900"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>Yeni Oda Oluştur</span>
        </button>
      </div>

      {/* My Rooms List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Hızlı Odalar
        </div>
        {myRooms.map((r) => {
          const isCurrent = r.id === activeRoomId;
          return (
            <button
              key={r.id}
              onClick={() => {
                onSelectRoom(r.id);
                onSelectTab('room');
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left truncate transition-colors ${
                isCurrent
                  ? 'bg-slate-800 text-indigo-300 font-semibold border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
              <span className="truncate">{r.name}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Philosophy Footer */}
      <div className="pt-4 border-t border-slate-800/60 text-center">
        <p className="text-[11px] font-medium text-slate-300">
          "Bir sen, bir ben."
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Herkesin listesinden bir parça. Birlikte dinlemenin en adil hali.
        </p>
      </div>
    </aside>
  );
};
