/** Every VITE_* value is public browser configuration; provider secrets belong on a server. */
export const env = {
  aiProxyUrl: (import.meta.env.VITE_AI_STYLIST_PROXY_URL as string | undefined) ?? '',
} as const;
