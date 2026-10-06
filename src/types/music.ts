export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  provider: 'youtube' | 'spotify' | 'audio' | 'ai';
  duration: number; // in seconds
  thumbnail?: string;
  addedByUserId?: string;
  addedByName?: string;
  playlistId?: string;
  aiPrompt?: string;
  audioBlobUrl?: string;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  cover?: string;
  tracks: Track[];
  createdAt: number;
}

export interface RoomMember {
  userId: string;
  name: string;
  avatar: string;
  color: string;
  role: 'host' | 'member' | 'dj';
  joinedAt: number;
  activePlaylistId?: string;
  trackCount: number;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userColor: string;
  text: string;
  timestamp: number;
  type?: 'chat' | 'system' | 'dj' | 'music_change';
}

export interface SkipVote {
  userId: string;
  userName: string;
  timestamp: number;
}

export interface RoomState {
  id: string;
  name: string;
  description: string;
  genre: string;
  coverImage?: string;
  hasPassword?: boolean;
  password?: string;
  hostId: string;
  hostName: string;
  isPublic: boolean;
  
  // Playback sync
  playing: boolean;
  startedAt: number;
  offsetSeconds: number;
  currentTrack: Track | null;
  currentDjUserId: string | null;
  currentDjName: string | null;
  
  // Round-robin tracking
  lastPlayedUserId: string | null;
  memberCursors: Record<string, number>; // userId -> trackIndex
  
  // Voting & members
  members: RoomMember[];
  skipVotes: SkipVote[];
  requiredSkipVotes: number;
  
  // Real-time chat & reactions
  messages: ChatMessage[];
  
  // AI DJ Settings
  aiDjEnabled: boolean;
  aiDjVoice: 'Zephyr' | 'Puck' | 'Kore' | 'Fenrir' | 'Charon';
  lastDjAnnouncement?: string;
  
  createdAt: number;
}

export interface QueueItem {
  track: Track;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerColor: string;
  queueIndex: number;
  isCurrent: boolean;
  estimatedStartTime?: string;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  x: number;
  y: number;
}
