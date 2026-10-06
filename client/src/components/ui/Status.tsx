import { Button } from "./Button";

export function Loading() {
  return <p className="text-base text-text-muted">Loading</p>;
}

// One fixed error message with a retry action, same as the other screens.
export function LoadError({ message, onRetry }: Readonly<{ message: string; onRetry: () => void }>) {
  return (
    <div className="flex flex-col items-start gap-4">
      <p role="alert" className="text-sm text-danger">
        {message}
      </p>
      <Button onClick={onRetry} className="w-auto">
        Try again
      </Button>
    </div>
  );
}
