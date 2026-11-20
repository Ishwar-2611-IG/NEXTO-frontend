import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { api } from '../../services/api';

/** Dismissible store notice. Dismissal lasts until the app is refreshed. */
export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [announcement, setAnnouncement] = useState<{
    text: string;
    isActive: boolean;
    bgColor: string;
    textColor: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void api
      .get<{
        content: { announcement: NonNullable<typeof announcement> };
        initialized: boolean;
      }>('/content')
      .then((response) => {
        if (active && response.initialized) {
          setAnnouncement(response.content.announcement);
        }
      })
      .catch((error: unknown) => {
        console.error('Unable to load storefront announcement.', error);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!isVisible || (announcement && !announcement.isActive)) return null;

  const message = announcement?.text ?? 'Complimentary delivery on orders above ₹999';

  return (
    <div
      role="region"
      aria-label="Store delivery and returns information"
      className="relative z-[101] flex min-h-9 flex-wrap items-center justify-center gap-x-2 gap-y-1 leading-4 border-b border-[#7E7C77]/15 bg-[#F0EBE2] px-10 py-2 text-center text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#5E5C56] sm:gap-3 sm:px-12 sm:text-[10px] sm:tracking-[0.14em]"
      style={announcement ? { backgroundColor: announcement.bgColor, color: announcement.textColor } : undefined}
    >
      <span className="hidden text-[#6B7B6E] sm:inline" aria-hidden="true">✦</span>
      {announcement ? (
        <span>{message}</span>
      ) : (
        <>
          <span>{message}</span>
          <span aria-hidden="true" className="text-[#7E7C77]">·</span>
          <Link
            to={ROUTES.support}
            className="underline decoration-[#6B7B6E]/50 underline-offset-4 transition-colors hover:text-[#526457] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B7B6E]"
          >
            Easy 7-day returns
          </Link>
        </>
      )}
      <button
        type="button"
        aria-label="Dismiss delivery and returns announcement"
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-[#5E5C56] transition-colors hover:bg-[#2E2D2B]/[0.06] hover:text-[#2E2D2B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#6B7B6E] sm:right-4"
      >
        <X size={14} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </div>
  );
}
