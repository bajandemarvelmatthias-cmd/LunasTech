import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { OutlineButton } from "@/components/ui/Button";
import { authErrorMessage } from "./errors";

// Official four-colour Google "G" mark.
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-6" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

// Google shares first and last name by default. The birthday needs this extra
// permission; AccountProvider reads it once after sign-in (decision-log.md #32).
const BIRTHDAY_SCOPE = "https://www.googleapis.com/auth/user.birthday.read";

// "or" divider plus the Google button. Sends the user to Google, which returns
// to this same origin; AuthProvider then picks up the session.
export function GoogleButton({ label }: Readonly<{ label: string }>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin, scopes: BIRTHDAY_SCOPE },
    });
    // On success the browser leaves for Google, so only errors come back here.
    if (oauthError) {
      setLoading(false);
      setError(authErrorMessage(oauthError));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 text-sm text-text-muted" role="separator">
        <span className="h-px flex-1 bg-border" />
        <span>or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <OutlineButton onClick={() => void handleClick()} disabled={loading} className="w-full">
        <GoogleMark />
        {loading ? "Opening Google" : label}
      </OutlineButton>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
