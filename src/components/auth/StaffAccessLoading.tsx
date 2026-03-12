import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/shadcn/card";

export function StaffAccessLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center py-10">
      <Card className="w-full max-w-xl rounded-2xl border-black/10 bg-white/90 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3 text-[rgb(var(--accent))]">
            <div className="rounded-xl bg-[rgba(255,119,31,0.10)] p-2">
              <Loader2 className="size-5 animate-spin" />
            </div>
            <CardTitle className="text-xl tracking-[-0.02em]">
              Checking your staff access
            </CardTitle>
          </div>
          <CardDescription className="max-w-lg text-sm leading-6 text-black/65">
            Verifying your account permissions and loading your dashboard access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black/55">
            This usually takes a moment after sign-in or refresh.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
