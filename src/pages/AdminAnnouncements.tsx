import { useState } from "react";
import { CmsShell } from "../components/cms/CmsShell";
import { Card } from "../components/ui/Card";
import { Field, Input, Textarea } from "../components/cms/Field";
import { FormActions } from "../components/cms/FormActions";
import { useToast } from "../components/ui/useToast";
import { withTimeout } from "../lib/async";
import { createAnnouncement, type AnnouncementAudience } from "../lib/notifications.api";

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export default function AdminAnnouncements() {
  const { addToast } = useToast();
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementAudience, setAnnouncementAudience] = useState<AnnouncementAudience>("both");
  const [announcementLink, setAnnouncementLink] = useState("");

  async function submitAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setSendingAnnouncement(true);
    try {
      const normalizedTitle = announcementTitle.trim();
      const normalizedMessage = announcementMessage.trim();
      const normalizedLink = announcementLink.trim();

      if (!normalizedTitle || !normalizedMessage) {
        throw new Error("Announcement title and message are required.");
      }

      if (normalizedLink && !isValidHttpUrl(normalizedLink)) {
        throw new Error("Announcement link must be a valid http or https URL.");
      }

      await withTimeout(
        createAnnouncement({
          title: normalizedTitle,
          message: normalizedMessage,
          audience: announcementAudience,
          link: normalizedLink || undefined,
        }),
        15000,
        "Announcement send timed out. Please try again."
      );

      setAnnouncementTitle("");
      setAnnouncementMessage("");
      setAnnouncementAudience("both");
      setAnnouncementLink("");
      addToast({ type: "success", message: "Announcement sent to the selected audience." });
    } catch (error: unknown) {
      addToast({
        type: "error",
        message: getErrorMessage(error, "Failed to send announcement."),
      });
    } finally {
      setSendingAnnouncement(false);
    }
  }

  return (
    <CmsShell
      title="Announcements"
      subtitle="Send targeted in-app announcements to members, chapter heads, or both."
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card className="border-black/10 bg-white p-6 sm:p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              Make announcement
            </div>

            <form onSubmit={submitAnnouncement} className="mt-6 grid gap-4">
              <Field label="Audience">
                <select
                  value={announcementAudience}
                  onChange={(e) => setAnnouncementAudience(e.target.value as AnnouncementAudience)}
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                >
                  <option value="member">Members only</option>
                  <option value="chapter_head">Chapter heads only</option>
                  <option value="both">Members and chapter heads</option>
                </select>
              </Field>

              <Field label="Title">
                <Input
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="Platform update"
                />
              </Field>

              <Field label="Message">
                <Textarea
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Share the update users should see in their notification center."
                />
              </Field>

              <Field label="Link" hint="Optional">
                <Input
                  value={announcementLink}
                  onChange={(e) => setAnnouncementLink(e.target.value)}
                  placeholder="https://example.com/details"
                />
              </Field>

              <FormActions busy={sendingAnnouncement} primaryLabel="Send announcement" />
            </form>
          </Card>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24 self-start">
          <Card className="border-black/10 bg-[rgb(var(--card))] p-6 sm:p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              Delivery notes
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-black/65">
              <p>Announcements are delivered into each recipient&apos;s notification center.</p>
              <p>Use links only when the destination is appropriate for the selected audience.</p>
              <p>Members and chapter heads receive separate audience-targeted announcement types.</p>
            </div>
          </Card>
        </div>
      </div>
    </CmsShell>
  );
}
