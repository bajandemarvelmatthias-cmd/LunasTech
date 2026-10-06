import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// One bordered white surface. Never nested inside another Card.
export function Card({ className, children }: Readonly<{ className?: string; children: ReactNode }>) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface p-6", className)}>
      {children}
    </section>
  );
}
