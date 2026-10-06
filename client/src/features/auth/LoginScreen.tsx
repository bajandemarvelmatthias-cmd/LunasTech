import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Button, TextButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/utils";
import { authErrorMessage } from "./errors";
import { saveLoginIntent, type LoginIntent } from "./loginIntent";
import { isValidEmail } from "./validation";

type Props = {
  notice: string | null;
  onNeedsConfirmation: (email: string) => void;
  onForgotPassword: () => void;
};

export function LoginScreen({
  notice,
  onNeedsConfirmation,
  onForgotPassword,
}: Readonly<Props>) {
  const [role, setRole] = useState<LoginIntent>("customer");
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
    saveLoginIntent(role);
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
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Continue as</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["customer", "admin"] as const).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={role === r}
              onClick={() => setRole(r)}
              className={cn(
                "h-(--size-control) rounded-md border text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                role === r ? "border-accent bg-accent-soft text-accent" : "border-border text-text-muted",
              )}
            >
              {r === "customer" ? "Customer" : "Admin"}
            </button>
          ))}
        </div>
      </fieldset>
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
      <TextButton onClick={onForgotPassword} className="-mt-2 self-end py-2">
        Forgot password?
      </TextButton>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!valid} loading={submitting}>
        {submitting ? "Logging in" : "Log in"}
      </Button>
    </form>
  );
}
