export const MIN_BIRTHDAY = "1900-01-01";

// Local date as YYYY-MM-DD, so "today" is the user's today and not UTC's.
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// An empty birthday is fine: it is optional everywhere.
export function birthdayProblem(birthday: string): string | undefined {
  if (!birthday) return undefined;
  return birthday > todayIso() || birthday < MIN_BIRTHDAY
    ? "Enter a birthday that is not in the future."
    : undefined;
}
