import { Lightning, SignOut } from "@phosphor-icons/react";
import { TextButton } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Bottom of the sidebar: a prompt to start a guide (customers only), who is
// signed in (picture or initials), and Log out.
export function SidebarFooter({
  email,
  avatarUrl,
  admin,
  onStart,
  onLogout,
}: Readonly<{
  email: string;
  avatarUrl?: string | null;
  admin: boolean;
  onStart?: () => void;
  onLogout: () => void;
}>) {
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
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex items-center gap-4">
          <Avatar email={email} url={avatarUrl} className="size-10" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">{email.split("@")[0]}</span>
            <span className="text-sm text-text-muted">{admin ? "Admin account" : "Customer account"}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className={`flex h-12 w-full items-center gap-3 rounded-md px-4 text-base font-semibold text-text-muted hover:text-text ${focus}`}
        >
          <SignOut className="size-6" aria-hidden="true" />
          Log out
        </button>
      </div>
    </div>
  );
}
