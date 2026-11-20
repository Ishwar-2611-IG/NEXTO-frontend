import { env } from '../config/env';

export const STYLIST_SYSTEM_PROMPT =
  'You are NEXTO AI Stylist, an expert urban streetwear fashion consultant for the brand NEXTO (New Arrivals & Fall 2025 collection). Give concise, punchy, trendy streetwear advice and outfit pairing suggestions in a cool, confident tone.';

export const STYLIST_GREETING =
  "Yo! I'm your NEXTO AI Stylist. Ask me about streetwear trends, outfit matching, or sizing for our New Arrivals drop!";

export const STYLIST_FALLBACKS = {
  empty: 'My styling circuits are glitching right now. Try again in a sec!',
  network: 'Network error connecting to AI Stylist. Check your connection!',
  timeout: 'The stylist took too long to answer. Try again in a sec!',
  config:
    "AI Stylist isn't connected yet. Configure VITE_AI_STYLIST_PROXY_URL to a trusted server-side proxy.",
} as const;

export type AiStylistErrorKind = keyof typeof STYLIST_FALLBACKS;

export class AiStylistError extends Error {
  readonly kind: AiStylistErrorKind;
  constructor(kind: AiStylistErrorKind, message?: string) {
    super(message ?? STYLIST_FALLBACKS[kind]);
    this.name = 'AiStylistError';
    this.kind = kind;
  }
}

const REQUEST_TIMEOUT_MS = 20_000;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

const resolveEndpoint = (): { url: string; headers: Record<string, string> } => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.aiProxyUrl) return { url: env.aiProxyUrl, headers };
  throw new AiStylistError('config');
};

/**
 * Sends a question to the stylist model and resolves with the reply text.
 * Honours the caller's AbortSignal and applies its own timeout.
 */
export async function askStylist(question: string, signal?: AbortSignal): Promise<string> {
  const { url, headers } = resolveEndpoint();

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);
  const onCallerAbort = () => timeoutController.abort();
  signal?.addEventListener('abort', onCallerAbort);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      signal: timeoutController.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${STYLIST_SYSTEM_PROMPT}\n\nUser Question: ${question}` }] }],
      }),
    });

    if (!response.ok) throw new AiStylistError('empty');

    const result = (await response.json()) as GeminiResponse;
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new AiStylistError('empty');
    return text;
  } catch (error) {
    if (error instanceof AiStylistError) throw error;
    if (signal?.aborted) throw error; // caller cancelled: let them handle it silently
    if (timeoutController.signal.aborted) throw new AiStylistError('timeout');
    throw new AiStylistError('network');
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}
