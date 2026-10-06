import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/music';
import {
  Send,
  MessageSquare,
  Sparkles,
  Radio,
  Flame,
  Heart,
  Music,
  Smile,
  Zap,
} from 'lucide-react';

interface RoomChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
}

const QUICK_REACTIONS = ['🔥', '❤️', '🎵', '👏', '🚀', '⚡'];

export const RoomChat: React.FC<RoomChatProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  onSendReaction,
}) => {
  const [inputText, setInputText] = useState('');
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const prevMsgCountRef = useRef<number>(messages.length);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Only scroll the internal chat container, NEVER the page or parent window!
    const isNewMessage = messages.length > prevMsgCountRef.current;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isNewMessage && isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }

    prevMsgCountRef.current = messages.length;
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');

    // When the user themselves sends a message, immediately scroll the chat box internally
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 50);
  };

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 backdrop-blur-xl shadow-xl flex flex-col h-full min-h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Oda Sohbeti</h3>
            <p className="text-[11px] text-slate-400">Canlı mesajlar ve DJ anonsları</p>
          </div>
        </div>

        {/* Reaction quick buttons with touch targets */}
        <div className="flex items-center gap-1">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="min-w-[34px] min-h-[34px] p-1.5 flex items-center justify-center rounded-lg hover:bg-slate-800 text-base transition-transform hover:scale-125 active:scale-95 touch-manipulation"
              title={`${emoji} tepkisi gönder`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto py-3 space-y-2.5 max-h-[380px] pr-1"
      >
        {messages.map((msg) => {
          const isMe = msg.userId === currentUserId;
          const isDj = msg.type === 'dj';
          const isSystem = msg.type === 'system' || msg.type === 'music_change';

          if (isDj) {
            return (
              <div
                key={msg.id}
                className="p-3 rounded-xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900/80 border border-purple-500/30 text-white shadow-md relative overflow-hidden"
              >
                <div className="flex items-center gap-1.5 mb-1 text-purple-300 font-semibold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
                  <span>DJ Aura (AI Canlı Anons)</span>
                </div>
                <p className="text-xs text-purple-100/90 leading-relaxed italic">
                  "{msg.text}"
                </p>
              </div>
            );
          }

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="py-1 px-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400 text-center mx-2"
              >
                {msg.text}
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${
                isMe ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <img
                src={
                  msg.userAvatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop'
                }
                alt={msg.userName}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
              />

              <div
                className={`max-w-[78%] rounded-xl px-3 py-1.5 text-xs ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-tl-none'
                }`}
              >
                {!isMe && (
                  <div
                    className="font-medium text-[10px] mb-0.5"
                    style={{ color: msg.userColor || '#818cf8' }}
                  >
                    {msg.userName}
                  </div>
                )}
                <p className="break-words leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-800/60 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Odaya bir şeyler yaz..."
          className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-colors touch-manipulation active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
