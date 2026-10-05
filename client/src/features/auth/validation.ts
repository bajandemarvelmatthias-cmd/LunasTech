export const PASSWORD_MIN_LENGTH = 8;

// Format check only. Supabase decides whether the address can receive mail.
export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (/\s/.test(email)) return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local) return false;
  // Needs a dot in the domain with at least one character on each side.
  const dot = domain.indexOf(".", 1);
  return dot !== -1 && dot < domain.length - 1;
}

export function isValidNewPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH;
}
