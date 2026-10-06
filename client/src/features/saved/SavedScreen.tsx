import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadError, Loading } from "@/components/ui/Status";
import { PageHeader } from "@/components/ui/PageHeader";
import { fetchPublishedGuides } from "@/features/guides/api";
import { GuideGrid } from "@/features/guides/GuideCard";
import type { Guide } from "@/features/guides/types";
import { useLoad } from "@/lib/useLoad";
import { useSaved } from "./SavedProvider";

type Props = { onOpen: (guide: Guide) => void; onBrowse: () => void };

// The user's bookmarked guides. A guide that was unpublished since is not shown.
export function SavedScreen({ onOpen, onBrowse }: Readonly<Props>) {
  const { ids } = useSaved();
  const { data, loading, error, retry } = useLoad(fetchPublishedGuides, []);
  const saved = (data ?? []).filter((g) => ids.has(g.id));

  let body;
  if (loading) body = <Loading />;
  else if (error || !data) {
    body = <LoadError message="Can't load your saved guides. Check your connection and try again." onRetry={retry} />;
  } else if (saved.length === 0) {
    body = (
      <Card className="flex flex-col items-start gap-4">
        <p className="text-base">You haven't saved any guides yet. Tap the bookmark on a guide to keep it here.</p>
        <Button onClick={onBrowse} className="w-auto">
          Browse repair guides
        </Button>
      </Card>
    );
  } else body = <GuideGrid guides={saved} onOpen={onOpen} />;

  return (
    <>
      <PageHeader title="Saved guides" subtitle="Your collection, ready when you need it." />
      {body}
    </>
  );
}
