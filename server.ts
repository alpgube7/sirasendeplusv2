import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { roomManager } from './server/rooms';
import { generateAiDjAnnouncement, chatWithAiDj, generateLyriaMusic } from './server/gemini';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

const app = express();

// CORS: GitHub Pages (alpgube7.github.io) kökeninden gelen isteklere izin ver
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (_req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const server = createServer(app);

// WebSocket real-time broadcast engine
const wss = new WebSocketServer({ server, path: '/ws' });

interface ClientSocket extends WebSocket {
  roomId?: string;
  userId?: string;
  isAlive?: boolean;
}

const clients = new Set<ClientSocket>();

function broadcastToRoom(roomId: string, event: string, payload: any) {
  const message = JSON.stringify({ event, payload });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
      client.send(message);
    }
  }
}

wss.on('connection', (ws: ClientSocket) => {
  ws.isAlive = true;
  clients.add(ws);

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'join_room') {
        ws.roomId = msg.roomId;
        ws.userId = msg.userId;
      } else if (msg.type === 'reaction') {
        if (ws.roomId) {
          broadcastToRoom(ws.roomId, 'reaction', {
            id: `react-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            emoji: msg.emoji,
            senderName: msg.senderName,
            x: msg.x || Math.floor(Math.random() * 80 + 10),
            y: msg.y || 80,
          });
        }
      }
    } catch (e) {
      console.warn('WS message error:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Periodic heartbeat
setInterval(() => {
  for (const ws of clients) {
    if (!ws.isAlive) {
      ws.terminate();
      clients.delete(ws);
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

// Helper to extract video ID & info from YouTube / Spotify
function parseMediaUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl.trim());
    const host = url.hostname.toLowerCase();

    // YouTube
    if (host === 'youtu.be') {
      const id = url.pathname.split('/')[1];
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
        return {
          provider: 'youtube' as const,
          id,
          title: 'YouTube Şarkısı',
          artist: 'YouTube Sanatçısı',
          thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          duration: 210,
        };
      }
    }
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
      let id = url.searchParams.get('v');
      if (!id) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (['shorts', 'embed', 'live'].includes(parts[0])) {
          id = parts[1];
        }
      }
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
        return {
          provider: 'youtube' as const,
          id,
          title: 'YouTube Müzik',
          artist: 'Sanatçı',
          thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          duration: 210,
        };
      }
    }

    // Spotify
    if (host === 'open.spotify.com') {
      const match = url.pathname.replace(/^\/intl-[a-z]{2}(?=\/)/, '').match(/^\/(?:embed\/)?track\/([A-Za-z0-9]{22})\/?$/);
      if (match) {
        return {
          provider: 'spotify' as const,
          id: match[1],
          title: 'Spotify Şarkısı',
          artist: 'Spotify Sanatçısı',
          thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
          duration: 200,
        };
      }
    }
  } catch {}
  return null;
}

// Media metadata endpoint
app.get('/api/media', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) return res.status(400).json({ error: 'URL gereklidir' });

  const parsed = parseMediaUrl(targetUrl);
  if (!parsed) return res.status(400).json({ error: 'Desteklenmeyen URL formatı (YouTube veya Spotify gereklidir)' });

  // If YouTube, attempt oEmbed for real title & artist
  if (parsed.provider === 'youtube') {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${parsed.id}&format=json`);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        let title = data.title || parsed.title;
        let artist = data.author_name || 'YouTube Sanatçısı';
        // Common title formats: "Artist - Title"
        if (title.includes(' - ')) {
          const [a, ...t] = title.split(' - ');
          artist = a.trim();
          title = t.join(' - ').trim();
        }
        return res.json({
          provider: parsed.provider,
          id: parsed.id,
          title,
          artist,
          thumbnail: data.thumbnail_url || parsed.thumbnail,
          duration: parsed.duration,
        });
      }
    } catch {}
  }

  res.json(parsed);
});

// Search endpoint for quick catalog track discovery
app.get('/api/search', (req, res) => {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .trim();

  const rawQuery = (req.query.q as string) || '';
  const query = normalize(rawQuery);
  if (!query) return res.json({ results: [] });

  const catalog = [
    { title: 'Gülpembe', artist: 'Barış Manço', url: 'https://www.youtube.com/watch?v=kYIcf1oQ4Gk', duration: 304, provider: 'youtube', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop' },
    { title: 'Resimdeki Gözyaşları', artist: 'Cem Karaca', url: 'https://www.youtube.com/watch?v=2eG6qUuV58A', duration: 180, provider: 'youtube', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop' },
    { title: 'Seni Dert Etmeler', artist: 'Madrigal', url: 'https://www.youtube.com/watch?v=qV5_o_8-h9Y', duration: 195, provider: 'youtube', thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop' },
    { title: 'Midnight City', artist: 'M83', url: 'https://www.youtube.com/watch?v=dX3k_QDnzHE', duration: 244, provider: 'youtube', thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop' },
    { title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', url: 'https://www.youtube.com/watch?v=34Na4j8AVgA', duration: 230, provider: 'youtube', thumbnail: 'https://images.unsplash.com/photo-1445985543470-41fdd7738750?w=300&h=300&fit=crop' },
    { title: 'Affet', artist: 'Müslüm Gürses', url: 'https://www.youtube.com/watch?v=Jm9qFvC8h-Q', duration: 270, provider: 'youtube', thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop' },
    { title: 'Dinle Beni Bi', artist: 'Yüzyüzeyken Konuşuruz', url: 'https://www.youtube.com/watch?v=p4vW93U_jF4', duration: 220, provider: 'youtube', thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&h=300&fit=crop' },
    { title: 'Blinding Lights', artist: 'The Weeknd', url: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ', duration: 200, provider: 'youtube', thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop' },
    { title: 'Don\'t Start Now', artist: 'Dua Lipa', url: 'https://www.youtube.com/watch?v=oygrmJFKYZY', duration: 183, provider: 'youtube', thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop' },
    { title: 'Bohemian Rhapsody', artist: 'Queen', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', duration: 355, provider: 'youtube', thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop' },
  ];

  const results = catalog.filter(
    (c) => normalize(c.title).includes(query) || normalize(c.artist).includes(query)
  );

  res.json({ results });
});

// Music state endpoint
app.get('/api/music', (req, res) => {
  const roomId = req.query.room as string;
  const userId = (req.query.userId as string) || 'user-guest';

  const rooms = roomManager.getRoomSummaries();
  const room = roomId ? roomManager.getRoom(roomId) : undefined;
  const playlists = roomManager.getUserPlaylists(userId);
  const queue = roomId ? roomManager.getRoundRobinQueue(roomId, 10) : [];
  const sharedTracks = roomId ? roomManager.getSharedTracksForRoom(roomId) : [];

  res.json({
    serverTime: Date.now(),
    rooms,
    room: room || null,
    queue,
    playlists,
    sharedTracks,
    user: {
      id: userId,
      name: 'Misafir Dinleyici',
    }
  });
});

// POST actions for music, rooms, and queue
app.post('/api/music', async (req, res) => {
  const { action, room: roomId, ...body } = req.body;
  const userId = body.userId || 'user-guest';

  try {
    if (action === 'createRoom') {
      const newRoom = roomManager.createRoom({
        name: body.name,
        description: body.description,
        genre: body.genre,
        password: body.password,
        hostId: userId,
        hostName: body.userName || 'Oda Kurucusu',
        hostAvatar: body.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        hostColor: body.userColor || '#6366F1',
        playlistId: body.playlistId,
        coverImage: body.coverImage,
      });

      return res.json({
        success: true,
        newRoomId: newRoom.id,
        room: newRoom,
        serverTime: Date.now()
      });
    }

    if (action === 'join') {
      const result = roomManager.joinRoom({
        roomId,
        userId,
        name: body.userName || 'Katılımcı',
        avatar: body.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        color: body.userColor || '#10B981',
        playlistId: body.playlistId,
        password: body.password,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      broadcastToRoom(roomId, 'room_updated', result.room);

      return res.json({
        success: true,
        room: result.room,
        queue: roomManager.getRoundRobinQueue(roomId, 10),
        serverTime: Date.now()
      });
    }

    if (action === 'createPlaylist') {
      const pl = roomManager.createPlaylist(userId, body.name, body.description);
      return res.json({ success: true, playlist: pl, playlists: roomManager.getUserPlaylists(userId) });
    }

    if (action === 'addTrack') {
      const track = roomManager.addTrackToPlaylist(userId, body.playlistId, {
        title: body.title,
        artist: body.artist,
        url: body.url,
        provider: body.provider || 'youtube',
        duration: body.duration || 180,
        thumbnail: body.thumbnail,
        aiPrompt: body.aiPrompt,
        audioBlobUrl: body.audioBlobUrl,
      });

      if (roomId) {
        const room = roomManager.getRoom(roomId);
        if (room) {
          // If room had no track, advance or start
          if (!room.currentTrack) {
            roomManager.advanceNextTrack(roomId);
          }
          broadcastToRoom(roomId, 'room_updated', room);
        }
      }

      return res.json({
        success: true,
        track,
        playlists: roomManager.getUserPlaylists(userId),
        queue: roomId ? roomManager.getRoundRobinQueue(roomId, 10) : [],
      });
    }

    if (action === 'removeTrack') {
      roomManager.removeTrackFromPlaylist(userId, body.playlistId, body.trackId);
      return res.json({
        success: true,
        playlists: roomManager.getUserPlaylists(userId),
      });
    }

    if (action === 'play') {
      roomManager.setPlayback(roomId, true, body.offset);
      const room = roomManager.getRoom(roomId);
      broadcastToRoom(roomId, 'room_updated', room);
      return res.json({ success: true, room, serverTime: Date.now() });
    }

    if (action === 'pause') {
      roomManager.setPlayback(roomId, false, body.offset);
      const room = roomManager.getRoom(roomId);
      broadcastToRoom(roomId, 'room_updated', room);
      return res.json({ success: true, room, serverTime: Date.now() });
    }

    if (action === 'seek') {
      roomManager.setPlayback(roomId, body.playing ?? true, body.offset);
      const room = roomManager.getRoom(roomId);
      broadcastToRoom(roomId, 'room_updated', room);
      return res.json({ success: true, room, serverTime: Date.now() });
    }

    if (action === 'skip') {
      const next = roomManager.advanceNextTrack(roomId);
      const room = roomManager.getRoom(roomId);
      broadcastToRoom(roomId, 'room_updated', room);

      // Trigger automatic AI DJ commentary if enabled
      if (room?.aiDjEnabled && next.track) {
        generateAiDjAnnouncement({
          currentTrackTitle: next.track.title,
          currentTrackArtist: next.track.artist,
          currentDjName: next.djName || 'DJ',
          roomGenre: room.genre,
          listenerCount: room.members.length,
        }).then(({ announcement }) => {
          room.lastDjAnnouncement = announcement;
          roomManager.addChatMessage(roomId, {
            roomId,
            userId: 'ai-dj',
            userName: 'DJ Aura (AI)',
            userAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
            userColor: '#8B5CF6',
            text: announcement,
            type: 'dj',
          });
          broadcastToRoom(roomId, 'room_updated', room);
        });
      }

      return res.json({
        success: true,
        room,
        queue: roomManager.getRoundRobinQueue(roomId, 10),
        serverTime: Date.now()
      });
    }

    if (action === 'voteSkip') {
      const voteRes = roomManager.voteSkip(roomId, userId, body.userName || 'Dinleyici');
      const room = roomManager.getRoom(roomId);
      broadcastToRoom(roomId, 'room_updated', room);
      return res.json({ success: true, ...voteRes, room, serverTime: Date.now() });
    }

    if (action === 'message') {
      const msg = roomManager.addChatMessage(roomId, {
        roomId,
        userId,
        userName: body.userName || 'Dinleyici',
        userAvatar: body.userAvatar || '',
        userColor: body.userColor || '#6366F1',
        text: body.text,
        type: 'chat',
      });
      broadcastToRoom(roomId, 'chat_message', msg);
      return res.json({ success: true, message: msg });
    }

    return res.status(400).json({ error: 'Geçersiz işlem' });
  } catch (err: any) {
    console.error('API Music error:', err);
    return res.status(500).json({ error: err.message || 'Sunucu hatası' });
  }
});

// AI DJ announcement route
app.post('/api/ai/dj-announce', async (req, res) => {
  try {
    const { roomId } = req.body;
    const room = roomManager.getRoom(roomId);
    if (!room) return res.status(404).json({ error: 'Oda bulunamadı' });

    const queue = roomManager.getRoundRobinQueue(roomId, 2);
    const nextItem = queue[0];

    const result = await generateAiDjAnnouncement({
      currentTrackTitle: room.currentTrack?.title || 'Bilinmeyen Şarkı',
      currentTrackArtist: room.currentTrack?.artist || 'Bilinmeyen Sanatçı',
      currentDjName: room.currentDjName || 'Oda DJ\'i',
      nextTrackTitle: nextItem?.track.title,
      nextTrackArtist: nextItem?.track.artist,
      nextDjName: nextItem?.ownerName,
      roomGenre: room.genre,
      listenerCount: room.members.length,
    });

    room.lastDjAnnouncement = result.announcement;
    const chatMsg = roomManager.addChatMessage(roomId, {
      roomId,
      userId: 'ai-dj',
      userName: 'DJ Aura (AI)',
      userAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      userColor: '#8B5CF6',
      text: result.announcement,
      type: 'dj',
    });

    broadcastToRoom(roomId, 'chat_message', chatMsg);
    broadcastToRoom(roomId, 'room_updated', room);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI DJ chat route
app.post('/api/ai/chat-dj', async (req, res) => {
  try {
    const { message, userName, roomId } = req.body;
    const room = roomId ? roomManager.getRoom(roomId) : null;

    const reply = await chatWithAiDj({
      userMessage: message,
      userName: userName || 'Dinleyici',
      currentTrack: room?.currentTrack ? {
        title: room.currentTrack.title,
        artist: room.currentTrack.artist,
        dj: room.currentDjName || 'DJ'
      } : null,
    });

    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lyria AI Music generation route
app.post('/api/ai/generate-music', async (req, res) => {
  try {
    const { prompt, genre, durationSeconds } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Müzik üretimi için bir prompt giriniz' });

    const result = await generateLyriaMusic({
      prompt,
      genre: genre || 'lo-fi',
      durationSeconds: durationSeconds || 15,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Configure Vite or Static production serving
async function setupServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`> SıraSende server running on http://localhost:${PORT}`);
  });
}

setupServer();
