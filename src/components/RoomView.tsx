import React, { useEffect, useRef } from 'react';
import { RoomState, Track, Playlist, FloatingReaction } from '../types/music';
import { Player } from './Player';
import { RoundRobinQueue } from './RoundRobinQueue';
import { RoomChat } from './RoomChat';
import { RoomMembers } from './RoomMembers';
import confetti from 'canvas-confetti';

interface RoomViewProps {
  room: RoomState;
  queue: any[];
  userPlaylists: Playlist[];
  currentUserId: string;
  clockDrift: number;
  onPlay: (offset: number) => void;
  onPause: (offset: number) => void;
  onSeek: (offset: number) => void;
  onSkip: () => void;
  onVoteSkip: () => void;
  onTriggerAiDj?: () => void;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  onSelectActivePlaylist: (playlistId: string) => void;
  onOpenLibrary: () => void;
}

export const RoomView: React.FC<RoomViewProps> = ({
  room,
  queue,
  userPlaylists,
  currentUserId,
  clockDrift,
  onPlay,
  onPause,
  onSeek,
  onSkip,
  onVoteSkip,
  onTriggerAiDj,
  onSendMessage,
  onSendReaction,
  onSelectActivePlaylist,
  onOpenLibrary,
}) => {
  const prevDjRef = useRef<string | null>(null);

  // Trigger celebration when the turn switches to current user!
  useEffect(() => {
    if (room.currentDjUserId === currentUserId && prevDjRef.current !== currentUserId) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {}
    }
    prevDjRef.current = room.currentDjUserId;
  }, [room.currentDjUserId, currentUserId]);

  const isHost = room.hostId === currentUserId;

  return (
    <div className="space-y-6">
      {/* 1. Synchronized Player Bar */}
      <Player
        room={room}
        clockDrift={clockDrift}
        currentUserId={currentUserId}
        isHost={isHost}
        onPlay={onPlay}
        onPause={onPause}
        onSeek={onSeek}
        onSkip={onSkip}
        onVoteSkip={onVoteSkip}
        onTriggerAiDj={onTriggerAiDj}
      />

      {/* 2. Main Content Grid: Round-Robin Queue & Live Chat + Members */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Round Robin Queue (7 cols on large screens) */}
        <div className="lg:col-span-7 h-full">
          <RoundRobinQueue
            queue={queue}
            currentTrack={room.currentTrack}
            currentDjName={room.currentDjName}
            members={room.members}
            currentUserId={currentUserId}
            onOpenLibrary={onOpenLibrary}
          />
        </div>

        {/* Right: Room Members & Live Chat (5 cols on large screens) */}
        <div className="lg:col-span-5 space-y-6">
          <RoomMembers
            members={room.members}
            hostId={room.hostId}
            currentUserId={currentUserId}
            roomId={room.id}
            roomName={room.name}
            userPlaylists={userPlaylists}
            onSelectActivePlaylist={onSelectActivePlaylist}
          />

          <RoomChat
            messages={room.messages}
            currentUserId={currentUserId}
            onSendMessage={onSendMessage}
            onSendReaction={onSendReaction}
          />
        </div>
      </div>
    </div>
  );
};
