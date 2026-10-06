import { useState } from "react";
import { Wrench } from "@phosphor-icons/react";
import { guideImageUrl } from "@/lib/guideImages";
import { cn } from "@/lib/utils";

type Props = {
  path: string | null | undefined;
  // Without a photo: show a neutral tile (true) or nothing (false).
  placeholder?: boolean;
  className?: string;
};

// A guide photo that fills its box. The photo is decoration beside the title,
// so it has no alt text. A photo that fails to load falls back to the tile.
export function GuideImage({ path, placeholder = false, className }: Readonly<Props>) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(path) && !failed;

  if (!showPhoto && !placeholder) return null;
  return (
    <span
      className={cn("flex items-center justify-center overflow-hidden bg-surface-secondary", className)}
    >
      {showPhoto && path ? (
        <img
          src={guideImageUrl(path)}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <Wrench className="size-6 text-text-muted" aria-hidden="true" />
      )}
    </span>
  );
}
