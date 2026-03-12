import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, CalendarClock, FolderKanban, MoreHorizontal, Plus, RefreshCw, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { CmsShell } from "../components/cms/CmsShell";
import { DataTable } from "../components/cms/DataTable";
import { Field, Input, Textarea } from "../components/cms/Field";
import { FormActions } from "../components/cms/FormActions";
import { Button } from "../components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/shadcn/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/shadcn/table";
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
import { withTimeout } from "../lib/async";
import { uploadProgramImage } from "../lib/storage";
import { useToast } from "../components/ui/useToast";

type Tab = "programs" | "chapters" | "opportunities" | "settings";
type PostgrestLikeError = { code?: string; message?: string };
type QueryState = "loading" | "error" | "ready";
type AdminDashboardProps = {
  forcedTab?: Tab;
  showOverview?: boolean;
  showTabs?: boolean;
  title?: string;
  subtitle?: string;
};

function isPostgrestLikeError(error: unknown): error is PostgrestLikeError {
  if (!error || typeof error !== "object") return false;
  if (!("message" in error)) return false;
  const maybe = error as { message?: unknown; code?: unknown };
  const messageOk = typeof maybe.message === "string";
  const codeOk = maybe.code == null || typeof maybe.code === "string";
  return messageOk && codeOk;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isPostgrestLikeError(error) && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function AdminDashboard({
  forcedTab,
  showOverview = true,
  showTabs = true,
  title = "Admin CMS",
  subtitle = "Manage public content: programs, chapters, opportunities, and global site settings.",
}: AdminDashboardProps) {
  const scope = useRef<HTMLDivElement | null>(null);
  const aliveRef = useRef(true);
  useGsapReveal(scope);

  const [tab, setTab] = useState<Tab>(forcedTab ?? "programs");

  // Data
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [opps, setOpps] = useState<OpportunityRow[]>([]);
  const [settings, setSettings] = useState<SiteSettingsRow | null>(null);

  const [queryState, setQueryState] = useState<QueryState>("loading");
  const [uploadingProgramImage, setUploadingProgramImage] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
  const [savingChapter, setSavingChapter] = useState(false);
  const [savingOpportunity, setSavingOpportunity] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);
  const [deletingOpportunityId, setDeletingOpportunityId] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const { addToast } = useToast();

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

  const upcomingCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return opps.filter((o) => o.event_date >= today).length;
  }, [opps]);

  const hasLoadedDashboardData =
    programs.length > 0 || chapters.length > 0 || opps.length > 0 || settings !== null;
  const shouldRenderDashboard = queryState === "ready" || hasLoadedDashboardData;

  const refreshAll = useCallback(async () => {
    if (aliveRef.current) setQueryState("loading");
    if (import.meta.env.DEV) {
      console.warn("[AdminDashboard] refresh start.");
    }

    const sections = await Promise.allSettled([
      withTimeout(adminListPrograms(), 15000, "Programs request timed out. Please try again."),
      withTimeout(adminListChapters(), 15000, "Chapters request timed out. Please try again."),
      withTimeout(listOpportunities(), 15000, "Opportunities request timed out. Please try again."),
      withTimeout(getSiteSettingsRow(), 15000, "Settings request timed out. Please try again."),
    ]);

    if (!aliveRef.current) return;

    const [programsResult, chaptersResult, opportunitiesResult, settingsResult] = sections;
    const failures: string[] = [];
    let successCount = 0;

    if (programsResult.status === "fulfilled") {
      setPrograms(programsResult.value);
      successCount += 1;
    } else {
      failures.push(getErrorMessage(programsResult.reason, "Failed to load programs."));
    }

    if (chaptersResult.status === "fulfilled") {
      setChapters(chaptersResult.value);
      successCount += 1;
    } else {
      failures.push(getErrorMessage(chaptersResult.reason, "Failed to load chapters."));
    }

    if (opportunitiesResult.status === "fulfilled") {
      setOpps(opportunitiesResult.value);
      successCount += 1;
    } else {
      failures.push(getErrorMessage(opportunitiesResult.reason, "Failed to load opportunities."));
    }

    if (settingsResult.status === "fulfilled") {
      const nextSettings = settingsResult.value;
      setSettings(nextSettings);
      setSProjects(nextSettings.projects_count);
      setSChapters(nextSettings.chapters_count);
      setSMembers(nextSettings.members_count);
      setSEmail(nextSettings.contact_email);
      setSFacebook(nextSettings.contact_facebook);
      setSMobile(nextSettings.contact_mobile);
      successCount += 1;
    } else {
      failures.push(getErrorMessage(settingsResult.reason, "Failed to load site settings."));
    }

    if (failures.length > 0) {
      addToast({ type: "error", message: failures[0] });
    }

    const nextQueryState: QueryState = successCount > 0 ? "ready" : "error";
    if (import.meta.env.DEV) {
      console.warn("[AdminDashboard] refresh settled.", {
        programs:
          programsResult.status === "fulfilled"
            ? `success:${programsResult.value.length}`
            : getErrorMessage(programsResult.reason, "Failed to load programs."),
        chapters:
          chaptersResult.status === "fulfilled"
            ? `success:${chaptersResult.value.length}`
            : getErrorMessage(chaptersResult.reason, "Failed to load chapters."),
        opportunities:
          opportunitiesResult.status === "fulfilled"
            ? `success:${opportunitiesResult.value.length}`
            : getErrorMessage(opportunitiesResult.reason, "Failed to load opportunities."),
        settings:
          settingsResult.status === "fulfilled"
            ? "success"
            : getErrorMessage(settingsResult.reason, "Failed to load site settings."),
        successCount,
        finalQueryState: nextQueryState,
      });
    }
    setQueryState(nextQueryState);
  }, [addToast]);

  useEffect(() => {
    aliveRef.current = true;
    refreshAll().catch(() => undefined);
    return () => {
      if (import.meta.env.DEV) {
        console.warn("[AdminDashboard] effect aborted/unmounted.");
      }
      aliveRef.current = false;
    };
  }, [refreshAll]);

  useEffect(() => {
    if (params.get("signed_in") === "1") {
      addToast({ type: "success", message: "Signed in successfully." });
      params.delete("signed_in");
      setParams(params, { replace: true });
    }
  }, [params, setParams, addToast]);

  useEffect(() => {
    if (forcedTab) {
      setTab(forcedTab);
      return;
    }

    const nextTab = params.get("tab");
    if (
      nextTab === "programs" ||
      nextTab === "chapters" ||
      nextTab === "opportunities" ||
      nextTab === "settings"
    ) {
      setTab(nextTab);
    }
  }, [forcedTab, params]);

  function setActiveTab(nextTab: Tab) {
    setTab(nextTab);

    if (forcedTab) return;

    const nextParams = new URLSearchParams(params);
    nextParams.set("tab", nextTab);
    setParams(nextParams, { replace: true });
  }

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
    setUploadingProgramImage(true);
    try {
      const { publicUrl } = await withTimeout(
        uploadProgramImage(file, programId),
        15000,
        "Image upload timed out. Please try again."
      );
      if (!aliveRef.current) return;
      setPImageUrl(publicUrl);
      addToast({ type: "success", message: "Image uploaded." });
    } catch (e: unknown) {
      if (!aliveRef.current) return;
      const msg = getErrorMessage(e, "Image upload failed.");
      addToast({ type: "error", message: msg });
    } finally {
      if (aliveRef.current) setUploadingProgramImage(false);
    }
  }

  async function submitProgram(e: React.FormEvent) {
    e.preventDefault();
    setSavingProgram(true);
    try {
      if (!pTitle.trim() || !pDesc.trim()) {
        addToast({ type: "error", message: "Program title and description are required." });
        return;
      }

      if (pEditId) {
        await withTimeout(
          adminUpdateProgram(pEditId, {
            title: pTitle.trim(),
            description: pDesc.trim(),
            image_url: pImageUrl,
          }),
          15000,
          "Program save timed out. Please try again."
        );
        addToast({ type: "success", message: "Program updated." });
      } else {
        await withTimeout(
          adminCreateProgram({
            title: pTitle.trim(),
            description: pDesc.trim(),
            image_url: pImageUrl,
          }),
          15000,
          "Program save timed out. Please try again."
        );
        addToast({ type: "success", message: "Program created." });
      }

      await refreshAll();
      if (!aliveRef.current) return;
      clearProgramForm();
    } catch (e: unknown) {
      if (!aliveRef.current) return;
      const msg = getErrorMessage(e, "Failed to save program.");
      addToast({ type: "error", message: msg });
    } finally {
      if (aliveRef.current) setSavingProgram(false);
    }
  }

  async function submitChapter(e: React.FormEvent) {
    e.preventDefault();
    setSavingChapter(true);
    try {
      if (!cName.trim()) {
        addToast({ type: "error", message: "Chapter name is required." });
        return;
      }

      const payload: Omit<ChapterRow, "id" | "created_at"> = {
        name: cName.trim(),
        description: cDesc.trim() || null,
        location: cLocation.trim() || null,
        contact_name: cContactName.trim() || null,
        contact_email: cContactEmail.trim() || null,
        contact_phone: cContactPhone.trim() || null,
      };

      if (cEditId) {
        await withTimeout(
          adminUpdateChapter(cEditId, payload),
          15000,
          "Chapter save timed out. Please try again."
        );
        addToast({ type: "success", message: "Chapter updated." });
      } else {
        await withTimeout(adminCreateChapter(payload), 15000, "Chapter save timed out. Please try again.");
        addToast({ type: "success", message: "Chapter created." });
      }

      await refreshAll();
      if (!aliveRef.current) return;
      clearChapterForm();
    } catch (e: unknown) {
      if (!aliveRef.current) return;
      const msg = getErrorMessage(e, "Failed to save chapter.");
      addToast({ type: "error", message: msg });
    } finally {
      if (aliveRef.current) setSavingChapter(false);
    }
  }

  async function submitOpp(e: React.FormEvent) {
    e.preventDefault();
    setSavingOpportunity(true);
    try {
      if (!oName.trim() || !oDate || !oChapterId) {
        addToast({ type: "error", message: "Event name, date, and chapter are required." });
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
        await withTimeout(
          updateOpportunity(oEditId, payload),
          15000,
          "Opportunity save timed out. Please try again."
        );
        addToast({ type: "success", message: "Opportunity updated." });
      } else {
        await withTimeout(createOpportunity(payload), 15000, "Opportunity save timed out. Please try again.");
        addToast({ type: "success", message: "Opportunity created." });
      }

      await refreshAll();
      if (!aliveRef.current) return;
      clearOppForm();
    } catch (e: unknown) {
      if (!aliveRef.current) return;
      const msg = getErrorMessage(e, "Failed to save opportunity.");
      addToast({ type: "error", message: msg });
    } finally {
      if (aliveRef.current) setSavingOpportunity(false);
    }
  }

  async function submitSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await withTimeout(
        updateSiteSettingsRow({
          projects_count: Number(sProjects) || 0,
          chapters_count: Number(sChapters) || 0,
          members_count: Number(sMembers) || 0,
          contact_email: sEmail.trim(),
          contact_facebook: sFacebook.trim(),
          contact_mobile: sMobile.trim(),
        }),
        15000,
        "Settings save timed out. Please try again."
      );

      await refreshAll();
      if (!aliveRef.current) return;
      addToast({ type: "success", message: "Site settings updated." });
    } catch (e: unknown) {
      if (!aliveRef.current) return;
      const msg = getErrorMessage(e, "Failed to update site settings.");
      addToast({ type: "error", message: msg });
    } finally {
      if (aliveRef.current) setSavingSettings(false);
    }
  }

  return (
    <div ref={scope}>
      <CmsShell
        title={title}
        subtitle={subtitle}

      >
        {queryState === "loading" && !hasLoadedDashboardData ? (
          <Card className="border-black/10 bg-white p-6 text-sm text-black/55">
            Loading dashboard...
          </Card>
        ) : null}

        {queryState === "error" && !hasLoadedDashboardData ? (
          <Card className="border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <div>Failed to load dashboard.</div>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => refreshAll().catch(() => undefined)}
            >
              Retry
            </Button>
          </Card>
        ) : null}

        {shouldRenderDashboard && showOverview ? (
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm mb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">Workspace Overview</div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => setActiveTab("opportunities")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Opportunity
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => refreshAll().catch(() => undefined)}
                disabled={queryState === "loading"}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-xl border border-black/10 p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-black/65">
                <span>Total Programs</span>
                <FolderKanban className="h-4 w-4" />
              </div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">{programs.length}</div>
            </Card>
            <Card className="rounded-xl border border-black/10 p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-black/65">
                <span>Total Chapters</span>
                <Building2 className="h-4 w-4" />
              </div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">{chapters.length}</div>
            </Card>
            <Card className="rounded-xl border border-black/10 p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-black/65">
                <span>Total Volunteers</span>
                <Users className="h-4 w-4" />
              </div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">{settings?.members_count ?? 0}</div>
            </Card>
            <Card className="rounded-xl border border-black/10 p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-black/65">
                <span>Upcoming Opportunities</span>
                <CalendarClock className="h-4 w-4" />
              </div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">{upcomingCount}</div>
            </Card>
          </div>
        </div>
        ) : null}

        {/* Tabs */}
        {shouldRenderDashboard && showTabs ? (
        <Card className="border-black/10 bg-white/70 p-3 backdrop-blur">
          <div className="grid gap-2 sm:grid-cols-4">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
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
        ) : null}


        {/* Programs */}
        {shouldRenderDashboard && tab === "programs" ? (
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
                            disabled={uploadingProgramImage}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;

                              // ✅ Need an ID for deterministic storage path
                              if (!pEditId) {
                                addToast({
                                  type: "error",
                                  message: "Create the program first, then upload an image while editing it.",
                                });
                                return;
                              }

                              handleUploadProgramImage(f, pEditId);
                            }}
                          />
                          {uploadingProgramImage ? "Uploading..." : "Upload image"}
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
                    busy={savingProgram}
                    primaryLabel={pEditId ? "Update program" : "Create program"}
                    onCancel={pEditId ? clearProgramForm : undefined}
                  />
                </form>
              </Card>
            </div>

            <div className="lg:col-span-7">
              <DataTable title="Programs" description="Click a row to edit.">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Title</TableHead>
                      <TableHead className="w-[45%]">Description</TableHead>
                      <TableHead className="w-[15%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map((p) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setPEditId(p.id);
                          setPTitle(p.title);
                          setPDesc(p.description);
                          setPImageUrl(p.image_url);
                        }}
                      >
                        <TableCell className="font-semibold">{p.title}</TableCell>
                        <TableCell className="text-black/65 line-clamp-2">{p.description}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setPEditId(p.id);
                                  setPTitle(p.title);
                                  setPDesc(p.description);
                                  setPImageUrl(p.image_url);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onSelect={async (e) => {
                                  e.preventDefault();
                                  setDeletingProgramId(p.id);
                                  try {
                                    await withTimeout(
                                      adminDeleteProgram(p.id),
                                      15000,
                                      "Delete timed out. Please try again."
                                    );
                                    await refreshAll();
                                    if (!aliveRef.current) return;
                                    if (pEditId === p.id) clearProgramForm();
                                    addToast({ type: "success", message: "Program deleted." });
                                  } catch (err: unknown) {
                                    if (!aliveRef.current) return;
                                    const msg = getErrorMessage(err, "Delete failed.");
                                    addToast({ type: "error", message: msg });
                                  } finally {
                                    if (aliveRef.current) setDeletingProgramId(null);
                                  }
                                }}
                              >
                                {deletingProgramId === p.id ? "Deleting..." : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DataTable>
            </div>
          </div>
        ) : null}

        {/* Chapters */}
        {shouldRenderDashboard && tab === "chapters" ? (
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
                    busy={savingChapter}
                    primaryLabel={cEditId ? "Update chapter" : "Create chapter"}
                    onCancel={cEditId ? clearChapterForm : undefined}
                  />
                </form>
              </Card>
            </div>

            <div className="lg:col-span-7">
              <DataTable title="Chapters" description="Click a row to edit.">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[32%]">Name</TableHead>
                      <TableHead className="w-[32%]">Location</TableHead>
                      <TableHead className="w-[20%]">Contact</TableHead>
                      <TableHead className="w-[16%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chapters.map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer"
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
                        <TableCell className="font-semibold">{c.name}</TableCell>
                        <TableCell className="text-black/65">{c.location ?? "-"}</TableCell>
                        <TableCell className="text-black/65">{c.contact_name ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setCEditId(c.id);
                                  setCName(c.name);
                                  setCDesc(c.description ?? "");
                                  setCLocation(c.location ?? "");
                                  setCContactName(c.contact_name ?? "");
                                  setCContactEmail(c.contact_email ?? "");
                                  setCContactPhone(c.contact_phone ?? "");
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onSelect={async (e) => {
                                  e.preventDefault();
                                  setDeletingChapterId(c.id);
                                  try {
                                    await withTimeout(
                                      adminDeleteChapter(c.id),
                                      15000,
                                      "Delete timed out. Please try again."
                                    );
                                    await refreshAll();
                                    if (!aliveRef.current) return;
                                    if (cEditId === c.id) clearChapterForm();
                                    addToast({ type: "success", message: "Chapter deleted." });
                                  } catch (err: unknown) {
                                    if (!aliveRef.current) return;
                                    const msg = getErrorMessage(err, "Delete failed.");
                                    addToast({ type: "error", message: msg });
                                  } finally {
                                    if (aliveRef.current) setDeletingChapterId(null);
                                  }
                                }}
                              >
                                {deletingChapterId === c.id ? "Deleting..." : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DataTable>
            </div>
          </div>
        ) : null}

        {/* Opportunities */}
        {shouldRenderDashboard && tab === "opportunities" ? (
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
                    busy={savingOpportunity}
                    primaryLabel={oEditId ? "Update opportunity" : "Create opportunity"}
                    onCancel={oEditId ? clearOppForm : undefined}
                  />
                </form>
              </Card>
            </div>

            <div className="lg:col-span-7">
              <DataTable title="Opportunities" description="Click a row to edit.">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[34%]">Event</TableHead>
                      <TableHead className="w-[24%]">Date</TableHead>
                      <TableHead className="w-[26%]">Chapter</TableHead>
                      <TableHead className="w-[16%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opps.map((o) => (
                      <TableRow
                        key={o.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setOEditId(o.id);
                          setOName(o.event_name);
                          setODate(o.event_date);
                          setOChapterId(o.chapter_id);
                          setOSdgs((o.sdgs ?? []).join(", "));
                          setOContact(o.contact_details);
                        }}
                      >
                        <TableCell className="font-semibold">{o.event_name}</TableCell>
                        <TableCell className="text-black/65 tabular-nums">{o.event_date}</TableCell>
                        <TableCell className="text-black/65">
                          {chapters.find((c) => c.id === o.chapter_id)?.name ?? "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setOEditId(o.id);
                                  setOName(o.event_name);
                                  setODate(o.event_date);
                                  setOChapterId(o.chapter_id);
                                  setOSdgs((o.sdgs ?? []).join(", "));
                                  setOContact(o.contact_details);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onSelect={async (e) => {
                                  e.preventDefault();
                                  setDeletingOpportunityId(o.id);
                                  try {
                                    await withTimeout(
                                      deleteOpportunity(o.id),
                                      15000,
                                      "Delete timed out. Please try again."
                                    );
                                    await refreshAll();
                                    if (!aliveRef.current) return;
                                    if (oEditId === o.id) clearOppForm();
                                    addToast({ type: "success", message: "Opportunity deleted." });
                                  } catch (err: unknown) {
                                    if (!aliveRef.current) return;
                                    const msg = getErrorMessage(err, "Delete failed.");
                                    addToast({ type: "error", message: msg });
                                  } finally {
                                    if (aliveRef.current) setDeletingOpportunityId(null);
                                  }
                                }}
                              >
                                {deletingOpportunityId === o.id ? "Deleting..." : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DataTable>
            </div>
          </div>
        ) : null}

        {/* Settings */}
        {shouldRenderDashboard && tab === "settings" ? (
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

                  <FormActions busy={savingSettings} primaryLabel="Update settings" />
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
