import { Button } from "../ui/Button";

export function FormActions({
  busy,
  onCancel,
  primaryLabel = "Save",
}: {
  busy?: boolean;
  onCancel?: () => void;
  primaryLabel?: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
      {onCancel ? (
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
      <Button type="submit" className="accent-glow" disabled={busy}>
        {busy ? "Saving…" : primaryLabel}
      </Button>
    </div>
  );
}
