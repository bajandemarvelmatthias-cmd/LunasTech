import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

// Google sign-in puts the Google account picture in the user's metadata
// (avatar_url, or picture on some versions). Email sign-ups have none.
export function avatarUrlOf(user: User | null | undefined): string | null {
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const url = meta?.avatar_url ?? meta?.picture;
  return typeof url === "string" && url.startsWith("https://") ? url : null;
}

// The user's picture when there is one, otherwise the first letter of their
// name. If the picture cannot load, the letter shows instead. Always a circle.
// Size comes from `className`.
export function Avatar({
  name,
  url,
  className,
}: Readonly<{ name: string; url?: string | null; className?: string }>) {
  const [failed, setFailed] = useState(false);
  const base =
    "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-sm font-semibold text-accent";
  if (url && !failed) {
    return (
      <img
        src={url}
        alt=""
        // Google's image host can refuse requests that carry a referrer.
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn(base, "object-cover", className)}
      />
    );
  }
  return <span className={cn(base, className)}>{name.trim().charAt(0).toUpperCase()}</span>;
}
