import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchProfile, updateDisplayName, type Profile } from "./api";

type ProfileState = {
  email: string;
  displayName: string | null;
  level: number;
  // Re-reads the profile (the level changes when a simulation is finished).
  refresh: () => void;
  saveName: (name: string) => Promise<void>;
};

const ProfileContext = createContext<ProfileState | null>(null);

type Props = { userId: string; email: string; children: ReactNode };

// One profile read shared by the sidebar, the top bar, Overview and Settings.
export function ProfileProvider({ userId, email, children }: Readonly<Props>) {
  const [profile, setProfile] = useState<Profile>({ displayName: null, level: 0 });

  const refresh = useCallback(() => {
    fetchProfile(userId)
      .then(setProfile)
      // Keep showing the last known values if the read fails.
      .catch(() => undefined);
  }, [userId]);

  useEffect(refresh, [refresh]);

  const saveName = useCallback(
    async (name: string) => {
      await updateDisplayName(userId, name);
      setProfile((p) => ({ ...p, displayName: name }));
    },
    [userId],
  );

  const value = useMemo(
    () => ({ email, displayName: profile.displayName, level: profile.level, refresh, saveName }),
    [email, profile, refresh, saveName],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileState {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useProfile must be used inside ProfileProvider");
  return value;
}

export function firstName(displayName: string | null): string | null {
  return displayName?.trim().split(/\s+/)[0] || null;
}

export function initialsOf(displayName: string | null, email: string): string {
  const words = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}
