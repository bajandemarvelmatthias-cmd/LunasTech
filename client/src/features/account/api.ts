import { supabase } from "@/lib/supabase";

export type Profile = {
  firstName: string;
  lastName: string;
  // YYYY-MM-DD, or empty when not set.
  birthday: string;
  // Optional. Shown in the account menu instead of the full name.
  nickname: string;
};

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  birthday: string | null;
  nickname: string | null;
};

const toProfile = (row: ProfileRow): Profile => ({
  firstName: row.first_name ?? "",
  lastName: row.last_name ?? "",
  birthday: row.birthday ?? "",
  nickname: row.nickname ?? "",
});

// RLS lets a user read only their own row.
export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, birthday, nickname")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return toProfile(data as ProfileRow);
}

// display_name is kept equal to "first last" so the admin Customers list shows it.
export async function saveProfile(userId: string, input: Profile): Promise<Profile> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      display_name: `${firstName} ${lastName}`.trim() || null,
      birthday: input.birthday || null,
      nickname: input.nickname.trim() || null,
    })
    .eq("id", userId)
    .select("first_name, last_name, birthday, nickname")
    .single();
  if (error) throw error;
  return toProfile(data as ProfileRow);
}

// Password sign-in exists when the account has an email identity. Google-only
// accounts have no password until one is set.
export function hasPassword(providers: unknown): boolean {
  return Array.isArray(providers) && providers.includes("email");
}
