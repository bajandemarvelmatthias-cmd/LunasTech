import type { ReactNode } from "react";

// Layout shell. Header size and position are fixed (--size-header) and never
// change between screens. Only the content area changes.
// `account` is the top-right slot (log out, later profile).
export function Shell({
  account,
  children,
}: Readonly<{
  account?: ReactNode;
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-(--size-header) shrink-0 items-center justify-between border-b border-border px-4">
        <span className="text-base font-semibold">LunasTech</span>
        {account}
      </header>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pt-12 md:pt-24">
        {children}
      </main>
    </div>
  );
}
