
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ToastContext } from "../../context/toastContext";

const TOAST_DURATION_MS = 3000;

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    (nextMessage: string) => {
      const next = nextMessage.trim();

      // Ignore empty notifications.
      if (!next) return;

      // Restart the timer so older notifications cannot dismiss newer ones.
      clearTimer();
      setMessage(next);

      timerRef.current = setTimeout(() => {
        setMessage("");
        timerRef.current = null;
      }, TOAST_DURATION_MS);
    },
    [clearTimer],
  );

  const dismissToast = useCallback(() => {
    clearTimer();
    setMessage("");
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const value = useMemo(
    () => ({
      message,
      showToast,
      dismissToast,
    }),
    [message, showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}
