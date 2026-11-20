import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

const load = async () => (await import('../services/aiStylist'));

describe('askStylist', () => {
  it('reports a configuration error when no trusted proxy is configured', async () => {
    vi.stubEnv('VITE_AI_STYLIST_PROXY_URL', '');
    const { askStylist } = await load();
    await expect(askStylist('hi')).rejects.toMatchObject({ kind: 'config' });
  });

  it('returns model text through the configured server-side proxy without sending provider keys', async () => {
    vi.stubEnv('VITE_AI_STYLIST_PROXY_URL', 'https://stylist-proxy.example.test/generate');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'wear the cargos' }] } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { askStylist } = await load();
    await expect(askStylist('what to wear?')).resolves.toBe('wear the cargos');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://stylist-proxy.example.test/generate');
    expect(init.headers['x-goog-api-key']).toBeUndefined();
  });

  it('maps empty and network failures to friendly errors', async () => {
    vi.stubEnv('VITE_AI_STYLIST_PROXY_URL', 'https://stylist-proxy.example.test/generate');
    const { askStylist } = await load();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    await expect(askStylist('x')).rejects.toMatchObject({ kind: 'empty' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(askStylist('x')).rejects.toMatchObject({ kind: 'network' });
  });
});
