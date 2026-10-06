import type { ReactNode } from "react";
import { Brand } from "./Brand";

// Shell for signed-out screens (login, signup, reset). A fixed header and one
// centered column. Signed-in screens use WorkspaceShell instead.
export function Shell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-(--size-header) shrink-0 items-center border-b border-border bg-surface px-4">
        <Brand />
      </header>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pt-12 md:pt-24">
        {children}
      </main>
    </div>
  );
}
