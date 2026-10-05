import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button, TextButton } from "@/components/ui/Button";
import { authErrorMessage } from "./errors";

// Seconds before the link can be requested again. Supabase's built-in sender
// is limited to 2 emails per hour for the whole project (open-questions.md #14).
const RESEND_COOLDOWN = 60;

type Props = {
  email: string;
  // "signup": confirmation link. "recovery": password reset link.
  purpose: "signup" | "recovery";
  onBack: () => void;
};

export function CheckEmailScreen({ email, purpose, onBack }: Readonly<Props>) {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ kind: "sent" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  async function resend() {
    setSending(true);
    setStatus(null);
    const { error } =
      purpose === "recovery"
        ? await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
          })
        : await supabase.auth.resend({
            type: "signup",
            email,
            options: { emailRedirectTo: window.location.origin },
          });
    setSending(false);
    if (error) {
      setStatus({ kind: "error", text: authErrorMessage(error) });
      return;
    }
    setStatus({ kind: "sent", text: "Email sent." });
    setSecondsLeft(RESEND_COOLDOWN);
  }

  let buttonLabel = "Resend email";
  if (sending) buttonLabel = "Sending";
  else if (secondsLeft > 0) buttonLabel = `Resend in ${secondsLeft}s`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Check your email</h1>
      {purpose === "recovery" ? (
        <p className="text-base">
          If an account exists for <span className="font-semibold">{email}</span>, we sent a
          link to reset the password.
        </p>
      ) : (
        <p className="text-base">
          We sent a confirmation link to <span className="font-semibold">{email}</span>.
        </p>
      )}
      {status?.kind === "error" && (
        <p role="alert" className="text-sm text-danger">
          {status.text}
        </p>
      )}
      {status?.kind === "sent" && (
        <output className="text-sm text-text-muted">{status.text}</output>
      )}
      <Button onClick={resend} disabled={secondsLeft > 0} loading={sending}>
        {buttonLabel}
      </Button>
      <p className="text-center text-base">
        <TextButton onClick={onBack}>Back to log in</TextButton>
      </p>
    </div>
  );
}
