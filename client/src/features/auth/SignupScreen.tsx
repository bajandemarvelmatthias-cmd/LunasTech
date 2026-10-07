import { useState, type FormEvent } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { GoogleButton } from "./GoogleButton";
import { authErrorMessage, EXISTING_ACCOUNT_MESSAGE } from "./errors";
import { birthdayProblem, MIN_BIRTHDAY, todayIso } from "@/features/account/birthday";
import { isValidEmail, isValidNewPassword, PASSWORD_MIN_LENGTH } from "./validation";

type Props = {
  onConfirmationSent: (email: string) => void;
};

export function SignupScreen({ onConfirmationSent }: Readonly<Props>) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirm: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRule = `At least ${PASSWORD_MIN_LENGTH} characters.`;
  const firstNameError = touched.firstName && !firstName.trim() ? "Enter your first name." : undefined;
  const lastNameError = touched.lastName && !lastName.trim() ? "Enter your last name." : undefined;
  const birthdayError = birthdayProblem(birthday);
  const emailError =
    touched.email && !isValidEmail(email) ? "Enter a valid email address." : undefined;
  const passwordError =
    touched.password && !isValidNewPassword(password)
      ? `Password needs at least ${PASSWORD_MIN_LENGTH} characters.`
      : undefined;
  const confirmError =
    touched.confirm && confirm !== password ? "Passwords do not match." : undefined;
  const valid =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    !birthdayError &&
    isValidEmail(email) &&
    isValidNewPassword(password) &&
    confirm === password;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        // The database copies these into the new profile (see handle_new_user).
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          birthday: birthday || null,
        },
      },
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
      <TextField
        label="First name"
        autoComplete="given-name"
        maxLength={100}
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
        error={firstNameError}
      />
      <TextField
        label="Last name"
        autoComplete="family-name"
        maxLength={100}
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
        error={lastNameError}
      />
      <TextField
        label="Birthday (optional)"
        type="date"
        autoComplete="bday"
        min={MIN_BIRTHDAY}
        max={todayIso()}
        value={birthday}
        onChange={(e) => setBirthday(e.target.value)}
        error={birthdayError}
      />
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
      <TextField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
        error={confirmError}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={!valid}
        loading={submitting}
        className="flex items-center justify-center gap-2"
      >
        {submitting ? "Creating account" : "Create my account"}
        {!submitting && <ArrowRight className="size-6" aria-hidden="true" />}
      </Button>
      <GoogleButton label="Sign up with Google" />
    </form>
  );
}
