import { useCallback, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AiStylistDrawer } from './AiStylistDrawer';
import { useAiStylist } from './useAiStylist';

/** Floating launcher + slide-out chat. Chat history lives here so it survives closing the drawer. */
export function AiStylist() {
  const [open, setOpen] = useState(false);
  const { messages, loading, send } = useAiStylist();
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6 bg-[#526457] text-white font-extrabold px-4 py-3 sm:px-5 rounded-full shadow-[0_10px_30px_-10px_rgba(46,45,43,0.18)] hover:bg-[#445549] flex items-center space-x-2 text-xs uppercase tracking-widest hover:scale-105 transition-transform"
      >
        <><Sparkles size={15} aria-hidden="true" /> <span>AI Stylist</span></>
      </button>
      {open && <AiStylistDrawer messages={messages} loading={loading} onSend={send} onClose={close} />}
    </>
  );
}
