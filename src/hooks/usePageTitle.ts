import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | NEXTO` : "NEXTO — Streetwear for what's next";
  }, [title]);
}
