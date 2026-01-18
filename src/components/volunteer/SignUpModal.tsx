import { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Field, Input, Textarea } from "../cms/Field";
import { getMyPublicUser, type VolunteerSignupInput } from "../../lib/public.api";
import { useToast } from "../ui/ToastProvider";

type Props = {
  opportunityId: string;
  opportunityName: string;
  opportunityDate: string;
  chapterName: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function SignUpModal({
  opportunityId,
  opportunityName,
  opportunityDate,
  chapterName,
  onClose,
  onSuccess,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = await getMyPublicUser();
        if (!alive || !user) return;

        setFullName((prev) => (prev.trim() ? prev : user.full_name ?? ""));
        setEmail((prev) => (prev.trim() ? prev : user.email ?? ""));
        setPhone((prev) => (prev.trim() ? prev : user.phone ?? ""));
      } catch {
        if (!alive) return;
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (!fullName.trim() || !email.trim() || !phone.trim()) {
        const msg = "Please fill in all required fields.";
        setError(msg);
        addToast({ type: "error", message: msg });
        return;
      }

      const input: VolunteerSignupInput = {
        opportunity_id: opportunityId,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim() || undefined,
      };

      const { signUpForOpportunity } = await import("../../lib/public.api");
      await signUpForOpportunity(input);

      onSuccess();
      onClose();
    } catch (e: any) {
      const raw = e?.message ?? "";
      const msg = raw.includes("unique_signup")
        ? "Already applied for this opportunity."
        : raw || "Failed to sign up. Please try again.";
      setError(msg);
      addToast({ type: "error", message: msg });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/3 backdrop-blur-sm rounded-2xl"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-lg border-black/10 bg-white p-6 sm:p-8">
        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
            Sign Up
          </div>
          <h2 className="mt-3 [font-family:var(--font-display)] text-2xl tracking-[-0.02em]">
            {opportunityName}
          </h2>
          <div className="mt-2 text-sm text-black/60">
            {chapterName && <span className="font-medium">{chapterName}</span>}
            {chapterName && <span className="mx-2 text-black/25">•</span>}
            <span className="tabular-nums">{opportunityDate}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Full Name" hint="Required">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </Field>

          <Field label="Email" hint="Required">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </Field>

          <Field label="Phone Number" hint="Required">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09123456789"
              required
            />
          </Field>

          <Field label="Message" hint="Optional">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any additional information or questions..."
              rows={4}
            />
          </Field>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="submit" className="accent-glow" disabled={busy}>
              {busy ? "Submitting..." : "Sign Up"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
