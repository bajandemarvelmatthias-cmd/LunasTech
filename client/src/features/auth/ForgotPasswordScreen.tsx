import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Button, TextButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { authErrorMessage } from "./errors";
import { isValidEmail } from "./validation";

type Props = {
  onLinkSent: (email: string) => void;
  onBack: () => void;
};

export function ForgotPasswordScreen({ onLinkSent, onBack }: Readonly<Props>) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError =
    touched && !isValidEmail(email) ? "Enter a valid email address." : undefined;
  const valid = isValidEmail(email);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    setSubmitting(false);
    if (resetError) {
      setError(authErrorMessage(resetError));
      return;
    }
    onLinkSent(email.trim());
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Forgot password</h1>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched(true)}
        error={emailError}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!valid} loading={submitting}>
        {submitting ? "Sending" : "Send reset link"}
      </Button>
      <p className="text-center text-base">
        <TextButton onClick={onBack}>Back to log in</TextButton>
      </p>
    </form>
  );
}
