import { createContext } from 'react';

export interface ToastContextValue {
  message: string;
  showToast: (message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
