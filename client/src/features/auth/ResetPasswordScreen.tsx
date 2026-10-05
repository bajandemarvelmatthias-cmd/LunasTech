import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { authErrorMessage } from "./errors";
import { isValidNewPassword, PASSWORD_MIN_LENGTH } from "./validation";

type Props = { onDone: () => void };

// Shown after the user opens a reset link. The link has already signed them in,
// so this only sets the new password. Single task, no way back needed.
export function ResetPasswordScreen({ onDone }: Readonly<Props>) {
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordError =
    touched && !isValidNewPassword(password)
      ? `Password needs at least ${PASSWORD_MIN_LENGTH} characters.`
      : undefined;
  const valid = isValidNewPassword(password);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setSubmitting(false);
      setError(authErrorMessage(updateError));
      return;
    }
    onDone(); // Root swaps to the signed-in screen
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Reset password</h1>
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => setTouched(true)}
        help={`At least ${PASSWORD_MIN_LENGTH} characters.`}
        error={passwordError}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!valid} loading={submitting}>
        {submitting ? "Saving" : "Save password"}
      </Button>
    </form>
  );
}
