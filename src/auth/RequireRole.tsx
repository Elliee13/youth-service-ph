import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { StaffAccessLoading } from "../components/auth/StaffAccessLoading";
import type { Role } from "./auth.types";
import { useAuth } from "./useAuth";

const GENERIC_SIGNIN_ERROR = "Sign-in failed. Please check your credentials or contact support.";

export function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { loading, user, profile, profileRecovering } = useAuth();
  const location = useLocation();
  const shouldShowRecoveryLoading = Boolean(user) && !profile && profileRecovering;

  if (loading || shouldShowRecoveryLoading) {
    return <StaffAccessLoading />;
  }

  if (!user) {
    return <Navigate to="/staff" replace state={{ from: location.pathname }} />;
  }

  if (!profile) {
    if (import.meta.env.DEV) {
      console.warn("[RequireRole] blocked access: authenticated user has no profile.", {
        expectedRole: role,
        path: location.pathname,
      });
    }
    return (
      <div className="py-16">
        <div className="[font-family:var(--font-display)] text-3xl tracking-[-0.02em]">
          Restricted
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-black/65">{GENERIC_SIGNIN_ERROR}</p>
      </div>
    );
  }

  if (profile.role !== role) {
    if (import.meta.env.DEV) {
      console.warn("[RequireRole] blocked access: role mismatch.", {
        expectedRole: role,
        actualRole: profile.role,
        path: location.pathname,
      });
    }
    return (
      <div className="py-16">
        <div className="[font-family:var(--font-display)] text-3xl tracking-[-0.02em]">
          Restricted
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-black/65">{GENERIC_SIGNIN_ERROR}</p>
      </div>
    );
  }

  return <>{children}</>;
}
