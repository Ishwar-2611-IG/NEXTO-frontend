import { ROUTES } from '../../constants/routes';

/**
 * Accept only same-origin application paths for post-authentication navigation.
 * Reject protocol-relative URLs, backslashes, control characters and login loops.
 */
export function getSafePostLoginRedirect(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) {
    return ROUTES.account;
  }

  const candidate = value.trim();
  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    [...candidate].some((character) => {
      const code = character.charCodeAt(0);
      return code <= 0x1f || code === 0x7f;
    })
  ) {
    return ROUTES.account;
  }

  // Parse as a relative URL against a fixed local origin and verify it stays there.
  try {
    const parsed = new URL(candidate, 'https://nexto.invalid');
    if (parsed.origin !== 'https://nexto.invalid') return ROUTES.account;
    if (parsed.pathname === ROUTES.login || parsed.pathname.startsWith(`${ROUTES.login}/`)) {
      return ROUTES.account;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return ROUTES.account;
  }
}
