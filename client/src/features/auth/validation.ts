export const PASSWORD_MIN_LENGTH = 8;

// Format check only. Supabase decides whether the address can receive mail.
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidNewPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH;
}
