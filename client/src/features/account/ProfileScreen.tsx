import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, OutlineButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { PageHeader } from "@/features/overview/parts";
import { useAccount } from "./AccountProvider";
import { birthdayProblem, MIN_BIRTHDAY, todayIso } from "./birthday";

function Form({
  email,
  role,
  avatarUrl,
}: Readonly<{ email: string; role: string; avatarUrl: string | null }>) {
  const { profile, name, save } = useAccount();
  const saved = profile ?? { firstName: "", lastName: "", birthday: "", nickname: "" };
  const [firstName, setFirstName] = useState(saved.firstName);
  const [lastName, setLastName] = useState(saved.lastName);
  const [birthday, setBirthday] = useState(saved.birthday);
  const [nickname, setNickname] = useState(saved.nickname);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const today = todayIso();
  const birthdayError = birthdayProblem(birthday);
  const changed =
    firstName.trim() !== saved.firstName ||
    lastName.trim() !== saved.lastName ||
    birthday !== saved.birthday ||
    nickname.trim() !== saved.nickname;
  const valid =
    changed &&
    !birthdayError &&
    firstName.trim().length <= 100 &&
    lastName.trim().length <= 100 &&
    nickname.trim().length <= 50;

  function reset() {
    setFirstName(saved.firstName);
    setLastName(saved.lastName);
    setBirthday(saved.birthday);
    setNickname(saved.nickname);
    setError(null);
    setDone(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    setDone(false);
    try {
      await save({ firstName, lastName, birthday, nickname });
      setDone(true);
    } catch {
      setError("Can't save your profile. Check your connection and try again.");
    }
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Avatar name={name} url={avatarUrl} className="size-20 text-lg" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-base font-semibold">{name}</span>
          <span className="text-sm text-text-muted">{role}</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <TextField
          label="First name"
          autoComplete="given-name"
          maxLength={100}
          value={firstName}
          onChange={(e) => {
            setFirstName(e.target.value);
            setDone(false);
          }}
        />
        <TextField
          label="Last name"
          autoComplete="family-name"
          maxLength={100}
          value={lastName}
          onChange={(e) => {
            setLastName(e.target.value);
            setDone(false);
          }}
        />
        <TextField
          label="Nickname"
          autoComplete="nickname"
          maxLength={50}
          help="Optional. Shown in the menu instead of your name."
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setDone(false);
          }}
        />
        <TextField
          label="Birthday"
          type="date"
          autoComplete="bday"
          min={MIN_BIRTHDAY}
          max={today}
          value={birthday}
          onChange={(e) => {
            setBirthday(e.target.value);
            setDone(false);
          }}
          error={birthdayError}
        />
        <TextField label="Email" type="email" value={email} readOnly help="Your email can't be changed here." />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {done && (
          <output className="block text-sm font-semibold text-accent">Profile saved.</output>
        )}
        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={!valid} loading={submitting}>
            {submitting ? "Saving" : "Save changes"}
          </Button>
          {changed && !submitting && (
            <OutlineButton onClick={reset} className="w-full">
              Discard changes
            </OutlineButton>
          )}
        </div>
      </form>
    </div>
  );
}

// Profile page: picture, name, nickname, birthday and email. Google sign-ups arrive with
// their name already filled in. The email is read-only.
export function ProfileScreen({
  email,
  role,
  avatarUrl,
}: Readonly<{ email: string; role: string; avatarUrl: string | null }>) {
  const { profile, loading, error, retry } = useAccount();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Profile" />
      {error && (
        <div className="flex flex-col items-start gap-4">
          <p role="alert" className="text-sm text-danger">
            Can't load your profile. Check your connection and try again.
          </p>
          <OutlineButton onClick={retry}>Try again</OutlineButton>
        </div>
      )}
      {!error && loading && !profile && <p className="text-base text-text-muted">Loading</p>}
      {!error && profile && <Form email={email} role={role} avatarUrl={avatarUrl} />}
    </div>
  );
}
