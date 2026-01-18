import React from "react";
import { AuthProvider } from "../auth/AuthProvider";
import { ToastProvider } from "../components/ui/ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
