import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Button, TextButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { authErrorMessage } from "./errors";
import { isValidEmail } from "./validation";

type Props = {
  notice: string | null;
  onNeedsConfirmation: (email: string) => void;
  onSwitchToSignup: () => void;
};

export function LoginScreen({ notice, onNeedsConfirmation, onSwitchToSignup }: Readonly<Props>) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError =
    touched.email && !isValidEmail(email) ? "Enter a valid email address." : undefined;
  const passwordError =
    touched.password && !password ? "Enter your password." : undefined;
  const valid = isValidEmail(email) && password.length > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (!signInError) return; // AuthProvider swaps the screen
    setSubmitting(false);
    if (signInError.code === "email_not_confirmed") {
      onNeedsConfirmation(email.trim());
      return;
    }
    setError(authErrorMessage(signInError));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Log in</h1>
      {notice && (
        <p role="alert" className="text-sm text-danger">
          {notice}
        </p>
      )}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        error={emailError}
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
        error={passwordError}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!valid} loading={submitting}>
        {submitting ? "Logging in" : "Log in"}
      </Button>
      <p className="text-center text-base">
        No account? <TextButton onClick={onSwitchToSignup}>Sign up</TextButton>
      </p>
    </form>
  );
}
