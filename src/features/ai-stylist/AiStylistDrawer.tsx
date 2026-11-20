import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ChatMessage } from '../../types';
import { Sparkles, X, Send } from 'lucide-react';

interface AiStylistDrawerProps {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
}

export function AiStylistDrawer({ messages, loading, onSend, onClose }: AiStylistDrawerProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-stylist-title"
        className="flex h-full w-full max-w-md flex-col justify-between rounded-r-2xl border-r border-[#7E7C77]/20 bg-[#FFFCF7] p-5 shadow-[0_10px_40px_-10px_rgba(46,45,43,0.12)] sm:p-6"
      >
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-[#7E7C77]/20">
            <div className="flex items-center space-x-2">
              <span className="grid size-9 place-items-center rounded-xl bg-[#E8EDE6] text-[#526457]"><Sparkles size={17} aria-hidden="true" /></span>
              <h3 id="ai-stylist-title" className="text-lg font-semibold tracking-tight text-[#2E2D2B]">NEXTO AI Stylist</h3>
            </div>
            <button type="button" onClick={onClose} aria-label="Close AI Stylist" className="grid size-10 place-items-center rounded-full text-[#7E7C77] transition-colors hover:bg-[#F0EBE2] hover:text-[#2E2D2B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7B6E]">
              <X size={17} aria-hidden="true" />
            </button>
          </div>

          <div className="py-6 space-y-4 max-h-[65vh] overflow-y-auto pr-2" aria-live="polite">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-4 text-xs font-mono whitespace-pre-wrap ${
                    msg.role === 'user' ? 'rounded-2xl rounded-br-md bg-[#526457] text-white' : 'rounded-2xl rounded-bl-md border border-[#7E7C77]/15 bg-[#F0EBE2] text-[#4A4945]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#F0EBE2] text-[#7E7C77] p-4 text-xs font-mono border border-[#7E7C77]/20 animate-pulse">
                  Stylist is thinking up a fit...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border-t border-[#7E7C77]/20 pt-4 flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            aria-label="Ask the AI Stylist"
            placeholder="Ask e.g. How to style parachute cargo pants?"
            value={input}
            maxLength={500}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#7E7C77]/20 bg-[#F0EBE2] p-3 text-xs text-[#2E2D2B] placeholder-[#7E7C77] focus:outline-none focus:border-[#6B7B6E] focus:ring-2 focus:ring-[#6B7B6E]/10"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#526457] px-5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white hover:bg-[#445549] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={13} aria-hidden="true" /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
