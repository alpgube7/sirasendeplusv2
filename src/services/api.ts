import { RoomState, Track, Playlist, ChatMessage, FloatingReaction } from '../types/music';

// Backend base URL (örn. https://xxx.onrender.com). Boşsa aynı origin kullanılır.
const API_BASE = ((import.meta as any).env?.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || '';

export interface MusicApiResponse {
  serverTime: number;
  rooms: Array<{
    id: string;
    name: string;
    description: string;
    genre: string;
    coverImage?: string;
    hasPassword: boolean;
    memberCount: number;
    currentTrack: { title: string; artist: string; dj: string } | null;
    playing: boolean;
    hostName: string;
  }>;
  room: RoomState | null;
  queue: Array<{
    track: Track;
    ownerId: string;
    ownerName: string;
    ownerAvatar: string;
    ownerColor: string;
    queueIndex: number;
  }>;
  playlists: Playlist[];
  sharedTracks: Track[];
  user: {
    id: string;
    name: string;
  };
}

class ApiService {
  private ws: WebSocket | null = null;
  private wsCallbacks: Map<string, Set<(data: any) => void>> = new Map();
  private activeRoomId: string | null = null;
  private activeUserId: string = 'user-guest';

  constructor() {
    this.initUser();
  }

  private initUser() {
    try {
      let uid = localStorage.getItem('ss_user_id');
      if (!uid) {
        uid = `user-${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem('ss_user_id', uid);
      }
      this.activeUserId = uid;
    } catch {
      this.activeUserId = `user-${Math.random().toString(36).substring(2, 8)}`;
    }
  }

  public getUserId(): string {
    return this.activeUserId;
  }

  public getUserProfile(): { id: string; name: string; avatar: string; color: string } {
    try {
      const name = localStorage.getItem('ss_user_name') || 'Misafir Müziksever';
      const avatar = localStorage.getItem('ss_user_avatar') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop';
      const color = localStorage.getItem('ss_user_color') || '#6366F1';
      return { id: this.activeUserId, name, avatar, color };
    } catch {
      return {
        id: this.activeUserId,
        name: 'Misafir Müziksever',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        color: '#6366F1'
      };
    }
  }

  public setUserProfile(name: string, avatar: string, color: string) {
    try {
      localStorage.setItem('ss_user_name', name);
      localStorage.setItem('ss_user_avatar', avatar);
      localStorage.setItem('ss_user_color', color);
    } catch {}
  }

  public connectWebSocket(roomId?: string) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (roomId && roomId !== this.activeRoomId) {
        this.activeRoomId = roomId;
        this.ws.send(JSON.stringify({ type: 'join_room', roomId, userId: this.activeUserId }));
      }
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = API_BASE
        ? `${API_BASE.replace(/^http/, 'ws')}/ws`
        : `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (roomId) {
          this.activeRoomId = roomId;
          this.ws?.send(JSON.stringify({ type: 'join_room', roomId, userId: this.activeUserId }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const { event: evt, payload } = JSON.parse(event.data);
          const cbs = this.wsCallbacks.get(evt);
          if (cbs) {
            cbs.forEach(cb => cb(payload));
          }
        } catch (e) {
          console.warn('WS decode error:', e);
        }
      };

      this.ws.onclose = () => {
        setTimeout(() => this.connectWebSocket(this.activeRoomId || undefined), 3000);
      };
    } catch (e) {
      console.warn('WS connection failed:', e);
    }
  }

  public on(event: string, callback: (data: any) => void) {
    if (!this.wsCallbacks.has(event)) {
      this.wsCallbacks.set(event, new Set());
    }
    this.wsCallbacks.get(event)!.add(callback);
    return () => {
      this.wsCallbacks.get(event)?.delete(callback);
    };
  }

  public sendReaction(roomId: string, emoji: string, senderName: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'reaction', emoji, senderName }));
    }
  }

  public async fetchMusicState(roomId?: string): Promise<MusicApiResponse> {
    const url = `${API_BASE}/api/music?userId=${encodeURIComponent(this.activeUserId)}${roomId ? `&room=${encodeURIComponent(roomId)}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Müzik durumu alınamadı');
    return res.json();
  }

  public async postAction(action: string, data: Record<string, any> = {}): Promise<any> {
    const user = this.getUserProfile();
    const res = await fetch(`${API_BASE}/api/music`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        userColor: user.color,
        ...data,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'İşlem başarısız');
    return json;
  }

  public async searchMedia(query: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  }

  public async parseMediaUrl(url: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/media?url=${encodeURIComponent(url)}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'URL çözümlenemedi');
    }
    return res.json();
  }

  public async triggerAiDjAnnounce(roomId: string): Promise<{ announcement: string }> {
    const res = await fetch(`${API_BASE}/api/ai/dj-announce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId }),
    });
    return res.json();
  }

  public async chatWithAiDj(message: string, roomId?: string): Promise<string> {
    const user = this.getUserProfile();
    const res = await fetch(`${API_BASE}/api/ai/chat-dj`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        userName: user.name,
        roomId,
      }),
    });
    const data = await res.json();
    return data.reply;
  }

  public async generateLyriaMusic(prompt: string, genre: string, durationSeconds: number = 15): Promise<{
    audioBase64: string;
    mimeType: string;
    lyrics?: string;
    title: string;
    artist: string;
  }> {
    const res = await fetch(`${API_BASE}/api/ai/generate-music`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, genre, durationSeconds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Müzik üretimi başarısız');
    return data;
  }
}

export const api = new ApiService();
