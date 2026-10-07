import { Lightning } from "@phosphor-icons/react";
import { TextButton } from "@/components/ui/Button";
import { AccountMenu, type AccountMenuProps } from "@/components/ui/AccountMenu";

// Bottom of the sidebar: a prompt to start a guide (customers only) and the
// signed-in account. The account chip opens the menu (Profile, Settings,
// Home Page, Log out) upward.
export function SidebarFooter({
  admin,
  onStart,
  ...account
}: Readonly<
  Omit<AccountMenuProps, "variant"> & {
    admin: boolean;
    onStart?: () => void;
  }
>) {
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
      <div className="border-t border-border pt-4">
        <AccountMenu variant="chip" {...account} />
      </div>
    </div>
  );
}
