import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, CalendarClock, FolderKanban, MoreHorizontal, RefreshCw, Users } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/shadcn/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/shadcn/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/shadcn/table";
import { OpportunityStatusBadge } from "../components/opportunities/OpportunityStatusBadge";
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

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatApprovalTimestamp(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
  const [pendingDeleteProgramId, setPendingDeleteProgramId] = useState<string | null>(null);
  const [pendingDeleteChapterId, setPendingDeleteChapterId] = useState<string | null>(null);
  const [pendingDeleteOpportunityId, setPendingDeleteOpportunityId] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const { addToast } = useToast();
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [opportunityDialogOpen, setOpportunityDialogOpen] = useState(false);
  const [countersDialogOpen, setCountersDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [formUrlsDialogOpen, setFormUrlsDialogOpen] = useState(false);

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
  const [approvingOpportunityId, setApprovingOpportunityId] = useState<string | null>(null);
  const [pendingApproveId, setPendingApproveId] = useState<string | null>(null);

  // Settings form
  const [sProjects, setSProjects] = useState(0);
  const [sChapters, setSChapters] = useState(0);
  const [sMembers, setSMembers] = useState(0);
  const [sEmail, setSEmail] = useState("");
  const [sFacebook, setSFacebook] = useState("");
  const [sMobile, setSMobile] = useState("");
  const [sMembershipFormUrl, setSMembershipFormUrl] = useState("");
  const [sChapterProposalFormUrl, setSChapterProposalFormUrl] = useState("");

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

  const pendingApprovalCount = useMemo(
    () => opps.filter((o) => o.approval_status === "pending_approval").length,
    [opps]
  );

  const adminOpportunityRows = useMemo(() => {
    return [...opps].sort((a, b) => {
      if (a.approval_status !== b.approval_status) {
        return a.approval_status === "pending_approval" ? -1 : 1;
      }
      return a.event_date.localeCompare(b.event_date);
    });
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
      setSMembershipFormUrl(nextSettings.membership_form_url ?? "");
      setSChapterProposalFormUrl(nextSettings.chapter_proposal_form_url ?? "");
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

  async function runApproveOpportunity(id: string) {
    setApprovingOpportunityId(id);
    try {
      await withTimeout(
        updateOpportunity(id, { approval_status: "approved" }),
        15000,
        "Approval timed out. Please try again."
      );
      await refreshAll();
      if (!aliveRef.current) return;
      addToast({
        type: "success",
        message: "Opportunity approved and now visible publicly.",
      });
    } catch (err: unknown) {
      if (!aliveRef.current) return;
      const msg = getErrorMessage(err, "Approval failed.");
      addToast({ type: "error", message: msg });
    } finally {
      if (aliveRef.current) {
        setApprovingOpportunityId(null);
        setPendingApproveId(null);
      }
    }
  }

  async function runDeleteProgram(id: string) {
    setDeletingProgramId(id);
    try {
      await withTimeout(adminDeleteProgram(id), 15000, "Delete timed out. Please try again.");
      await refreshAll();
      if (!aliveRef.current) return;
      if (pEditId === id) clearProgramForm();
      addToast({ type: "success", message: "Program deleted." });
    } catch (err: unknown) {
      if (!aliveRef.current) return;
      const msg = getErrorMessage(err, "Delete failed.");
      addToast({ type: "error", message: msg });
    } finally {
      if (aliveRef.current) {
        setDeletingProgramId(null);
        setPendingDeleteProgramId(null);
      }
    }
  }

  async function runDeleteChapter(id: string) {
    setDeletingChapterId(id);
    try {
      await withTimeout(adminDeleteChapter(id), 15000, "Delete timed out. Please try again.");
      await refreshAll();
      if (!aliveRef.current) return;
      if (cEditId === id) clearChapterForm();
      addToast({ type: "success", message: "Chapter deleted." });
    } catch (err: unknown) {
      if (!aliveRef.current) return;
      const msg = getErrorMessage(err, "Delete failed.");
      addToast({ type: "error", message: msg });
    } finally {
      if (aliveRef.current) {
        setDeletingChapterId(null);
        setPendingDeleteChapterId(null);
      }
    }
  }

  async function runDeleteOpportunity(id: string) {
    setDeletingOpportunityId(id);
    try {
      await withTimeout(deleteOpportunity(id), 15000, "Delete timed out. Please try again.");
      await refreshAll();
      if (!aliveRef.current) return;
      if (oEditId === id) clearOppForm();
      addToast({ type: "success", message: "Opportunity deleted." });
    } catch (err: unknown) {
      if (!aliveRef.current) return;
      const msg = getErrorMessage(err, "Delete failed.");
      addToast({ type: "error", message: msg });
    } finally {
      if (aliveRef.current) {
        setDeletingOpportunityId(null);
        setPendingDeleteOpportunityId(null);
      }
    }
  }

  // âœ… Updated: requires a programId
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
      setProgramDialogOpen(false);
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
      setChapterDialogOpen(false);
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
        approval_status: "approved" as const,
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
      setOpportunityDialogOpen(false);
    } catch (e: unknown) {
      if (!aliveRef.current) return;
      const msg = getErrorMessage(e, "Failed to save opportunity.");
      addToast({ type: "error", message: msg });
    } finally {
      if (aliveRef.current) setSavingOpportunity(false);
    }
  }


  async function saveSettingsPatch(
    input: Partial<Omit<SiteSettingsRow, "id" | "updated_at">>,
    successMessage: string,
    onSuccess?: () => void
  ) {
    setSavingSettings(true);
    try {
      await withTimeout(
        updateSiteSettingsRow(input),
        15000,
        "Settings save timed out. Please try again."
      );

      await refreshAll();
      if (!aliveRef.current) return;
      onSuccess?.();
      addToast({ type: "success", message: successMessage });
    } catch (e: unknown) {
      if (!aliveRef.current) return;
      const msg = getErrorMessage(e, "Failed to update site settings.");
      addToast({ type: "error", message: msg });
    } finally {
      if (aliveRef.current) setSavingSettings(false);
    }
  }

  function openCountersDialog() {
    if (settings) {
      setSProjects(settings.projects_count);
      setSChapters(settings.chapters_count);
      setSMembers(settings.members_count);
    }
    setCountersDialogOpen(true);
  }

  function openContactDialog() {
    if (settings) {
      setSEmail(settings.contact_email);
      setSFacebook(settings.contact_facebook);
      setSMobile(settings.contact_mobile);
    }
    setContactDialogOpen(true);
  }

  function openFormUrlsDialog() {
    if (settings) {
      setSMembershipFormUrl(settings.membership_form_url ?? "");
      setSChapterProposalFormUrl(settings.chapter_proposal_form_url ?? "");
    }
    setFormUrlsDialogOpen(true);
  }

  async function submitCountersSettings(e: React.FormEvent) {
    e.preventDefault();
    await saveSettingsPatch(
      {
        projects_count: Number(sProjects) || 0,
        chapters_count: Number(sChapters) || 0,
        members_count: Number(sMembers) || 0,
      },
      "Homepage counters updated.",
      () => setCountersDialogOpen(false)
    );
  }

  async function submitContactSettings(e: React.FormEvent) {
    e.preventDefault();
    await saveSettingsPatch(
      {
        contact_email: sEmail.trim(),
        contact_facebook: sFacebook.trim(),
        contact_mobile: sMobile.trim(),
      },
      "Contact details updated.",
      () => setContactDialogOpen(false)
    );
  }

  async function submitFormUrlSettings(e: React.FormEvent) {
    e.preventDefault();
    const normalizedMembershipFormUrl = sMembershipFormUrl.trim();
    const normalizedChapterProposalFormUrl = sChapterProposalFormUrl.trim();

    if (normalizedMembershipFormUrl && !isValidHttpUrl(normalizedMembershipFormUrl)) {
      addToast({ type: "error", message: "Membership form URL must be a valid http or https link." });
      return;
    }

    if (normalizedChapterProposalFormUrl && !isValidHttpUrl(normalizedChapterProposalFormUrl)) {
      addToast({ type: "error", message: "Chapter proposal form URL must be a valid http or https link." });
      return;
    }

    await saveSettingsPatch(
      {
        membership_form_url: normalizedMembershipFormUrl || null,
        chapter_proposal_form_url: normalizedChapterProposalFormUrl || null,
      },
      "Form URLs updated.",
      () => setFormUrlsDialogOpen(false)
    );
  }

  function openCreateProgramDialog() {
    clearProgramForm();
    setProgramDialogOpen(true);
  }

  function openEditProgramDialog(program: ProgramRow) {
    setPEditId(program.id);
    setPTitle(program.title);
    setPDesc(program.description);
    setPImageUrl(program.image_url);
    setProgramDialogOpen(true);
  }

  function handleProgramDialogChange(open: boolean) {
    setProgramDialogOpen(open);
    if (!open && !savingProgram && !uploadingProgramImage) {
      clearProgramForm();
    }
  }

  function openCreateChapterDialog() {
    clearChapterForm();
    setChapterDialogOpen(true);
  }

  function openEditChapterDialog(chapter: ChapterRow) {
    setCEditId(chapter.id);
    setCName(chapter.name);
    setCDesc(chapter.description ?? "");
    setCLocation(chapter.location ?? "");
    setCContactName(chapter.contact_name ?? "");
    setCContactEmail(chapter.contact_email ?? "");
    setCContactPhone(chapter.contact_phone ?? "");
    setChapterDialogOpen(true);
  }

  function handleChapterDialogChange(open: boolean) {
    setChapterDialogOpen(open);
    if (!open && !savingChapter) {
      clearChapterForm();
    }
  }

  function openCreateOpportunityDialog() {
    clearOppForm();
    setOpportunityDialogOpen(true);
  }

  function openEditOpportunityDialog(opportunity: OpportunityRow) {
    setOEditId(opportunity.id);
    setOName(opportunity.event_name);
    setODate(opportunity.event_date);
    setOChapterId(opportunity.chapter_id);
    setOSdgs((opportunity.sdgs ?? []).join(", "));
    setOContact(opportunity.contact_details);
    setOpportunityDialogOpen(true);
  }

  function handleOpportunityDialogChange(open: boolean) {
    setOpportunityDialogOpen(open);
    if (!open && !savingOpportunity) {
      clearOppForm();
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
        {/* Programs */}
        {shouldRenderDashboard && tab === "programs" ? (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-end">
              <Button type="button" onClick={openCreateProgramDialog}>
                Create program
              </Button>
            </div>

            <DataTable title="Programs" description="Manage your program list here, then open a form only when you need to create or edit one.">
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
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold">{p.title}</TableCell>
                      <TableCell className="text-black/65 line-clamp-2">{p.description}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                openEditProgramDialog(p);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onSelect={(e) => {
                                e.preventDefault();
                                setPendingDeleteProgramId(p.id);
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
        ) : null}

        {/* Chapters */}
        {shouldRenderDashboard && tab === "chapters" ? (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-end">
              <Button type="button" onClick={openCreateChapterDialog}>
                Create chapter
              </Button>
            </div>

            <DataTable title="Chapters" description="Review the chapter roster here, then open a form when you need to create or update one.">
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
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold">{c.name}</TableCell>
                      <TableCell className="text-black/65">{c.location ?? "-"}</TableCell>
                      <TableCell className="text-black/65">{c.contact_name ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                openEditChapterDialog(c);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onSelect={(e) => {
                                e.preventDefault();
                                setPendingDeleteChapterId(c.id);
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
        ) : null}

        {/* Opportunities */}
        {shouldRenderDashboard && tab === "opportunities" ? (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-end">
              <Button type="button" onClick={openCreateOpportunityDialog}>
                Create Opportunity
              </Button>
            </div>

            <DataTable
              title="Opportunities"
              description={
                pendingApprovalCount > 0
                  ? `${pendingApprovalCount} pending approval. Pending items are listed first for faster review.`
                  : "Review, edit, approve, and remove opportunities from the table workspace."
              }
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[26%]">Event</TableHead>
                    <TableHead className="w-[21%]">Status</TableHead>
                    <TableHead className="w-[16%]">Submitted by</TableHead>
                    <TableHead className="w-[12%]">Date</TableHead>
                    <TableHead className="w-[15%]">Chapter</TableHead>
                    <TableHead className="w-[20%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminOpportunityRows.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-semibold">{o.event_name}</TableCell>
                      <TableCell>
                        <OpportunityStatusBadge status={o.approval_status} />
                        <div className="mt-1 text-xs text-black/50">
                          {o.approval_status === "approved"
                            ? formatApprovalTimestamp(o.approved_at)
                              ? `Approved ${formatApprovalTimestamp(o.approved_at)}`
                              : "Approved before tracking"
                            : "Awaiting admin review"}
                        </div>
                      </TableCell>
                      <TableCell className="text-black/65">
                        {o.created_by_label?.trim() || "Legacy staff entry"}
                      </TableCell>
                      <TableCell className="text-black/65 tabular-nums">{o.event_date}</TableCell>
                      <TableCell className="text-black/65">
                        {chapters.find((c) => c.id === o.chapter_id)?.name ?? "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                openEditOpportunityDialog(o);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            {o.approval_status === "pending_approval" ? (
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setPendingApproveId(o.id);
                                }}
                              >
                                {approvingOpportunityId === o.id ? "Approving..." : "Approve"}
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onSelect={(e) => {
                                e.preventDefault();
                                setPendingDeleteOpportunityId(o.id);
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
        ) : null}


        {/* Settings */}
        {shouldRenderDashboard && tab === "settings" ? (
          <div className="mt-8">
            <Card className="border-black/10 bg-[rgb(var(--card))] p-6 sm:p-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                Current values
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                <div className="rounded-3xl border border-black/10 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-black">Homepage counters</div>
                      <div className="mt-1 text-xs text-black/55">Public headline metrics</div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={openCountersDialog}>
                      Edit
                    </Button>
                  </div>
                  <div className="mt-5 grid gap-3 text-sm text-black/65">
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
                  </div>
                </div>

                <div className="rounded-3xl border border-black/10 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-black">Contact details</div>
                      <div className="mt-1 text-xs text-black/55">Public contact points</div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={openContactDialog}>
                      Edit
                    </Button>
                  </div>
                  <div className="mt-5 grid gap-3 text-sm text-black/65">
                    <div className="flex justify-between gap-4">
                      <span>Email</span>
                      <span className="font-semibold break-all text-right">{settings?.contact_email ?? "—"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Facebook</span>
                      <span className="font-semibold text-right">{settings?.contact_facebook ? "Configured" : "—"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Mobile</span>
                      <span className="font-semibold text-right">{settings?.contact_mobile ?? "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-black/10 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-black">Form URLs</div>
                      <div className="mt-1 text-xs text-black/55">Membership and chapter applications</div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={openFormUrlsDialog}>
                      Edit
                    </Button>
                  </div>
                  <div className="mt-5 grid gap-3 text-sm text-black/65">
                    <div className="flex justify-between gap-4">
                      <span>Membership form</span>
                      <span className="font-semibold text-right">{settings?.membership_form_url ? "Configured" : "—"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Chapter proposal form</span>
                      <span className="font-semibold text-right">
                        {settings?.chapter_proposal_form_url ? "Configured" : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        <Dialog open={countersDialogOpen} onOpenChange={setCountersDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-black/10 bg-white p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle>Edit homepage counters</DialogTitle>
              <DialogDescription>Update the public metrics shown across the site.</DialogDescription>
            </DialogHeader>

            <form onSubmit={submitCountersSettings} className="mt-2 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Projects">
                  <Input type="number" value={sProjects} onChange={(e) => setSProjects(Number(e.target.value))} />
                </Field>
                <Field label="Chapters">
                  <Input type="number" value={sChapters} onChange={(e) => setSChapters(Number(e.target.value))} />
                </Field>
                <Field label="Members">
                  <Input type="number" value={sMembers} onChange={(e) => setSMembers(Number(e.target.value))} />
                </Field>
              </div>

              <FormActions
                busy={savingSettings}
                primaryLabel="Update counters"
                onCancel={() => setCountersDialogOpen(false)}
              />
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-black/10 bg-white p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle>Edit contact details</DialogTitle>
              <DialogDescription>Update the public contact information shown across the site.</DialogDescription>
            </DialogHeader>

            <form onSubmit={submitContactSettings} className="mt-2 grid gap-4">
              <Field label="Contact email">
                <Input value={sEmail} onChange={(e) => setSEmail(e.target.value)} />
              </Field>
              <Field label="Facebook link">
                <Input value={sFacebook} onChange={(e) => setSFacebook(e.target.value)} />
              </Field>
              <Field label="Mobile number">
                <Input value={sMobile} onChange={(e) => setSMobile(e.target.value)} />
              </Field>

              <FormActions
                busy={savingSettings}
                primaryLabel="Update contact details"
                onCancel={() => setContactDialogOpen(false)}
              />
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={formUrlsDialogOpen} onOpenChange={setFormUrlsDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-black/10 bg-white p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle>Edit form URLs</DialogTitle>
              <DialogDescription>Update the application form destinations used on the public site.</DialogDescription>
            </DialogHeader>

            <form onSubmit={submitFormUrlSettings} className="mt-2 grid gap-4">
              <Field label="Membership form URL" hint="Google Form">
                <Input
                  value={sMembershipFormUrl}
                  onChange={(e) => setSMembershipFormUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/..."
                />
              </Field>
              <Field label="Chapter proposal form URL" hint="Google Form">
                <Input
                  value={sChapterProposalFormUrl}
                  onChange={(e) => setSChapterProposalFormUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/..."
                />
              </Field>

              <FormActions
                busy={savingSettings}
                primaryLabel="Update form URLs"
                onCancel={() => setFormUrlsDialogOpen(false)}
              />
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={programDialogOpen} onOpenChange={handleProgramDialogChange}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-black/10 bg-white p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle>{pEditId ? "Edit program" : "Create program"}</DialogTitle>
              <DialogDescription>
                {pEditId
                  ? "Update the selected program details and image."
                  : "Add a new program to the public experience."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submitProgram} className="mt-2 grid gap-4">
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
                        Preview
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
                onCancel={() => handleProgramDialogChange(false)}
              />
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={opportunityDialogOpen} onOpenChange={handleOpportunityDialogChange}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-black/10 bg-white p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle>{oEditId ? "Edit opportunity" : "Create opportunity"}</DialogTitle>
              <DialogDescription>
                {oEditId
                  ? "Update the selected opportunity details."
                  : "Add a new opportunity to the volunteer listings."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submitOpp} className="mt-2 grid gap-4">
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
                  <option value="">Select chapter</option>
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

              <Field
                label="Chapter head contact details for sign up"
                hint={!oEditId ? "Admin-created opportunities are published immediately" : undefined}
              >
                <Textarea value={oContact} onChange={(e) => setOContact(e.target.value)} />
              </Field>

              <FormActions
                busy={savingOpportunity}
                primaryLabel={oEditId ? "Update opportunity" : "Create opportunity"}
                onCancel={() => handleOpportunityDialogChange(false)}
              />
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={chapterDialogOpen} onOpenChange={handleChapterDialogChange}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-black/10 bg-white p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle>{cEditId ? "Edit chapter" : "Create chapter"}</DialogTitle>
              <DialogDescription>
                {cEditId
                  ? "Update chapter details, location, and contact information."
                  : "Add a new chapter to expand Youth Service Philippines locally."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submitChapter} className="mt-2 grid gap-4">
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
                onCancel={() => handleChapterDialogChange(false)}
              />
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={Boolean(pendingApproveId)} onOpenChange={(open) => !open && setPendingApproveId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve this opportunity?</AlertDialogTitle>
              <AlertDialogDescription>
                This will make the opportunity visible on the public volunteer opportunities page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild onClick={() => pendingApproveId && runApproveOpportunity(pendingApproveId)}>
                <Button type="button" disabled={approvingOpportunityId === pendingApproveId}>
                  {approvingOpportunityId === pendingApproveId ? "Approving..." : "Approve"}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={Boolean(pendingDeleteProgramId)}
          onOpenChange={(open) => !open && setPendingDeleteProgramId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this program?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the program from the public site and admin workspace.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild onClick={() => pendingDeleteProgramId && runDeleteProgram(pendingDeleteProgramId)}>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deletingProgramId === pendingDeleteProgramId}
                >
                  {deletingProgramId === pendingDeleteProgramId ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={Boolean(pendingDeleteChapterId)}
          onOpenChange={(open) => !open && setPendingDeleteChapterId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this chapter?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the chapter record from the admin workspace and public listings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild onClick={() => pendingDeleteChapterId && runDeleteChapter(pendingDeleteChapterId)}>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deletingChapterId === pendingDeleteChapterId}
                >
                  {deletingChapterId === pendingDeleteChapterId ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={Boolean(pendingDeleteOpportunityId)}
          onOpenChange={(open) => !open && setPendingDeleteOpportunityId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this opportunity?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the opportunity from staff views and the public site if it is already approved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild onClick={() => pendingDeleteOpportunityId && runDeleteOpportunity(pendingDeleteOpportunityId)}>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deletingOpportunityId === pendingDeleteOpportunityId}
                >
                  {deletingOpportunityId === pendingDeleteOpportunityId ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CmsShell>
    </div>
  );
}

