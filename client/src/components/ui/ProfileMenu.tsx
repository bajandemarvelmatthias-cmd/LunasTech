import { useEffect, useRef, useState } from "react";
import { SignOut } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { Avatar } from "./Avatar";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Top-right profile button (ux-ui-guidelines.md: account sits top right).
// Shows the user's picture or initials, same as the sidebar footer. Opens a small menu
// with who is signed in and the Log out action. Closes on Escape, on a click
// outside, or after choosing Log out.
export function ProfileMenu({
  email,
  role,
  avatarUrl,
}: Readonly<{ email: string; role?: string; avatarUrl?: string | null }>) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`rounded-md ${focus}`}
      >
        <Avatar email={email} url={avatarUrl} className="size-10" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-2 flex w-64 flex-col gap-2 rounded-md border border-border bg-surface p-2 shadow-card"
        >
          <div className="flex min-w-0 flex-col px-2 py-2">
            <span className="truncate text-sm font-semibold">{email.split("@")[0]}</span>
            <span className="truncate text-sm text-text-muted">{email}</span>
            {role && <span className="text-sm text-text-muted">{role}</span>}
          </div>
          <div className="border-t border-border pt-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void supabase.auth.signOut();
              }}
              className={`flex h-(--size-control) w-full items-center gap-3 rounded-md px-2 text-base font-semibold text-accent hover:bg-accent-soft ${focus}`}
            >
              <SignOut className="size-6" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
