import React, { useState } from 'react';
import {
  Sparkles,
  Music,
  Play,
  Pause,
  Plus,
  Loader2,
  Wand2,
  Disc,
  Check,
  Volume2,
} from 'lucide-react';
import { api } from '../services/api';
import { Playlist } from '../types/music';

interface AiMusicStudioProps {
  playlists: Playlist[];
  activeRoomId?: string;
  onTrackAdded: () => void;
}

const PRESET_PROMPTS = [
  { label: '🎸 Anadolu Psych Funk', prompt: 'Turkish Anatolian psychedelic rock with 70s funk groove and microtonal synth riffs', genre: 'rock' },
  { label: '☕ Sakin Lo-Fi Beat', prompt: 'Cozy rainy day lo-fi hip hop beat with warm electric piano and vinyl tape crackle', genre: 'lo-fi' },
  { label: '⚡ Synthwave Gece Sürüşü', prompt: '80s retro synthwave arpeggio with driving bassline and neon nocturnal pulse', genre: 'synth' },
  { label: '🌙 Akustik Indie Hüzün', prompt: 'Melancholic fingerstyle acoustic guitar with ambient reverb and gentle string pad', genre: 'acoustic' },
  { label: '🎧 Derin Deep House', prompt: 'Warm melodic deep house with soulful rhodes chords and rhythmic four-on-the-floor kick', genre: 'house' },
];

export const AiMusicStudio: React.FC<AiMusicStudioProps> = ({
  playlists,
  activeRoomId,
  onTrackAdded,
}) => {
  const [prompt, setPrompt] = useState(PRESET_PROMPTS[1].prompt);
  const [genre, setGenre] = useState(PRESET_PROMPTS[1].genre);
  const [durationSeconds, setDurationSeconds] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<{
    audioUrl: string;
    title: string;
    artist: string;
    lyrics?: string;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [targetPlaylistId, setTargetPlaylistId] = useState(playlists[0]?.id || '');
  const [successStatus, setSuccessStatus] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedAudio(null);
    setIsPlaying(false);
    if (audioElement) {
      audioElement.pause();
    }

    try {
      const data = await api.generateLyriaMusic(prompt.trim(), genre, durationSeconds);
      
      // Convert base64 to Blob URL
      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType || 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);

      setGeneratedAudio({
        audioUrl,
        title: data.title || `AI: ${prompt.slice(0, 24)}`,
        artist: data.artist || 'Lyria 3 Music Generator',
        lyrics: data.lyrics,
      });

      // Auto preview
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Müzik üretimi sırasında hata oluştu');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioElement) return;
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handleAddToPlaylist = async () => {
    if (!generatedAudio || !targetPlaylistId) return;

    try {
      await api.postAction('addTrack', {
        playlistId: targetPlaylistId,
        title: generatedAudio.title,
        artist: generatedAudio.artist,
        url: generatedAudio.audioUrl,
        provider: 'ai',
        duration: durationSeconds,
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=300&fit=crop',
        audioBlobUrl: generatedAudio.audioUrl,
        aiPrompt: prompt,
        room: activeRoomId,
      });

      setSuccessStatus('Şarkı listenize eklendi ve odaya sıraya girdi!');
      setTimeout(() => setSuccessStatus(''), 4000);
      onTrackAdded();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Studio Header */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-indigo-950/60 border border-purple-500/20 p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Lyria 3 AI Müzik Stüdyosu (lyria-3-clip-preview)
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Kendi AI Müziğini Yarat, Sıraya Sok!
          </h2>
          <p className="text-slate-300 text-sm max-w-2xl mt-1 leading-relaxed">
            Metin açıklaması yazarak doğrudan özgün ses parçaları üretin. Ürettiğiniz parçalar round-robin sisteminde odadaki diğer müzikseverlerle sırayla dinlenir.
          </p>
        </div>
      </div>

      {/* Generator Form */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 backdrop-blur-xl space-y-5">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Hızlı Müzik Şablonları:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(p.prompt);
                  setGenre(p.genre);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  prompt === p.prompt
                    ? 'bg-purple-600/30 text-purple-200 border-purple-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Müzik Açıklaması (Prompt)
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Örn: 80'ler synthwave ritimleri, analog baslar ve retro melodiler..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Tür / Tarz
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="lo-fi">Lo-Fi Hip Hop & Chill</option>
                <option value="rock">Anadolu Rock & Funk</option>
                <option value="synth">Synthwave & Electro</option>
                <option value="acoustic">Akustik Melodiler</option>
                <option value="house">Melodic House & Techno</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Klip Süresi (Model: lyria-3-clip-preview)
              </label>
              <select
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value={15}>15 Saniye (Hızlı Önizleme)</option>
                <option value={30}>30 Saniye (Maksimum Klip)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Lyria 3 ile Ses Üretiliyor...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Parçayı Üret</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Audio Player Card */}
      {generatedAudio && (
        <div className="rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="p-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 flex items-center justify-center transition-transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
              </button>

              <div>
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                  YENİ ÜRETİLEN PARÇA
                </span>
                <h4 className="text-lg font-bold text-white">
                  {generatedAudio.title}
                </h4>
                <p className="text-xs text-slate-400">
                  {generatedAudio.artist} • {durationSeconds}s
                </p>
              </div>
            </div>

            {/* Target playlist select and Add button */}
            <div className="flex items-center gap-2">
              <select
                value={targetPlaylistId}
                onChange={(e) => setTargetPlaylistId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAddToPlaylist}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Listeme Ekle</span>
              </button>
            </div>
          </div>

          {successStatus && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successStatus}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
