import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
  }
}

export async function generateAiDjAnnouncement(params: {
  currentTrackTitle: string;
  currentTrackArtist: string;
  currentDjName: string;
  nextTrackTitle?: string;
  nextTrackArtist?: string;
  nextDjName?: string;
  roomGenre?: string;
  listenerCount: number;
}): Promise<{ announcement: string; mood: string }> {
  if (!ai) {
    const dj = params.currentDjName || "Müziksever";
    const song = params.currentTrackTitle || "Harika parça";
    const artist = params.currentTrackArtist || "Sanatçı";
    return {
      announcement: `SıraSende stüdyosundan herkese merhaba! Sıradaki parça ${dj}'in arşivinden geliyor: ${artist} - ${song}. Müzik hiç durmasın, sıra sende!`,
      mood: "energetic"
    };
  }

  try {
    const prompt = `Sen "SıraSende Radyo Odası"nın karizmatik, samimi ve müzik tutkunu Türkçe konuşan AI DJ'i "Aura"sın.
Odada dinleyiciler herkes kendi çalma listesini paylaşıp sırayla müzik dinliyor (adil round-robin sistemi).
Bilgiler:
- Şu an çalan veya yeni başlayan parça: "${params.currentTrackTitle}" - ${params.currentTrackArtist}
- Bu parçayı seçen DJ (katılımcı): ${params.currentDjName}
${params.nextTrackTitle ? `- Sırada bekleyen parça: "${params.nextTrackTitle}" - ${params.nextTrackArtist} (DJ: ${params.nextDjName})` : ""}
- Odanın türü/konsepti: ${params.roomGenre || "Genel Müzik"}
- Odadaki dinleyici sayısı: ${params.listenerCount}

Görevin:
Radyo yayıncısı üslubuyla 2-3 cümlelik çok akıcı, eğlenceli ve sıcak bir anons yap. Parçayı ve seçen katılımcıyı onore et, müziğin enerjisine değin. Samimi Türkçe kullan. Yanıtı sadece DJ anons metni olarak ver (tırnak işareti veya ek başlık koyma).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const text = response.text?.trim() || `Sıradaki parça ${params.currentDjName}'den geliyor: ${params.currentTrackTitle}! Keyifli dinlemeler!`;
    return {
      announcement: text,
      mood: "upbeat"
    };
  } catch (err) {
    console.warn("AI DJ announcement generation error:", err);
    return {
      announcement: `Şimdi ${params.currentDjName}'in seçimiyle ${params.currentTrackArtist} - ${params.currentTrackTitle} çalıyor! Sıra kimdeyse odayı o sallıyor!`,
      mood: "casual"
    };
  }
}

export async function chatWithAiDj(params: {
  userMessage: string;
  userName: string;
  currentTrack?: { title: string; artist: string; dj: string } | null;
  history?: Array<{ role: string; content: string }>;
}): Promise<string> {
  if (!ai) {
    return `Selam ${params.userName}! SıraSende odasındasın. Şu an çalma listesindeki parçalar adil bir şekilde sırayla çalıyor. Bir şarkı önermek veya sıradaki DJ olmak ister misin?`;
  }

  try {
    const systemInstruction = `Sen SıraSende ortak müzik odasının yapay zeka DJ'isin ("DJ Aura").
Kullanıcılarla müzik zevkleri, şarkı hikayeleri, türler, müzik tavsiyeleri ve odanın atmosferi hakkında neşeli, bilgili ve samimi sohbet edersin.
Şu anki çalan parça: ${params.currentTrack ? `"${params.currentTrack.title}" (${params.currentTrack.artist}) - DJ: ${params.currentTrack.dj}` : "Henüz parça başlamadı"}.
Kullanıcı ismi: ${params.userName}.
Cevapların kısa, dinamik, samimi ve radyo DJ'i enerjisinde olsun.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        { role: "user", parts: [{ text: `${systemInstruction}\n\nKullanıcı: ${params.userMessage}` }] }
      ]
    });

    return response.text?.trim() || "Müzik harika akıyor! Sıradaki parçayı sabırsızlıkla bekliyoruz.";
  } catch (err) {
    console.warn("AI DJ Chat error:", err);
    return `Harika bir yorum ${params.userName}! Ritme kapılmaya devam et.`;
  }
}

export async function generateLyriaMusic(params: {
  prompt: string;
  durationSeconds?: number;
  genre?: string;
}): Promise<{
  audioBase64: string;
  mimeType: string;
  lyrics?: string;
  title: string;
  artist: string;
}> {
  // If AI client is configured, attempt Lyria model
  if (ai) {
    try {
      const response = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: `${params.prompt} (genre: ${params.genre || "ambient lo-fi beats"})`,
      });

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;

        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      if (audioBase64) {
        return {
          audioBase64,
          mimeType,
          lyrics,
          title: `AI: ${params.prompt.slice(0, 30)}`,
          artist: "Lyria AI Music"
        };
      }
    } catch (err) {
      console.warn("Lyria generation failed or requires paid key, falling back to melodic audio synthesis:", err);
    }
  }

  // Melodic audio synthesizer generator (creates valid PCM WAV base64)
  const synthWav = generateProceduralWav({
    genre: params.genre || "lo-fi",
    durationSeconds: Math.min(params.durationSeconds || 15, 20),
  });

  return {
    audioBase64: synthWav,
    mimeType: "audio/wav",
    lyrics: `[Enstrümantal ritim: ${params.prompt}]`,
    title: `SıraSende AI: ${params.prompt.slice(0, 28)}`,
    artist: "SıraSende Sound Lab"
  };
}

function generateProceduralWav(opts: { genre: string; durationSeconds: number }): string {
  const sampleRate = 22050;
  const numSamples = sampleRate * opts.durationSeconds;
  const buffer = new Int16Array(numSamples);

  // Musical chord progressions based on genre
  const chords = opts.genre.includes("rock") 
    ? [220, 293.66, 329.63, 196] // A, D, E, G
    : opts.genre.includes("synth")
    ? [261.63, 311.13, 392.00, 466.16] // C minor
    : [261.63, 329.63, 392.00, 493.88]; // C, E, G, B (Lofi Jazz Maj7)

  const bpm = 90;
  const beatDuration = (60 / bpm) * sampleRate;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.floor(i / (beatDuration * 4)) % chords.length;
    const rootFreq = chords[chordIndex];

    // Bass note
    const bass = Math.sin(2 * Math.PI * (rootFreq / 2) * t) * 0.25;
    // Harmony pad
    const pad1 = Math.sin(2 * Math.PI * rootFreq * t) * 0.15;
    const pad2 = Math.sin(2 * Math.PI * (rootFreq * 1.25) * t) * 0.12;
    const pad3 = Math.sin(2 * Math.PI * (rootFreq * 1.5) * t) * 0.10;

    // Soft beat/percussion pulse
    const beatPos = (i % Math.floor(beatDuration)) / beatDuration;
    const kick = beatPos < 0.1 ? Math.sin(2 * Math.PI * (120 - beatPos * 800) * t) * 0.35 * (1 - beatPos * 10) : 0;
    const snare = (i % Math.floor(beatDuration * 2) > beatDuration) && (beatPos < 0.15) 
      ? (Math.random() * 2 - 1) * 0.18 * (1 - beatPos * 6) 
      : 0;

    // Gentle vinyl lo-fi crackle
    const crackle = Math.random() < 0.008 ? (Math.random() * 2 - 1) * 0.08 : 0;

    const sample = Math.max(-1, Math.min(1, bass + pad1 + pad2 + pad3 + kick + snare + crackle));
    buffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  // Create WAV header
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const dataSize = numSamples * 2;

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // SubChunk1Size (PCM)
  view.setUint16(20, 1, true); // AudioFormat
  view.setUint16(22, 1, true); // NumChannels (Mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const fullBytes = new Uint8Array(44 + dataSize);
  fullBytes.set(new Uint8Array(wavHeader), 0);
  fullBytes.set(new Uint8Array(buffer.buffer), 44);

  return Buffer.from(fullBytes).toString("base64");
}
