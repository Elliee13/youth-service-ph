import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { CmsShell } from "../components/cms/CmsShell";
import { DataTable } from "../components/cms/DataTable";
import { Field, Input, Textarea } from "../components/cms/Field";
import { FormActions } from "../components/cms/FormActions";
import { useGsapReveal } from "../hooks/useGsapReveal";
import {
  adminCreateChapter,
  adminCreateProgram,
  adminDeleteChapter,
  adminDeleteProgram,
  adminListChapters,
  adminListPrograms,
  adminUpdateChapter,
  adminUpdateProgram,
  createOpportunity,
  deleteOpportunity,
  getSiteSettingsRow,
  listOpportunities,
  updateOpportunity,
  updateSiteSettingsRow,
  type ChapterRow,
  type OpportunityRow,
  type ProgramRow,
  type SiteSettingsRow,
} from "../lib/admin.api";
import { uploadProgramImage } from "../lib/storage";

type Tab = "programs" | "chapters" | "opportunities" | "settings";

export default function AdminDashboard() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  const [tab, setTab] = useState<Tab>("programs");

  // Data
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [opps, setOpps] = useState<OpportunityRow[]>([]);
  const [settings, setSettings] = useState<SiteSettingsRow | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();

  // Program form
  const [pEditId, setPEditId] = useState<string | null>(null);
  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pImageUrl, setPImageUrl] = useState<string | null>(null);

  // Chapter form
  const [cEditId, setCEditId] = useState<string | null>(null);
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cLocation, setCLocation] = useState("");
  const [cContactName, setCContactName] = useState("");
  const [cContactEmail, setCContactEmail] = useState("");
  const [cContactPhone, setCContactPhone] = useState("");

  // Opportunity form
  const [oEditId, setOEditId] = useState<string | null>(null);
  const [oName, setOName] = useState("");
  const [oDate, setODate] = useState("");
  const [oChapterId, setOChapterId] = useState("");
  const [oSdgs, setOSdgs] = useState("SDG 4, SDG 10");
  const [oContact, setOContact] = useState("");

  // Settings form
  const [sProjects, setSProjects] = useState(0);
  const [sChapters, setSChapters] = useState(0);
  const [sMembers, setSMembers] = useState(0);
  const [sEmail, setSEmail] = useState("");
  const [sFacebook, setSFacebook] = useState("");
  const [sMobile, setSMobile] = useState("");

  const tabs: { key: Tab; label: string; hint: string }[] = useMemo(
    () => [
      { key: "programs", label: "Programs", hint: "Cards + images" },
      { key: "chapters", label: "Chapters", hint: "Network presence" },
      { key: "opportunities", label: "Opportunities", hint: "Volunteer listings" },
      { key: "settings", label: "Site settings", hint: "Stats + contact" },
    ],
    []
  );

  async function refreshAll() {
    setError(null);
    const [p, c, o, s] = await Promise.all([
      adminListPrograms(),
      adminListChapters(),
      listOpportunities(),
      getSiteSettingsRow(),
    ]);
    setPrograms(p);
    setChapters(c);
    setOpps(o);
    setSettings(s);

    // hydrate settings fields
    setSProjects(s.projects_count);
    setSChapters(s.chapters_count);
    setSMembers(s.members_count);
    setSEmail(s.contact_email);
    setSFacebook(s.contact_facebook);
    setSMobile(s.contact_mobile);
  }

  useEffect(() => {
    refreshAll().catch((e: any) => setError(e?.message ?? "Failed to load dashboard."));
  }, []);

  useEffect(() => {
    if (params.get("signed_in") === "1") {
      setSuccess("Signed in successfully.");
      params.delete("signed_in");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  function clearProgramForm() {
    setPEditId(null);
    setPTitle("");
    setPDesc("");
    setPImageUrl(null);
  }

  function clearChapterForm() {
    setCEditId(null);
    setCName("");
    setCDesc("");
    setCLocation("");
    setCContactName("");
    setCContactEmail("");
    setCContactPhone("");
  }

  function clearOppForm() {
    setOEditId(null);
    setOName("");
    setODate("");
    setOChapterId("");
    setOSdgs("SDG 4, SDG 10");
    setOContact("");
  }

  // ✅ Updated: requires a programId
  async function handleUploadProgramImage(file: File, programId: string) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const { publicUrl } = await uploadProgramImage(file, programId);
      setPImageUrl(publicUrl);
      setSuccess("Image uploaded.");
    } catch (e: any) {
      setError(e?.message ?? "Image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitProgram(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (!pTitle.trim() || !pDesc.trim()) {
        setError("Program title and description are required.");
        return;
      }

      if (pEditId) {
        await adminUpdateProgram(pEditId, {
          title: pTitle.trim(),
          description: pDesc.trim(),
          image_url: pImageUrl,
        });
        setSuccess("Program updated.");
      } else {
        await adminCreateProgram({
          title: pTitle.trim(),
          description: pDesc.trim(),
          image_url: pImageUrl,
        });
        setSuccess("Program created.");
      }

      await refreshAll();
      clearProgramForm();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save program.");
    } finally {
      setBusy(false);
    }
  }

  async function submitChapter(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (!cName.trim()) {
        setError("Chapter name is required.");
        return;
      }

      const payload = {
        name: cName.trim(),
        description: cDesc.trim() || null,
        location: cLocation.trim() || null,
        contact_name: cContactName.trim() || null,
        contact_email: cContactEmail.trim() || null,
        contact_phone: cContactPhone.trim() || null,
      };

      if (cEditId) {
        await adminUpdateChapter(cEditId, payload);
        setSuccess("Chapter updated.");
      } else {
        await adminCreateChapter(payload as any);
        setSuccess("Chapter created.");
      }

      await refreshAll();
      clearChapterForm();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save chapter.");
    } finally {
      setBusy(false);
    }
  }

  async function submitOpp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (!oName.trim() || !oDate || !oChapterId) {
        setError("Event name, date, and chapter are required.");
        return;
      }

      const sdgs = oSdgs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        event_name: oName.trim(),
        event_date: oDate,
        chapter_id: oChapterId,
        sdgs,
        contact_details: oContact.trim() || "Contact the chapter head to sign up.",
      };

      if (oEditId) {
        await updateOpportunity(oEditId, payload);
        setSuccess("Opportunity updated.");
      } else {
        await createOpportunity(payload);
        setSuccess("Opportunity created.");
      }

      await refreshAll();
      clearOppForm();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save opportunity.");
    } finally {
      setBusy(false);
    }
  }

  async function submitSettings(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await updateSiteSettingsRow({
        projects_count: Number(sProjects) || 0,
        chapters_count: Number(sChapters) || 0,
        members_count: Number(sMembers) || 0,
        contact_email: sEmail.trim(),
        contact_facebook: sFacebook.trim(),
        contact_mobile: sMobile.trim(),
      });

      await refreshAll();
      setSuccess("Site settings updated.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to update site settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={scope}>
      <CmsShell
        title="Admin CMS"
        subtitle="Manage public content: programs, chapters, opportunities, and global site settings."
        right={
          <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs text-black/60 backdrop-blur">
            <span className="size-1.5 rounded-full bg-[rgb(var(--accent))]" />
            RLS enforced
          </div>
        }
      >
        {/* Tabs */}
        <Card className="border-black/10 bg-white/70 p-3 backdrop-blur">
          <div className="grid gap-2 sm:grid-cols-4">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={[
                  "rounded-2xl border px-4 py-3 text-left transition",
                  tab === t.key
                    ? "border-[rgba(255,119,31,0.35)] bg-[rgba(255,119,31,0.08)]"
                    : "border-black/10 hover:bg-black/5",
                ].join(" ")}
              >
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="mt-1 text-xs text-black/55">{t.hint}</div>
              </button>
            ))}
          </div>
        </Card>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        ) : null}

        {/* Programs */}
        {tab === "programs" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Card className="border-black/10 bg-white p-6 sm:p-8">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                  {pEditId ? "Edit program" : "Create program"}
                </div>

                <form onSubmit={submitProgram} className="mt-6 grid gap-4">
                  <Field label="Title">
                    <Input value={pTitle} onChange={(e) => setPTitle(e.target.value)} />
                  </Field>

                  <Field label="Description" hint="Keep it concise but meaningful">
                    <Textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} />
                  </Field>

                  <Field label="Image" hint="Uploads to Supabase Storage">
                    <div className="grid gap-3">
                      <Input
                        value={pImageUrl ?? ""}
                        onChange={(e) => setPImageUrl(e.target.value || null)}
                        placeholder="https://..."
                      />

                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm transition hover:bg-black/5">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;

                              // ✅ Need an ID for deterministic storage path
                              if (!pEditId) {
                                setError("Create the program first, then upload an image while editing it.");
                                return;
                              }

                              handleUploadProgramImage(f, pEditId);
                            }}
                          />
                          Upload image
                          <span className="text-xs text-black/45">(jpg/png/webp)</span>
                        </label>

                        {pImageUrl ? (
                          <a
                            className="text-sm text-[rgb(var(--accent))] hover:underline"
                            href={pImageUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Preview ↗
                          </a>
                        ) : null}
                      </div>

                      {!pEditId ? (
                        <div className="text-xs text-black/50">
                          Tip: Save the program first, then upload an image while editing.
                        </div>
                      ) : null}
                    </div>
                  </Field>

                  <FormActions
                    busy={busy}
                    primaryLabel={pEditId ? "Update program" : "Create program"}
                    onCancel={pEditId ? clearProgramForm : undefined}
                  />
                </form>
              </Card>
            </div>

            <div className="lg:col-span-7">
              <DataTable title="Programs" description="Click a row to edit.">
                <div className="grid grid-cols-12 gap-3 border-b border-black/10 pb-3 text-xs font-semibold text-black/60">
                  <div className="col-span-5">Title</div>
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="divide-y divide-black/10">
                  {programs.map((p) => (
                    <div
                      key={p.id}
                      className="grid cursor-pointer grid-cols-12 gap-3 py-4 text-sm hover:bg-black/[0.02]"
                      onClick={() => {
                        setPEditId(p.id);
                        setPTitle(p.title);
                        setPDesc(p.description);
                        setPImageUrl(p.image_url);
                      }}
                    >
                      <div className="col-span-5 font-semibold">{p.title}</div>
                      <div className="col-span-5 text-black/65 line-clamp-2">{p.description}</div>
                      <div className="col-span-2 flex justify-end">
                        <button
                          className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/65 hover:bg-red/5"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setBusy(true);
                            setError(null);
                            setSuccess(null);
                            try {
                              await adminDeleteProgram(p.id);
                              await refreshAll();
                              if (pEditId === p.id) clearProgramForm();
                              setSuccess("Program deleted.");
                            } catch (err: any) {
                              setError(err?.message ?? "Delete failed.");
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
        ) : null}

        {/* Chapters */}
        {tab === "chapters" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Card className="border-black/10 bg-white p-6 sm:p-8">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                  {cEditId ? "Edit chapter" : "Create chapter"}
                </div>

                <form onSubmit={submitChapter} className="mt-6 grid gap-4">
                  <Field label="Name">
                    <Input value={cName} onChange={(e) => setCName(e.target.value)} />
                  </Field>

                  <Field label="Description">
                    <Textarea value={cDesc} onChange={(e) => setCDesc(e.target.value)} />
                  </Field>

                  <Field label="Location">
                    <Input
                      value={cLocation}
                      onChange={(e) => setCLocation(e.target.value)}
                      placeholder="e.g., Metro Manila"
                    />
                  </Field>

                  <div className="grid gap-4 rounded-3xl border border-black/10 bg-[rgb(var(--card))] p-5">
                    <div className="text-xs font-semibold text-black/70">Contact (optional)</div>
                    <Field label="Contact name">
                      <Input value={cContactName} onChange={(e) => setCContactName(e.target.value)} />
                    </Field>
                    <Field label="Contact email">
                      <Input value={cContactEmail} onChange={(e) => setCContactEmail(e.target.value)} />
                    </Field>
                    <Field label="Contact phone">
                      <Input value={cContactPhone} onChange={(e) => setCContactPhone(e.target.value)} />
                    </Field>
                  </div>

                  <FormActions
                    busy={busy}
                    primaryLabel={cEditId ? "Update chapter" : "Create chapter"}
                    onCancel={cEditId ? clearChapterForm : undefined}
                  />
                </form>
              </Card>
            </div>

            <div className="lg:col-span-7">
              <DataTable title="Chapters" description="Click a row to edit.">
                <div className="grid grid-cols-12 gap-3 border-b border-black/10 pb-3 text-xs font-semibold text-black/60">
                  <div className="col-span-4">Name</div>
                  <div className="col-span-4">Location</div>
                  <div className="col-span-2">Contact</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="divide-y divide-black/10">
                  {chapters.map((c) => (
                    <div
                      key={c.id}
                      className="grid cursor-pointer grid-cols-12 gap-3 py-4 text-sm hover:bg-black/[0.02]"
                      onClick={() => {
                        setCEditId(c.id);
                        setCName(c.name);
                        setCDesc(c.description ?? "");
                        setCLocation(c.location ?? "");
                        setCContactName(c.contact_name ?? "");
                        setCContactEmail(c.contact_email ?? "");
                        setCContactPhone(c.contact_phone ?? "");
                      }}
                    >
                      <div className="col-span-4 font-semibold">{c.name}</div>
                      <div className="col-span-4 text-black/65">{c.location ?? "—"}</div>
                      <div className="col-span-2 text-black/65">{c.contact_name ?? "—"}</div>
                      <div className="col-span-2 flex justify-end">
                        <button
                          className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/65 hover:bg-black/5"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setBusy(true);
                            setError(null);
                            setSuccess(null);
                            try {
                              await adminDeleteChapter(c.id);
                              await refreshAll();
                              if (cEditId === c.id) clearChapterForm();
                              setSuccess("Chapter deleted.");
                            } catch (err: any) {
                              setError(err?.message ?? "Delete failed.");
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
        ) : null}

        {/* Opportunities */}
        {tab === "opportunities" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Card className="border-black/10 bg-white p-6 sm:p-8">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                  {oEditId ? "Edit opportunity" : "Create opportunity"}
                </div>

                <form onSubmit={submitOpp} className="mt-6 grid gap-4">
                  <Field label="Event name">
                    <Input value={oName} onChange={(e) => setOName(e.target.value)} />
                  </Field>

                  <Field label="Date">
                    <Input type="date" value={oDate} onChange={(e) => setODate(e.target.value)} />
                  </Field>

                  <Field label="YSP Chapter">
                    <select
                      value={oChapterId}
                      onChange={(e) => setOChapterId(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                    >
                      <option value="">Select chapter…</option>
                      {chapters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="SDGs impacted" hint="Comma-separated">
                    <Input value={oSdgs} onChange={(e) => setOSdgs(e.target.value)} />
                  </Field>

                  <Field label="Chapter head contact details for sign up">
                    <Textarea value={oContact} onChange={(e) => setOContact(e.target.value)} />
                  </Field>

                  <FormActions
                    busy={busy}
                    primaryLabel={oEditId ? "Update opportunity" : "Create opportunity"}
                    onCancel={oEditId ? clearOppForm : undefined}
                  />
                </form>
              </Card>
            </div>

            <div className="lg:col-span-7">
              <DataTable title="Opportunities" description="Click a row to edit.">
                <div className="grid grid-cols-12 gap-3 border-b border-black/10 pb-3 text-xs font-semibold text-black/60">
                  <div className="col-span-4">Event</div>
                  <div className="col-span-3">Date</div>
                  <div className="col-span-3">Chapter</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="divide-y divide-black/10">
                  {opps.map((o) => (
                    <div
                      key={o.id}
                      className="grid cursor-pointer grid-cols-12 gap-3 py-4 text-sm hover:bg-black/[0.02]"
                      onClick={() => {
                        setOEditId(o.id);
                        setOName(o.event_name);
                        setODate(o.event_date);
                        setOChapterId(o.chapter_id);
                        setOSdgs((o.sdgs ?? []).join(", "));
                        setOContact(o.contact_details);
                      }}
                    >
                      <div className="col-span-4 font-semibold">{o.event_name}</div>
                      <div className="col-span-3 text-black/65 tabular-nums">{o.event_date}</div>
                      <div className="col-span-3 text-black/65">
                        {chapters.find((c) => c.id === o.chapter_id)?.name ?? "—"}
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <button
                          className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/65 hover:bg-black/5"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setBusy(true);
                            setError(null);
                            setSuccess(null);
                            try {
                              await deleteOpportunity(o.id);
                              await refreshAll();
                              if (oEditId === o.id) clearOppForm();
                              setSuccess("Opportunity deleted.");
                            } catch (err: any) {
                              setError(err?.message ?? "Delete failed.");
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
        ) : null}

        {/* Settings */}
        {tab === "settings" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Card className="border-black/10 bg-white p-6 sm:p-8">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                  Global site settings
                </div>

                <form onSubmit={submitSettings} className="mt-6 grid gap-5">
                  <div className="grid gap-4 rounded-3xl border border-black/10 bg-[rgb(var(--card))] p-5 sm:grid-cols-3">
                    <Field label="Projects">
                      <Input
                        type="number"
                        value={sProjects}
                        onChange={(e) => setSProjects(Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Chapters">
                      <Input
                        type="number"
                        value={sChapters}
                        onChange={(e) => setSChapters(Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Members">
                      <Input
                        type="number"
                        value={sMembers}
                        onChange={(e) => setSMembers(Number(e.target.value))}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 rounded-3xl border border-black/10 bg-white p-5">
                    <Field label="Contact email">
                      <Input value={sEmail} onChange={(e) => setSEmail(e.target.value)} />
                    </Field>
                    <Field label="Facebook link">
                      <Input value={sFacebook} onChange={(e) => setSFacebook(e.target.value)} />
                    </Field>
                    <Field label="Mobile number">
                      <Input value={sMobile} onChange={(e) => setSMobile(e.target.value)} />
                    </Field>
                  </div>

                  <FormActions busy={busy} primaryLabel="Update settings" />
                </form>
              </Card>
            </div>

            <div className="lg:col-span-5">
              <Card className="border-black/10 bg-[rgb(var(--card))] p-6 sm:p-8">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                  Current values
                </div>
                <div className="mt-6 grid gap-3 text-sm text-black/65">
                  <div className="flex justify-between">
                    <span>Projects</span>
                    <span className="font-semibold tabular-nums">{settings?.projects_count ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chapters</span>
                    <span className="font-semibold tabular-nums">{settings?.chapters_count ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Members</span>
                    <span className="font-semibold tabular-nums">{settings?.members_count ?? 0}</span>
                  </div>
                  <div className="mt-2 h-px bg-black/10" />
                  <div className="flex justify-between">
                    <span>Email</span>
                    <span className="font-semibold">{settings?.contact_email ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Facebook</span>
                    <span className="font-semibold">Link</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mobile</span>
                    <span className="font-semibold">{settings?.contact_mobile ?? "—"}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </CmsShell>
    </div>
  );
}
