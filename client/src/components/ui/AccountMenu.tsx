import { useEffect, useRef, useState, type ReactNode } from "react";
import { CaretUpDown, Gear, House, SignOut, User } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export type AccountMenuProps = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  // Each item shows only when its handler is given (the error screen has none).
  onProfile?: () => void;
  onSettings?: () => void;
  onHome?: () => void;
  // "chip": picture, name and a chevron, in the sidebar; the menu opens upward.
  // "avatar": the picture alone, in the phone header; the menu opens downward.
  variant: "chip" | "avatar";
};

function Item({
  icon: Glyph,
  onClick,
  children,
}: Readonly<{ icon: Icon; onClick: () => void; children: ReactNode }>) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex h-(--size-control) w-full items-center gap-3 rounded-md px-3 text-base font-semibold text-text hover:bg-accent-soft ${focus}`}
    >
      <Glyph className="size-6 shrink-0" aria-hidden="true" />
      {children}
    </button>
  );
}

// Account menu: Profile, Settings, Home Page, then Log out. Closes on Escape,
// on a click outside, or after choosing an item.
export function AccountMenu({
  name,
  email,
  avatarUrl,
  onProfile,
  onSettings,
  onHome,
  variant,
}: Readonly<AccountMenuProps>) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(action?: () => void) {
    setOpen(false);
    action?.();
  }

  const chip = variant === "chip";
  const hasPages = onProfile || onSettings || onHome;

  return (
    <div ref={box} className="relative">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={chip ? undefined : "Account"}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          chip
            ? "flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-surface-secondary"
            : "rounded-full",
          focus,
        )}
      >
        <Avatar name={name} url={avatarUrl} className="size-10" />
        {chip && (
          <>
            <span className="min-w-0 flex-1 truncate text-base font-semibold">{name}</span>
            <CaretUpDown className="size-6 shrink-0 text-text-muted" aria-hidden="true" />
          </>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-20 flex flex-col gap-1 rounded-md border border-border bg-surface p-2 shadow-card",
            chip ? "bottom-full left-0 mb-2 w-full" : "top-full right-0 mt-2 w-64",
          )}
        >
          {!chip && (
            <div className="flex min-w-0 flex-col border-b border-border px-3 pb-2">
              <span className="truncate text-sm font-semibold">{name}</span>
              <span className="truncate text-sm text-text-muted">{email}</span>
            </div>
          )}
          {onProfile && (
            <Item icon={User} onClick={() => choose(onProfile)}>
              Profile
            </Item>
          )}
          {onSettings && (
            <Item icon={Gear} onClick={() => choose(onSettings)}>
              Settings
            </Item>
          )}
          {onHome && (
            <Item icon={House} onClick={() => choose(onHome)}>
              Home Page
            </Item>
          )}
          <div className={cn(hasPages && "border-t border-border pt-1")}>
            <Item icon={SignOut} onClick={() => choose(() => void supabase.auth.signOut())}>
              Log out
            </Item>
          </div>
        </div>
      )}
    </div>
  );
}
