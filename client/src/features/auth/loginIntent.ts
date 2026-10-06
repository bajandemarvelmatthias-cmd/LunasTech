// Which workspace the person chose on the login form. Kept in sessionStorage
// because signing in swaps the screen before any check can run. It only picks
// the workspace that opens first; the database still decides what an admin may do.
export type LoginIntent = "customer" | "admin";
const KEY = "lunastech-login-intent";

export function saveLoginIntent(intent: LoginIntent) {
  try {
    sessionStorage.setItem(KEY, intent);
  } catch {
    /* storage unavailable: the person lands in their default workspace */
  }
}

export function takeLoginIntent(): LoginIntent | null {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return value === "admin" || value === "customer" ? value : null;
  } catch {
    return null;
  }
}
