import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { TextField } from "@/components/ui/TextField";
import { authErrorMessage } from "@/features/auth/errors";
import { isValidNewPassword, PASSWORD_MIN_LENGTH } from "@/features/auth/validation";
import { useProfile } from "@/features/profile/ProfileProvider";
import { supabase } from "@/lib/supabase";

function NameCard() {
  const { displayName, email, saveName } = useProfile();
  const [name, setName] = useState(displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const trimmed = name.trim();
  const changed = trimmed !== (displayName ?? "") && trimmed.length > 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!changed || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      await saveName(trimmed);
      setMessage({ ok: true, text: "Name saved." });
    } catch {
      setMessage({ ok: false, text: "Can't save your name. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Your name</h2>
        <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <TextField label="Email" value={email} disabled readOnly />
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm text-accent" : "text-sm text-danger"}>
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={!changed} loading={saving} className="w-auto self-start">
          {saving ? "Saving" : "Save name"}
        </Button>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const { email } = useProfile();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const nextError =
    touched.next && !isValidNewPassword(next) ? `Password needs at least ${PASSWORD_MIN_LENGTH} characters.` : undefined;
  const confirmError = touched.confirm && confirm !== next ? "Passwords don't match." : undefined;
  const valid = current.length > 0 && isValidNewPassword(next) && confirm === next;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setMessage(null);
    // Supabase does not check the old password on update, so confirm it first.
    const check = await supabase.auth.signInWithPassword({ email, password: current });
    if (check.error) {
      setSaving(false);
      setMessage({
        ok: false,
        text: check.error.code === "invalid_credentials" ? "Current password is incorrect." : authErrorMessage(check.error),
      });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (error) {
      setMessage({ ok: false, text: authErrorMessage(error) });
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setTouched({ next: false, confirm: false });
    setMessage({ ok: true, text: "Password updated." });
  }

  return (
    <Card>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Change password</h2>
        <TextField
          label="Current password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
        />
        <TextField
          label="New password"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, next: true }))}
          error={nextError}
          help={`At least ${PASSWORD_MIN_LENGTH} characters.`}
          autoComplete="new-password"
        />
        <TextField
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
          error={confirmError}
          autoComplete="new-password"
        />
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm text-accent" : "text-sm text-danger"}>
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={!valid} loading={saving} className="w-auto self-start">
          {saving ? "Updating" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}

// Name and password. Email is shown but cannot be changed here.
export function SettingsScreen() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Update your name and password." />
      <NameCard />
      <PasswordCard />
    </>
  );
}
