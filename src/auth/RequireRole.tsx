import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "./auth.types";
import { useAuth } from "./AuthProvider";

export function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { loading, user, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="py-16">
        <div className="h-6 w-52 rounded bg-black/5" />
        <div className="mt-4 h-4 w-80 rounded bg-black/5" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/sign-in?role=${role}`} replace state={{ from: location.pathname }} />;
  }

  // Signed in but not provisioned in profiles table
  if (!profile) {
    return (
      <div className="py-16">
        <div className="[font-family:var(--font-display)] text-3xl tracking-[-0.02em]">
          Access not provisioned
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-black/65">
          Your account exists, but it hasn’t been assigned a role yet. Ask the admin to create your
          profile record in the database.
        </p>
      </div>
    );
  }

  if (profile.role !== role) {
    return (
      <div className="py-16">
        <div className="[font-family:var(--font-display)] text-3xl tracking-[-0.02em]">
          Restricted
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-black/65">
          You’re signed in as <span className="font-semibold">{profile.role}</span> but tried to access{" "}
          <span className="font-semibold">{role}</span> routes.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
