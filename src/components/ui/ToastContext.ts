import { createContext } from "react";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

export type ToastContextValue = {
  addToast: (toast: { type: ToastType; message: string; durationMs?: number }) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
