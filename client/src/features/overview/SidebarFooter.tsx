import { Lightning } from "@phosphor-icons/react";
import { TextButton } from "@/components/ui/Button";

// Bottom of the sidebar: a prompt to start a guide (customers only) and who is signed in.
export function SidebarFooter({
  email,
  admin,
  onStart,
}: Readonly<{ email: string; admin: boolean; onStart: () => void }>) {
  return (
    <div className="flex flex-col gap-4">
      {!admin && (
        <div className="flex flex-col items-start gap-2 rounded-md border border-border bg-accent-soft p-4">
          <Lightning className="size-6 text-accent" aria-hidden="true" />
          <p className="text-base font-semibold">A little practice. A lot of possibility.</p>
          <p className="text-sm text-text-muted">Build your repair skills, one simulation at a time.</p>
          <TextButton onClick={onStart}>Start a guide</TextButton>
        </div>
      )}
      <div className="flex items-center gap-4 border-t border-border pt-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-sm font-semibold text-accent">
          {email.slice(0, 2).toUpperCase()}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{email.split("@")[0]}</span>
          <span className="text-sm text-text-muted">{admin ? "Admin account" : "Customer account"}</span>
        </span>
      </div>
    </div>
  );
}
