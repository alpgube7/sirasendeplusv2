import { RoomState, RoomMember, Track, Playlist, ChatMessage } from '../src/types/music';

// Initial pre-populated tracks
const SEED_TRACKS: Track[] = [
  {
    id: 'tr-1',
    title: 'Gülpembe',
    artist: 'Barış Manço',
    url: 'https://www.youtube.com/watch?v=kYIcf1oQ4Gk',
    provider: 'youtube',
    duration: 304,
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
    addedByName: 'Alp',
  },
  {
    id: 'tr-2',
    title: 'Resimdeki Gözyaşları',
    artist: 'Cem Karaca',
    url: 'https://www.youtube.com/watch?v=2eG6qUuV58A',
    provider: 'youtube',
    duration: 180,
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
    addedByName: 'Selin',
  },
  {
    id: 'tr-3',
    title: 'Midnight City',
    artist: 'M83',
    url: 'https://www.youtube.com/watch?v=dX3k_QDnzHE',
    provider: 'youtube',
    duration: 244,
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
    addedByName: 'Mert',
  },
  {
    id: 'tr-4',
    title: 'Affet',
    artist: 'Müslüm Gürses',
    url: 'https://www.youtube.com/watch?v=Jm9qFvC8h-Q',
    provider: 'youtube',
    duration: 270,
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    addedByName: 'Deniz',
  },
  {
    id: 'tr-5',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    url: 'https://www.youtube.com/watch?v=34Na4j8AVgA',
    provider: 'youtube',
    duration: 230,
    thumbnail: 'https://images.unsplash.com/photo-1445985543470-41fdd7738750?w=300&h=300&fit=crop',
    addedByName: 'Alp',
  },
  {
    id: 'tr-6',
    title: 'Seni Dert Etmeler',
    artist: 'Madrigal',
    url: 'https://www.youtube.com/watch?v=qV5_o_8-h9Y',
    provider: 'youtube',
    duration: 195,
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop',
    addedByName: 'Selin',
  }
];

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private userPlaylists: Map<string, Playlist[]> = new Map();
  private trackStore: Map<string, Track[]> = new Map(); // playlistId -> Track[]

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Alp's playlist
    const pAlp: Playlist = {
      id: 'pl-alp',
      userId: 'user-alp',
      name: 'Alp’in Seçkileri 🎸',
      description: 'Anadolu Rock & Zamansız Klasikler',
      createdAt: Date.now(),
      tracks: [SEED_TRACKS[0], SEED_TRACKS[4]],
    };
    this.trackStore.set('pl-alp', [SEED_TRACKS[0], SEED_TRACKS[4]]);
    this.userPlaylists.set('user-alp', [pAlp]);

    // Selin's playlist
    const pSelin: Playlist = {
      id: 'pl-selin',
      userId: 'user-selin',
      name: 'Selin’in Indie & Alternatif Dünyası 🌙',
      description: 'Gece yolculukları ve sakin melodiler',
      createdAt: Date.now(),
      tracks: [SEED_TRACKS[1], SEED_TRACKS[5]],
    };
    this.trackStore.set('pl-selin', [SEED_TRACKS[1], SEED_TRACKS[5]]);
    this.userPlaylists.set('user-selin', [pSelin]);

    // Mert's playlist
    const pMert: Playlist = {
      id: 'pl-mert',
      userId: 'user-mert',
      name: 'Mert’in Synth & Electronic Beatleri ⚡',
      description: 'Odaklanma, kodlama ve yüksek enerji',
      createdAt: Date.now(),
      tracks: [SEED_TRACKS[2]],
    };
    this.trackStore.set('pl-mert', [SEED_TRACKS[2]]);
    this.userPlaylists.set('user-mert', [pMert]);

    // Create Main Room 1: "SıraSende Salonu #1"
    const room1: RoomState = {
      id: 'oda-salon-1',
      name: 'Müzik Salonu #1 — Birlikte Dinleme',
      description: 'Herkesin listesinden bir parça. Bir sen, bir ben: En adil müzik odası.',
      genre: 'Karışık & Keşif',
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop',
      hostId: 'user-alp',
      hostName: 'Alp (Oda Kurucusu)',
      isPublic: true,
      playing: true,
      startedAt: Date.now() - 35000,
      offsetSeconds: 35,
      currentTrack: SEED_TRACKS[0],
      currentDjUserId: 'user-alp',
      currentDjName: 'Alp',
      lastPlayedUserId: 'user-alp',
      memberCursors: {
        'user-alp': 1,
        'user-selin': 0,
        'user-mert': 0,
      },
      members: [
        {
          userId: 'user-alp',
          name: 'Alp G.',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
          color: '#6366F1',
          role: 'host',
          joinedAt: Date.now() - 3600000,
          activePlaylistId: 'pl-alp',
          trackCount: 2,
          isOnline: true,
        },
        {
          userId: 'user-selin',
          name: 'Selin K.',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
          color: '#EC4899',
          role: 'dj',
          joinedAt: Date.now() - 2400000,
          activePlaylistId: 'pl-selin',
          trackCount: 2,
          isOnline: true,
        },
        {
          userId: 'user-mert',
          name: 'Mert Y.',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          color: '#10B981',
          role: 'member',
          joinedAt: Date.now() - 1200000,
          activePlaylistId: 'pl-mert',
          trackCount: 1,
          isOnline: true,
        }
      ],
      skipVotes: [],
      requiredSkipVotes: 2,
      messages: [
        {
          id: 'msg-1',
          roomId: 'oda-salon-1',
          userId: 'system',
          userName: 'SıraSende Bot',
          userAvatar: '',
          userColor: '#6B7280',
          text: 'Oda başlatıldı! SıraSende adil çalma modu devrede.',
          timestamp: Date.now() - 180000,
          type: 'system',
        },
        {
          id: 'msg-2',
          roomId: 'oda-salon-1',
          userId: 'user-selin',
          userName: 'Selin K.',
          userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
          userColor: '#EC4899',
          text: 'Harika bir Barış Manço klasiğiyle başladık! Benim sıram ne zaman geliyor? 😍',
          timestamp: Date.now() - 45000,
          type: 'chat',
        },
        {
          id: 'msg-3',
          roomId: 'oda-salon-1',
          userId: 'ai-dj',
          userName: 'DJ Aura (AI)',
          userAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
          userColor: '#8B5CF6',
          text: 'Sıradaki parça tam olarak sende Selin! Gülpembe bitince senin listenden Cem Karaca çalacak.',
          timestamp: Date.now() - 20000,
          type: 'dj',
        }
      ],
      aiDjEnabled: true,
      aiDjVoice: 'Zephyr',
      lastDjAnnouncement: 'Gülpembe çalıyor! Sırada Selin\'in listesinden Cem Karaca var.',
      createdAt: Date.now() - 7200000,
    };

    // Room 2: "Kodlama & Synthwave Gece Vardiyası"
    const room2: RoomState = {
      id: 'oda-synthwave',
      name: '⚡ Kodlama & Gece Synthwave',
      description: 'Derin odaklanma, lo-fi ritimler ve retro fütürist synth sesleri.',
      genre: 'Synthwave / Lofi',
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=400&fit=crop',
      hostId: 'user-mert',
      hostName: 'Mert Y.',
      isPublic: true,
      playing: true,
      startedAt: Date.now() - 90000,
      offsetSeconds: 90,
      currentTrack: SEED_TRACKS[2],
      currentDjUserId: 'user-mert',
      currentDjName: 'Mert Y.',
      lastPlayedUserId: 'user-mert',
      memberCursors: {
        'user-mert': 0,
      },
      members: [
        {
          userId: 'user-mert',
          name: 'Mert Y.',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          color: '#10B981',
          role: 'host',
          joinedAt: Date.now() - 900000,
          activePlaylistId: 'pl-mert',
          trackCount: 1,
          isOnline: true,
        }
      ],
      skipVotes: [],
      requiredSkipVotes: 1,
      messages: [],
      aiDjEnabled: true,
      aiDjVoice: 'Fenrir',
      createdAt: Date.now() - 3600000,
    };

    this.rooms.set(room1.id, room1);
    this.rooms.set(room2.id, room2);
  }

  // Get public room list summaries
  public getRoomSummaries() {
    return Array.from(this.rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      genre: r.genre,
      coverImage: r.coverImage,
      hasPassword: !!r.password,
      memberCount: r.members.length,
      currentTrack: r.currentTrack ? {
        title: r.currentTrack.title,
        artist: r.currentTrack.artist,
        dj: r.currentDjName || 'Oda'
      } : null,
      playing: r.playing,
      hostName: r.hostName,
    }));
  }

  public getRoom(id: string): RoomState | undefined {
    return this.rooms.get(id);
  }

  public getUserPlaylists(userId: string): Playlist[] {
    return this.userPlaylists.get(userId) || [];
  }

  public createPlaylist(userId: string, name: string, description?: string): Playlist {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      name,
      description: description || '',
      createdAt: Date.now(),
      tracks: []
    };
    const list = this.userPlaylists.get(userId) || [];
    list.push(newPlaylist);
    this.userPlaylists.set(userId, list);
    this.trackStore.set(newPlaylist.id, []);
    return newPlaylist;
  }

  public addTrackToPlaylist(userId: string, playlistId: string, trackData: Omit<Track, 'id'>): Track {
    const newTrack: Track = {
      ...trackData,
      id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      playlistId,
      addedByUserId: userId,
    };

    const tracks = this.trackStore.get(playlistId) || [];
    tracks.push(newTrack);
    this.trackStore.set(playlistId, tracks);

    // Update playlists cache
    const userLists = this.userPlaylists.get(userId) || [];
    const pl = userLists.find(p => p.id === playlistId);
    if (pl) pl.tracks = tracks;

    return newTrack;
  }

  public removeTrackFromPlaylist(userId: string, playlistId: string, trackId: string) {
    let tracks = this.trackStore.get(playlistId) || [];
    tracks = tracks.filter(t => t.id !== trackId);
    this.trackStore.set(playlistId, tracks);

    const userLists = this.userPlaylists.get(userId) || [];
    const pl = userLists.find(p => p.id === playlistId);
    if (pl) pl.tracks = tracks;
  }

  public getSharedTracksForRoom(roomId: string): Track[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    const allTracks: Track[] = [];
    for (const member of room.members) {
      if (member.activePlaylistId) {
        const tracks = this.trackStore.get(member.activePlaylistId) || [];
        for (const t of tracks) {
          allTracks.push({
            ...t,
            addedByUserId: member.userId,
            addedByName: member.name
          });
        }
      }
    }
    return allTracks;
  }

  // Calculate upcoming Round-Robin queue
  public getRoundRobinQueue(roomId: string, limit: number = 8) {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    // Filter members who have tracks in their selected playlist
    const eligibleMembers = room.members.filter(m => {
      if (!m.activePlaylistId) return false;
      const tracks = this.trackStore.get(m.activePlaylistId) || [];
      return tracks.length > 0;
    });

    if (eligibleMembers.length === 0) return [];

    // Find the starting index after lastPlayedUserId
    let lastIndex = eligibleMembers.findIndex(m => m.userId === room.lastPlayedUserId);
    if (lastIndex === -1) lastIndex = -1;

    const queue: Array<{
      track: Track;
      ownerId: string;
      ownerName: string;
      ownerAvatar: string;
      ownerColor: string;
      queueIndex: number;
    }> = [];

    // Simulate upcoming turns
    const tempCursors = { ...room.memberCursors };

    for (let step = 0; step < limit; step++) {
      const nextMemberIndex = (lastIndex + 1 + step) % eligibleMembers.length;
      const member = eligibleMembers[nextMemberIndex];
      const memberTracks = this.trackStore.get(member.activePlaylistId!) || [];
      if (memberTracks.length === 0) continue;

      const cursor = tempCursors[member.userId] || 0;
      const track = memberTracks[cursor % memberTracks.length];
      tempCursors[member.userId] = cursor + 1;

      queue.push({
        track: {
          ...track,
          addedByUserId: member.userId,
          addedByName: member.name,
        },
        ownerId: member.userId,
        ownerName: member.name,
        ownerAvatar: member.avatar,
        ownerColor: member.color,
        queueIndex: step,
      });
    }

    return queue;
  }

  // Create a new room
  public createRoom(params: {
    name: string;
    description?: string;
    genre?: string;
    password?: string;
    hostId: string;
    hostName: string;
    hostAvatar: string;
    hostColor: string;
    playlistId?: string;
    coverImage?: string;
  }): RoomState {
    const id = `oda-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 3)}`;
    const newRoom: RoomState = {
      id,
      name: params.name,
      description: params.description || 'SıraSende Ortak Müzik Odası',
      genre: params.genre || 'Karışık',
      password: params.password || undefined,
      hasPassword: !!params.password,
      coverImage: params.coverImage || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop',
      hostId: params.hostId,
      hostName: params.hostName,
      isPublic: true,
      playing: false,
      startedAt: Date.now(),
      offsetSeconds: 0,
      currentTrack: null,
      currentDjUserId: params.hostId,
      currentDjName: params.hostName,
      lastPlayedUserId: null,
      memberCursors: { [params.hostId]: 0 },
      members: [
        {
          userId: params.hostId,
          name: params.hostName,
          avatar: params.hostAvatar,
          color: params.hostColor,
          role: 'host',
          joinedAt: Date.now(),
          activePlaylistId: params.playlistId,
          trackCount: params.playlistId ? (this.trackStore.get(params.playlistId)?.length || 0) : 0,
          isOnline: true,
        }
      ],
      skipVotes: [],
      requiredSkipVotes: 1,
      messages: [
        {
          id: `msg-${Date.now()}`,
          roomId: id,
          userId: 'system',
          userName: 'SıraSende',
          userAvatar: '',
          userColor: '#6B7280',
          text: `"${params.name}" odası kuruldu! Şarkı listenizi ekleyerek sıraya dahil olun.`,
          timestamp: Date.now(),
          type: 'system',
        }
      ],
      aiDjEnabled: true,
      aiDjVoice: 'Zephyr',
      createdAt: Date.now(),
    };

    // If host has tracks, initiate first track
    if (params.playlistId) {
      const tracks = this.trackStore.get(params.playlistId) || [];
      if (tracks.length > 0) {
        newRoom.currentTrack = tracks[0];
        newRoom.playing = true;
        newRoom.startedAt = Date.now();
        newRoom.lastPlayedUserId = params.hostId;
        newRoom.memberCursors[params.hostId] = 1;
      }
    }

    this.rooms.set(id, newRoom);
    return newRoom;
  }

  // Join Room
  public joinRoom(params: {
    roomId: string;
    userId: string;
    name: string;
    avatar: string;
    color: string;
    playlistId?: string;
    password?: string;
  }): { success: boolean; error?: string; room?: RoomState } {
    const room = this.rooms.get(params.roomId);
    if (!room) return { success: false, error: 'Oda bulunamadı' };

    if (room.password && room.password !== params.password) {
      return { success: false, error: 'Hatalı oda şifresi' };
    }

    let member = room.members.find(m => m.userId === params.userId);
    const trackCount = params.playlistId ? (this.trackStore.get(params.playlistId)?.length || 0) : 0;

    if (!member) {
      member = {
        userId: params.userId,
        name: params.name,
        avatar: params.avatar,
        color: params.color,
        role: room.members.length === 0 ? 'host' : 'member',
        joinedAt: Date.now(),
        activePlaylistId: params.playlistId,
        trackCount,
        isOnline: true,
      };
      room.members.push(member);
      room.memberCursors[params.userId] = room.memberCursors[params.userId] || 0;

      room.messages.push({
        id: `msg-${Date.now()}`,
        roomId: room.id,
        userId: 'system',
        userName: 'SıraSende',
        userAvatar: '',
        userColor: '#10B981',
        text: `${params.name} odaya katıldı! (${trackCount} parça listelendi)`,
        timestamp: Date.now(),
        type: 'system',
      });
    } else {
      member.isOnline = true;
      if (params.playlistId) {
        member.activePlaylistId = params.playlistId;
        member.trackCount = trackCount;
      }
    }

    // Update required skip votes (majority)
    room.requiredSkipVotes = Math.max(1, Math.ceil(room.members.length / 2));

    // If nothing was playing and this user brings tracks, start music!
    if (!room.currentTrack && params.playlistId) {
      const tracks = this.trackStore.get(params.playlistId) || [];
      if (tracks.length > 0) {
        room.currentTrack = tracks[0];
        room.currentDjUserId = params.userId;
        room.currentDjName = params.name;
        room.lastPlayedUserId = params.userId;
        room.playing = true;
        room.startedAt = Date.now();
        room.offsetSeconds = 0;
        room.memberCursors[params.userId] = 1;
      }
    }

    return { success: true, room };
  }

  // Advance to next song in round-robin order
  public advanceNextTrack(roomId: string): { track: Track | null; djName: string | null } {
    const room = this.rooms.get(roomId);
    if (!room) return { track: null, djName: null };

    const queue = this.getRoundRobinQueue(roomId, 1);
    if (queue.length === 0) {
      room.currentTrack = null;
      room.playing = false;
      room.offsetSeconds = 0;
      return { track: null, djName: null };
    }

    const next = queue[0];
    room.currentTrack = next.track;
    room.currentDjUserId = next.ownerId;
    room.currentDjName = next.ownerName;
    room.lastPlayedUserId = next.ownerId;
    room.memberCursors[next.ownerId] = (room.memberCursors[next.ownerId] || 0) + 1;
    room.playing = true;
    room.startedAt = Date.now();
    room.offsetSeconds = 0;
    room.skipVotes = [];

    room.messages.push({
      id: `msg-${Date.now()}`,
      roomId: room.id,
      userId: 'system',
      userName: 'Sıra Sende!',
      userAvatar: next.ownerAvatar,
      userColor: next.ownerColor,
      text: `🎵 Şimdi ${next.ownerName}'in listesinden çalıyor: "${next.track.title}" - ${next.track.artist}`,
      timestamp: Date.now(),
      type: 'music_change',
    });

    return { track: next.track, djName: next.ownerName };
  }

  // Vote to skip
  public voteSkip(roomId: string, userId: string, userName: string): { skipped: boolean; votes: number; required: number } {
    const room = this.rooms.get(roomId);
    if (!room) return { skipped: false, votes: 0, required: 1 };

    const existing = room.skipVotes.find(v => v.userId === userId);
    if (!existing) {
      room.skipVotes.push({ userId, userName, timestamp: Date.now() });
      room.messages.push({
        id: `msg-${Date.now()}`,
        roomId: room.id,
        userId: 'system',
        userName: 'Oy Sistemi',
        userAvatar: '',
        userColor: '#F59E0B',
        text: `${userName} şarkıyı geçmek için oy kullandı. (${room.skipVotes.length}/${room.requiredSkipVotes})`,
        timestamp: Date.now(),
        type: 'system',
      });
    }

    if (room.skipVotes.length >= room.requiredSkipVotes) {
      this.advanceNextTrack(roomId);
      return { skipped: true, votes: 0, required: room.requiredSkipVotes };
    }

    return { skipped: false, votes: room.skipVotes.length, required: room.requiredSkipVotes };
  }

  // Playback controls (Host or DJ)
  public setPlayback(roomId: string, playing: boolean, offset?: number) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (offset !== undefined) {
      room.offsetSeconds = offset;
    } else if (room.playing && !playing) {
      // Pausing: calculate elapsed offset
      const elapsed = (Date.now() - room.startedAt) / 1000;
      room.offsetSeconds = Math.max(0, room.offsetSeconds + elapsed);
    }

    room.playing = playing;
    room.startedAt = Date.now();
  }

  // Chat message
  public addChatMessage(roomId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const room = this.rooms.get(roomId);
    const newMsg: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
    };
    if (room) {
      room.messages.push(newMsg);
      if (room.messages.length > 150) {
        room.messages.shift();
      }
    }
    return newMsg;
  }
}

export const roomManager = new RoomManager();
