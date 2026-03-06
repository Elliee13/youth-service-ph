import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/shadcn/dialog";
import { Button } from "../ui/Button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

export function AuthRequiredDialog({
  open,
  onOpenChange,
  title = "Create an account to continue",
  description = "Create a volunteer account or sign in first before opening forms or signing up for opportunities.",
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-black/10 bg-white">
        <DialogHeader>
          <DialogTitle className="[font-family:var(--font-display)] text-2xl tracking-[-0.02em]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-black/65">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex-col gap-3 sm:flex-row sm:justify-end">
          <Link to="/register#create-account" onClick={() => onOpenChange(false)}>
            <Button className="accent-glow w-full sm:w-auto">Create account</Button>
          </Link>
          <Link to="/register#sign-in" onClick={() => onOpenChange(false)}>
            <Button variant="secondary" className="w-full sm:w-auto">
              I already have an account
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
