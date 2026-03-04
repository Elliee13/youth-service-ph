import { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Field, Input, Textarea } from "../cms/Field";
import { getMyPublicUser, type VolunteerSignupInput } from "../../lib/public.api";
import { useToast } from "../ui/useToast";

type Props = {
  opportunityId: string;
  opportunityName: string;
  opportunityDate: string;
  chapterName: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

type ErrorWithCodeAndMessage = {
  code?: string;
  message?: string;
};

function getErrorDetails(error: unknown) {
  if (error && typeof error === "object") {
    const maybe = error as ErrorWithCodeAndMessage;
    return {
      code: typeof maybe.code === "string" ? maybe.code : "",
      message: typeof maybe.message === "string" ? maybe.message : "",
    };
  }
  return { code: "", message: "" };
}

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
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
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

    try {
      if (website.trim()) {
        addToast({ type: "error", message: "Failed to sign up. Please try again." });
        return;
      }

      const normalizedFullName = fullName.trim();
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPhone = phone.trim();
      const trimmedMessage = message.trim();

      if (trimmedMessage.length > 1000) {
        addToast({ type: "error", message: "Message must be 1000 characters or less." });
        return;
      }

      if (!normalizedFullName || !normalizedEmail || !normalizedPhone) {
        const msg = "Please fill in all required fields.";
        addToast({ type: "error", message: msg });
        return;
      }

      const input: VolunteerSignupInput = {
        opportunity_id: opportunityId,
        full_name: normalizedFullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        message: trimmedMessage || undefined,
      };

      const { signUpForOpportunity } = await import("../../lib/public.api");
      await signUpForOpportunity(input);

      onSuccess();
      onClose();
    } catch (e: unknown) {
      const { code, message: raw } = getErrorDetails(e);
      const msg =
        code === "23505" || raw.toLowerCase().includes("unique_signup")
        ? "Already applied for this opportunity."
        : raw || "Failed to sign up. Please try again.";
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
          <input
            id="website"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden opacity-0"
          />

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
