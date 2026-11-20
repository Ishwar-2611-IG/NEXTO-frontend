import { useCallback, useEffect, useRef, useState } from 'react';
import { AiStylistError, STYLIST_FALLBACKS, STYLIST_GREETING, askStylist } from '../../services/aiStylist';
import type { ChatMessage } from '../../types';

const GREETING: ChatMessage = { id: 'greeting', role: 'model', text: STYLIST_GREETING };

export function useAiStylist() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const counterRef = useRef(0);

  const nextId = () => `msg-${++counterRef.current}`;

  const send = useCallback(async (text: string) => {
    const question = text.trim();
    if (!question || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: question }]);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const reply = await askStylist(question, controller.signal);
      setMessages((prev) => [...prev, { id: nextId(), role: 'model', text: reply }]);
    } catch (error) {
      if (controller.signal.aborted) return; // unmounted / cancelled: nothing to show
      const fallback = error instanceof AiStylistError ? error.message : STYLIST_FALLBACKS.network;
      setMessages((prev) => [...prev, { id: nextId(), role: 'model', text: fallback }]);
    } finally {
      if (!controller.signal.aborted) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  // Cancel any in-flight request when the stylist unmounts.
  useEffect(() => () => controllerRef.current?.abort(), []);

  return { messages, loading, send };
}
