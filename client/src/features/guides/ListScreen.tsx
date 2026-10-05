import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { ChoiceList, type Choice } from "@/components/ui/ChoiceList";

type Props = {
  title: string;
  onBack?: () => void;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  items: Choice[] | null;
  empty: string;
  onSelect: (id: string) => void;
};

// One list step of the guide flow: loading, error, empty or the list.
export function ListScreen({
  title,
  onBack,
  loading,
  error,
  onRetry,
  items,
  empty,
  onSelect,
}: Readonly<Props>) {
  let body;
  if (loading) {
    body = <p className="text-base text-text-muted">Loading</p>;
  } else if (error || !items) {
    body = (
      <div className="flex flex-col gap-4">
        <p role="alert" className="text-sm text-danger">
          Can't load this list. Check your connection and try again.
        </p>
        <Button onClick={onRetry}>Try again</Button>
      </div>
    );
  } else if (items.length === 0) {
    body = <p className="text-base text-text-muted">{empty}</p>;
  } else {
    body = <ChoiceList items={items} onSelect={onSelect} />;
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {onBack && <BackButton onClick={onBack} />}
      <h1 className="text-lg font-semibold">{title}</h1>
      {body}
    </div>
  );
}
