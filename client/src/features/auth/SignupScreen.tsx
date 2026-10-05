import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Button, TextButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { authErrorMessage, EXISTING_ACCOUNT_MESSAGE } from "./errors";
import { isValidEmail, isValidNewPassword, PASSWORD_MIN_LENGTH } from "./validation";

type Props = {
  onConfirmationSent: (email: string) => void;
  onSwitchToLogin: () => void;
};

export function SignupScreen({ onConfirmationSent, onSwitchToLogin }: Readonly<Props>) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRule = `At least ${PASSWORD_MIN_LENGTH} characters.`;
  const emailError =
    touched.email && !isValidEmail(email) ? "Enter a valid email address." : undefined;
  const passwordError =
    touched.password && !isValidNewPassword(password)
      ? `Password needs at least ${PASSWORD_MIN_LENGTH} characters.`
      : undefined;
  const valid = isValidEmail(email) && isValidNewPassword(password);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (signUpError) {
      setSubmitting(false);
      setError(authErrorMessage(signUpError));
      return;
    }
    // Signed in at once: the project has email confirmation turned off.
    // AuthProvider swaps the screen.
    if (data.session) return;
    setSubmitting(false);
    // With confirmation on, an existing address comes back with no identities.
    if (data.user?.identities?.length === 0) {
      setError(EXISTING_ACCOUNT_MESSAGE);
      return;
    }
    onConfirmationSent(email.trim());
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Sign up</h1>
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
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
        help={passwordRule}
        error={passwordError}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!valid} loading={submitting}>
        {submitting ? "Signing up" : "Sign up"}
      </Button>
      <p className="text-center text-base">
        Have an account? <TextButton onClick={onSwitchToLogin}>Log in</TextButton>
      </p>
    </form>
  );
}
