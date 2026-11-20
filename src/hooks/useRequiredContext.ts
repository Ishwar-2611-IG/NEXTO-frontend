import { useContext, type Context } from 'react';

/** Reads a context and throws a clear error when used outside its provider. */
export function useRequiredContext<T>(context: Context<T | null>, hookName: string): T {
  const value = useContext(context);
  if (value === null) {
    throw new Error(`${hookName} must be used inside its provider (see src/app/providers/AppProviders.tsx)`);
  }
  return value;
}
