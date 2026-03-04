import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile, Role } from "./auth.types";

export type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);
