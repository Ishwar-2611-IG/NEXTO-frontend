import { describe, expect, it } from 'vitest';
import { ROUTES } from '../constants/routes';
import { getSafePostLoginRedirect } from '../features/auth/safeRedirect';

describe('getSafePostLoginRedirect', () => {
  it('preserves a valid internal path, query and hash', () => {
    expect(getSafePostLoginRedirect('/orders?page=2#latest')).toBe('/orders?page=2#latest');
  });

  it.each([
    undefined,
    null,
    42,
    '',
    'https://attacker.example',
    '//attacker.example/path',
    '/\\attacker.example',
    '/login',
    '/login/reset',
    '/bad\npath',
  ])('falls back for an unsafe redirect: %s', (value) => {
    expect(getSafePostLoginRedirect(value)).toBe(ROUTES.account);
  });
});
