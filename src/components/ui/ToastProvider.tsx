import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  addToast: (toast: { type: ToastType; message: string; durationMs?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastHost({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-6 top-6 z-50 flex w-[min(360px,90vw)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            "pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur",
            toast.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800"
              : toast.type === "error"
              ? "border-red-500/20 bg-red-500/10 text-red-700"
              : "border-black/10 bg-white text-black/70",
          ].join(" ")}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-4">
            <div>{toast.message}</div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-xs text-current/70 hover:text-current"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (toast: { type: ToastType; message: string; durationMs?: number }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const next: Toast = { id, type: toast.type, message: toast.message };
      setToasts((prev) => [...prev, next]);

      const duration = toast.durationMs ?? 4200;
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const value = useMemo<ToastContextValue>(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider />");
  return ctx;
}
