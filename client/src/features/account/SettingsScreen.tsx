import { useState, type FormEvent } from "react";
import { GoogleLogo, Password } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { PageHeader } from "@/features/overview/parts";
import { useAuth } from "@/features/auth/AuthProvider";
import { authErrorMessage } from "@/features/auth/errors";
import { isValidNewPassword, PASSWORD_MIN_LENGTH } from "@/features/auth/validation";
import { supabase } from "@/lib/supabase";
import { hasPassword } from "./api";

function PasswordForm({ email, hadPassword }: Readonly<{ email: string; hadPassword: boolean }>) {
  const [passwordSet, setPasswordSet] = useState(hadPassword);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ current: false, next: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const needsCurrent = passwordSet;
  const currentMissing = touched.current && needsCurrent && current === "";
  let nextError: string | undefined;
  if (touched.next && !isValidNewPassword(next)) {
    nextError = `Password needs at least ${PASSWORD_MIN_LENGTH} characters.`;
  } else if (touched.next && needsCurrent && next === current) {
    nextError = "Choose a password different from your current one.";
  }
  const confirmError = touched.confirm && confirm !== next ? "Passwords do not match." : undefined;
  const valid =
    (!needsCurrent || current !== "") &&
    isValidNewPassword(next) &&
    confirm === next &&
    (!needsCurrent || next !== current);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    setCurrentError(null);
    setDone(false);

    // Confirm it is really the owner before changing the password.
    if (needsCurrent) {
      const { error: checkError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (checkError) {
        setSubmitting(false);
        if (checkError.code === "invalid_credentials") setCurrentError("Current password is incorrect.");
        else setError(authErrorMessage(checkError));
        return;
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    setSubmitting(false);
    if (updateError) {
      setError(authErrorMessage(updateError));
      return;
    }
    setPasswordSet(true);
    setCurrent("");
    setNext("");
    setConfirm("");
    setTouched({ current: false, next: false, confirm: false });
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">{passwordSet ? "Change password" : "Set a password"}</h2>
        {!passwordSet && (
          <p className="text-sm text-text-muted">
            You log in with Google. Set a password to also log in with your email.
          </p>
        )}
      </div>
      {needsCurrent && (
        <TextField
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            setCurrentError(null);
            setDone(false);
          }}
          onBlur={() => setTouched((t) => ({ ...t, current: true }))}
          error={currentError ?? (currentMissing ? "Enter your current password." : undefined)}
        />
      )}
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        value={next}
        onChange={(e) => {
          setNext(e.target.value);
          setDone(false);
        }}
        onBlur={() => setTouched((t) => ({ ...t, next: true }))}
        help={`At least ${PASSWORD_MIN_LENGTH} characters.`}
        error={nextError}
      />
      <TextField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value);
          setDone(false);
        }}
        onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
        error={confirmError}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {done && (
        <output className="block text-sm font-semibold text-accent">Password saved.</output>
      )}
      <Button type="submit" disabled={!valid} loading={submitting}>
        {submitting ? "Saving" : "Save password"}
      </Button>
    </form>
  );
}

function SignInMethods({ providers, hasPw }: Readonly<{ providers: string[]; hasPw: boolean }>) {
  const google = providers.includes("google");
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">Sign-in methods</h2>
      <ul className="divide-y divide-border">
        {google && (
          <li className="flex min-h-12 items-center gap-3 py-2">
            <GoogleLogo className="size-6 text-text-muted" aria-hidden="true" />
            <span className="text-base">Google</span>
          </li>
        )}
        {hasPw && (
          <li className="flex min-h-12 items-center gap-3 py-2">
            <Password className="size-6 text-text-muted" aria-hidden="true" />
            <span className="text-base">Email and password</span>
          </li>
        )}
      </ul>
    </section>
  );
}

// Settings page: how the person logs in. Change the password (confirmed with
// the current one) or, for Google accounts, set one.
export function SettingsScreen({ email }: Readonly<{ email: string }>) {
  const { session } = useAuth();
  const providersRaw = session?.user.app_metadata?.providers;
  const providers = Array.isArray(providersRaw) ? (providersRaw as string[]) : [];
  const hadPassword = hasPassword(providers);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings" />
      <SignInMethods providers={providers} hasPw={hadPassword} />
      <PasswordForm email={email} hadPassword={hadPassword} />
    </div>
  );
}
