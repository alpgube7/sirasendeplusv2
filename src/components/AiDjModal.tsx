import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  MessageSquare,
  Bot,
  Disc,
  Send,
  Radio,
} from 'lucide-react';
import { api } from '../services/api';
import { RoomState } from '../types/music';

interface AiDjModalProps {
  room: RoomState | null;
  onClose: () => void;
}

export const AiDjModal: React.FC<AiDjModalProps> = ({ room, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'dj'; text: string }>>([
    {
      sender: 'dj',
      text: `Selam! Ben SıraSende odasının yapay zeka DJ'i Aura. Şu an çalan parçayı değerlendirebilir, sıradaki şarkılar hakkında bilgi alabilir ya da bana müzikle ilgili herhangi bir şey sorabilirsin!`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Setup Web Speech API for voice recognition if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'tr-TR';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {}
    };
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Tarayıcınız ses tanıma (Web Speech API) özelliğini desteklemiyor. Metin kutusunu kullanabilirsiniz!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const speakText = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim()) return;
    const userText = msgText.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputText('');
    setIsThinking(true);

    try {
      const reply = await api.chatWithAiDj(userText, room?.id);
      setMessages((prev) => [...prev, { sender: 'dj', text: reply }]);
      speakText(reply);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: 'dj', text: 'Üzgünüm, şu an bağlantıda bir kopukluk oldu. Müziğin keyfini çıkarmaya devam et!' },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const triggerLiveAnnouncement = async () => {
    if (!room) return;
    setIsThinking(true);
    try {
      const res = await api.triggerAiDjAnnounce(room.id);
      setMessages((prev) => [
        ...prev,
        { sender: 'dj', text: `[CANLI ANONS] ${res.announcement}` },
      ]);
      speakText(res.announcement);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col h-[85dvh] sm:h-[600px]">
        {/* Modal Top Header */}
        <div className="p-4 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">DJ Aura</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini 3.8 Live Voice
                </span>
              </div>
              <p className="text-xs text-slate-400">Canlı Sesli Müzik Sohbeti & Radyo Anonsları</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title={speechEnabled ? 'Sesli Okumayı Kapat' : 'Sesli Okumayı Aç'}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current track banner */}
        {room?.currentTrack && (
          <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Disc className="w-3.5 h-3.5 text-indigo-400 animate-spin flex-shrink-0" />
              <span className="text-slate-400">Şu An Çalan:</span>
              <span className="text-white font-semibold truncate">
                {room.currentTrack.title} - {room.currentTrack.artist}
              </span>
            </div>

            <button
              onClick={triggerLiveAnnouncement}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-medium whitespace-nowrap border border-purple-500/30 ml-2"
            >
              Şarkıyı Anons Et
            </button>
          </div>
        )}

        {/* Messages scroll area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${
                m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {m.sender === 'dj' && (
                <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center flex-shrink-0 text-purple-300">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-purple-400 italic py-1">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>DJ Aura düşünüyor...</span>
            </div>
          )}
        </div>

        {/* Voice and Text Input Area */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          {/* Voice Mic Status & Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={toggleMic}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg transition-all transform active:scale-95 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/40 ring-4 ring-rose-600/20'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Dinliyor... Konuşmayı Bitir</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Mikrofonla Sesli Konuş</span>
                </>
              )}
            </button>
          </div>

          {/* Fallback Text Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="DJ Aura'ya soru sor veya müzik önerisi iste..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
