import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({
  message,
  code,
  onRetry,
}: {
  message: string;
  code?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <AlertTriangle size={32} strokeWidth={1.5} className="text-down" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-fg">{message}</p>
        {code && <p className="mt-1 font-mono text-xs text-fg-subtle">{code}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          ลองใหม่
        </Button>
      )}
    </div>
  );
}
