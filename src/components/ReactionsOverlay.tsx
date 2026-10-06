import React, { useEffect, useState } from 'react';
import { FloatingReaction } from '../types/music';

interface ReactionsOverlayProps {
  reactions: FloatingReaction[];
}

export const ReactionsOverlay: React.FC<ReactionsOverlayProps> = ({ reactions }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute animate-float-up flex flex-col items-center"
          style={{
            left: `${r.x}%`,
            bottom: '15%',
          }}
        >
          <span className="text-3xl drop-shadow-lg transform transition-transform hover:scale-125">
            {r.emoji}
          </span>
          <span className="text-[10px] bg-slate-900/80 text-slate-300 px-1.5 py-0.5 rounded-full border border-slate-700/50 mt-1 whitespace-nowrap">
            {r.senderName}
          </span>
        </div>
      ))}
    </div>
  );
};
