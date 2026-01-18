import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CmsShell } from "../components/cms/CmsShell";
import { Card } from "../components/ui/Card";
import { DataTable } from "../components/cms/DataTable";
import { Field, Input, Textarea } from "../components/cms/Field";
import { FormActions } from "../components/cms/FormActions";
import { useAuth } from "../auth/AuthProvider";
import { useGsapReveal } from "../hooks/useGsapReveal";
import {
  createOpportunity,
  deleteOpportunity,
  listOpportunities,
  updateOpportunity,
  type OpportunityRow,
} from "../lib/admin.api";
import { useToast } from "../components/ui/ToastProvider";

export default function ChapterHeadDashboard() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  const { profile } = useAuth();
  const chapterId = profile?.chapter_id ?? null;

  const [opps, setOpps] = useState<OpportunityRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const { addToast } = useToast();

  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [sdgs, setSdgs] = useState("SDG 4, SDG 10");
  const [contact, setContact] = useState("");

  const scopedOpps = useMemo(() => {
    if (!chapterId) return [];
    return opps.filter((o) => o.chapter_id === chapterId);
  }, [opps, chapterId]);

  async function refresh() {
    setError(null);
    const all = await listOpportunities();
    setOpps(all);
  }

  useEffect(() => {
    refresh().catch((e: any) => {
      const msg = e?.message ?? "Failed to load opportunities.";
      setError(msg);
      addToast({ type: "error", message: msg });
    });
  }, [addToast]);

  useEffect(() => {
    if (params.get("signed_in") === "1") {
      addToast({ type: "success", message: "Signed in successfully." });
      params.delete("signed_in");
      setParams(params, { replace: true });
    }
  }, [params, setParams, addToast]);

  function clearForm() {
    setEditId(null);
    setName("");
    setDate("");
    setSdgs("SDG 4, SDG 10");
    setContact("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!chapterId) {
        const msg = "Your account does not have a chapter assigned yet.";
        setError(msg);
        addToast({ type: "error", message: msg });
        return;
      }
      if (!name.trim() || !date) {
        const msg = "Event name and date are required.";
        setError(msg);
        addToast({ type: "error", message: msg });
        return;
      }

      const sdgArr = sdgs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        event_name: name.trim(),
        event_date: date,
        chapter_id: chapterId,
        sdgs: sdgArr,
        contact_details: contact.trim() || "Contact the chapter head to sign up.",
      };

      if (editId) await updateOpportunity(editId, payload);
      else await createOpportunity(payload);

      addToast({
        type: "success",
        message: editId ? "Opportunity updated." : "Opportunity created.",
      });
      await refresh();
      clearForm();
    } catch (e: any) {
      // If RLS blocks, you’ll see it here (correct behavior)
      const msg = e?.message ?? "Save failed.";
      setError(msg);
      addToast({ type: "error", message: msg });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={scope}>
      <CmsShell
        title="Chapter Head Dashboard"
        subtitle="Create and manage volunteer opportunities for your chapter only."
      >

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Card className="border-black/10 bg-white p-6 sm:p-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                {editId ? "Edit opportunity" : "Create opportunity"}
              </div>

              <form onSubmit={submit} className="mt-6 grid gap-4">
                <Field label="Event name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>

                <Field label="Date">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>

                <Field label="SDGs impacted" hint="Comma-separated">
                  <Input value={sdgs} onChange={(e) => setSdgs(e.target.value)} />
                </Field>

                <Field label="Contact details for sign up">
                  <Textarea value={contact} onChange={(e) => setContact(e.target.value)} />
                </Field>

                <FormActions
                  busy={busy}
                  primaryLabel={editId ? "Update" : "Create"}
                  onCancel={editId ? clearForm : undefined}
                />
              </form>

              {!chapterId ? (
                <div className="mt-6 rounded-2xl border border-black/10 bg-[rgb(var(--card))] p-4 text-sm text-black/65">
                  Your profile has no chapter assigned. Ask the admin to set your <span className="font-semibold">chapter_id</span>.
                </div>
              ) : null}
            </Card>
          </div>

          <div className="lg:col-span-7">
            <DataTable title="Your chapter opportunities" description="Only items for your chapter appear here.">
              <div className="grid grid-cols-12 gap-3 border-b border-black/10 pb-3 text-xs font-semibold text-black/60">
                <div className="col-span-6">Event</div>
                <div className="col-span-3">Date</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>

              <div className="divide-y divide-black/10">
                {scopedOpps.map((o) => (
                  <div
                    key={o.id}
                    className="grid cursor-pointer grid-cols-12 gap-3 py-4 text-sm hover:bg-black/[0.02]"
                    onClick={() => {
                      setEditId(o.id);
                      setName(o.event_name);
                      setDate(o.event_date);
                      setSdgs((o.sdgs ?? []).join(", "));
                      setContact(o.contact_details);
                    }}
                  >
                    <div className="col-span-6 font-semibold">{o.event_name}</div>
                    <div className="col-span-3 text-black/65 tabular-nums">{o.event_date}</div>
                    <div className="col-span-3 flex justify-end">
                      <button
                        className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/65 hover:bg-black/5"
                        onClick={async (e) => {
                          e.stopPropagation();
                          setBusy(true);
                          setError(null);
                          try {
                            await deleteOpportunity(o.id);
                            await refresh();
                            if (editId === o.id) clearForm();
                            addToast({ type: "success", message: "Opportunity deleted." });
                          } catch (err: any) {
                            const msg = err?.message ?? "Delete failed.";
                            setError(msg);
                            addToast({ type: "error", message: msg });
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </DataTable>
          </div>
        </div>
      </CmsShell>
    </div>
  );
}
