import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { useToast } from "../../hooks/useToast";

// Must match `duration-200` on the card below.
const EXIT_MS = 200;

export function Toast() {
  const { message } = useToast();

  // [UX-1] The old version unmounted the card the instant `message` became
  // null, so the toast popped out with no exit animation. Keep the last
  // message rendered until the fade-out finishes.
  const [rendered, setRendered] = useState<string | null>(message ?? null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setRendered(message);
      // [BUG-1] `animate-in fade-in slide-in-from-bottom-3` come from the
      // tailwindcss-animate plugin. Without it they silently do nothing.
      // This transition needs no plugin: mount hidden, then flip on the
      // next frame so the browser has a "from" state to animate from.
      const frame = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true)),
      );
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timer = window.setTimeout(() => setRendered(null), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  return (
    // [A11Y-1] The live region stays mounted at all times (required for
    // screen readers to announce content that appears inside it).
    // [A11Y-2] role="status" already implies aria-live="polite" + atomic;
    // explicit attributes kept for older assistive tech.
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={[
        "pointer-events-none fixed inset-x-4 z-[100] flex justify-center",
        // [UX-2] Respect the iPhone home-indicator / Android gesture bar.
        "bottom-[max(1.25rem,env(safe-area-inset-bottom))]",
        "sm:inset-x-auto sm:right-6 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))]",
      ].join(" ")}
    >
      {rendered && (
        <div
          className={[
            "flex w-full max-w-sm items-center gap-3",
            "rounded-xl border border-[#7E7C77]/20 bg-[#F0EBE2] px-4 py-3.5",
            "text-[#2E2D2B] shadow-[0_12px_40px_rgba(0,0,0,0.3)]",
            // [UX-3] Slide + fade via plain transitions (no plugin needed).
            "transition-[opacity,transform] duration-200 ease-out",
            "motion-reduce:transition-none",
            visible
              ? "translate-y-0 opacity-100"
              : "translate-y-3 opacity-0 motion-reduce:translate-y-0",
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[#C5A880]/15 text-[#8B6D43]"
          >
            <CheckCircle2 size={19} strokeWidth={2} />
          </span>

          {/* [CLEAN-1] Dropped `font-sans` (inherited), the odd 0.01em tracking,
              and the decorative right-edge bar that carried no meaning. */}
          <p className="min-w-0 flex-1 break-words text-sm font-medium leading-5 text-[#2E2D2B]/95">
            {rendered}
          </p>
        </div>
      )}
    </div>
  );
}

export default Toast;