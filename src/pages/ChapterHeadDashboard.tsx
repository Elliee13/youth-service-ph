import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, ListChecks, MoreHorizontal, RefreshCw, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { CmsShell } from "../components/cms/CmsShell";
import { Button } from "../components/ui/shadcn/button";
import { Badge } from "../components/ui/shadcn/badge";
import { Card, CardContent, CardHeader } from "../components/ui/shadcn/card";
import { Input } from "../components/ui/shadcn/input";
import { Label } from "../components/ui/shadcn/label";
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
import { Textarea } from "../components/ui/shadcn/textarea";
import { useAuth } from "../auth/useAuth";
import { useGsapReveal } from "../hooks/useGsapReveal";
import { withTimeout } from "../lib/async";
import { OpportunityStatusBadge } from "../components/opportunities/OpportunityStatusBadge";
import {
  createOpportunity,
  deleteOpportunity,
  listOpportunities,
  listVolunteerSignupsByOpportunityIds,
  updateOpportunity,
  type OpportunityRow,
} from "../lib/admin.api";
import { useToast } from "../components/ui/useToast";

type PostgrestLikeError = { code?: string; message?: string };
type QueryState = "loading" | "error" | "missing_scope" | "ready";

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

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <Label className="text-xs font-semibold text-black/70">{label}</Label>
        {hint ? <div className="text-xs text-black/45">{hint}</div> : null}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function FormActionsBar({
  busy,
  primaryLabel,
  onCancel,
}: {
  busy: boolean;
  primaryLabel: string;
  onCancel?: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <Button type="submit" className="accent-glow" disabled={busy}>
        {busy ? "Saving..." : primaryLabel}
      </Button>
      {onCancel ? (
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
    </div>
  );
}

type ChapterHeadDashboardProps = {
  showOverview?: boolean;
  title?: string;
  subtitle?: string;
};

export default function ChapterHeadDashboard({
  showOverview = true,
  title = "Chapter Head Dashboard",
  subtitle = "Create and manage volunteer opportunities for your chapter only.",
}: ChapterHeadDashboardProps) {
  const scope = useRef<HTMLDivElement | null>(null);
  const aliveRef = useRef(true);
  useGsapReveal(scope);

  const { profile } = useAuth();
  const chapterId = profile?.chapter_id ?? null;

  const [opps, setOpps] = useState<OpportunityRow[]>([]);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [queryState, setQueryState] = useState<QueryState>("loading");
  const [savingOpportunity, setSavingOpportunity] = useState(false);
  const [deletingOpportunityId, setDeletingOpportunityId] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const { addToast } = useToast();

  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [sdgs, setSdgs] = useState("SDG 4, SDG 10");
  const [contact, setContact] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!chapterId) {
      if (!aliveRef.current) return;
      setOpps([]);
      setVolunteerCount(0);
      setQueryState("missing_scope");
      return;
    }

    if (aliveRef.current) setQueryState("loading");
    try {
      const scoped = await withTimeout(
        listOpportunities(chapterId),
        15000,
        "Opportunities request timed out. Please try again."
      );
      if (!aliveRef.current) return;

      setOpps(scoped);
      const signups = await withTimeout(
        listVolunteerSignupsByOpportunityIds(scoped.map((opportunity) => opportunity.id)),
        15000,
        "Volunteer signups request timed out. Please try again."
      );
      if (!aliveRef.current) return;

      setVolunteerCount(signups.length);
      setQueryState("ready");
    } catch (e: unknown) {
      if (!aliveRef.current) return;
      const msg = getErrorMessage(e, "Failed to load opportunities.");
      addToast({ type: "error", message: msg });
      setQueryState("error");
    }
  }, [addToast, chapterId]);

  useEffect(() => {
    aliveRef.current = true;
    refresh().catch(() => undefined);
    return () => {
      aliveRef.current = false;
    };
  }, [refresh]);

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
    setSavingOpportunity(true);
    try {
      if (!chapterId) {
        const msg = "Your account does not have a chapter assigned yet.";
        addToast({ type: "error", message: msg });
        return;
      }
      if (!name.trim() || !date) {
        const msg = "Event name and date are required.";
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

      if (editId) {
        await withTimeout(updateOpportunity(editId, payload), 15000, "Save timed out. Please try again.");
      } else {
        await withTimeout(
          createOpportunity({ ...payload, approval_status: "pending_approval" }),
          15000,
          "Save timed out. Please try again."
        );
      }

      if (!aliveRef.current) return;
      addToast({
        type: "success",
        message: editId ? "Opportunity updated." : "Opportunity submitted for admin approval.",
      });
      await refresh();
      if (!aliveRef.current) return;
      clearForm();
    } catch (e: unknown) {
      if (!aliveRef.current) return;
      // If RLS blocks, you'll see it here (correct behavior)
      const msg = getErrorMessage(e, "Save failed.");
      addToast({ type: "error", message: msg });
    } finally {
      if (aliveRef.current) setSavingOpportunity(false);
    }
  }

  async function runDelete(id: string) {
    setDeletingOpportunityId(id);
    try {
      await withTimeout(deleteOpportunity(id), 15000, "Delete timed out. Please try again.");
      await refresh();
      if (!aliveRef.current) return;
      if (editId === id) clearForm();
      addToast({ type: "success", message: "Opportunity deleted." });
    } catch (err: unknown) {
      if (!aliveRef.current) return;
      const msg = getErrorMessage(err, "Delete failed.");
      addToast({ type: "error", message: msg });
    } finally {
      if (aliveRef.current) {
        setDeletingOpportunityId(null);
        setPendingDeleteId(null);
      }
    }
  }

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return opps.filter((o) => o.event_date >= today).length;
  }, [opps]);

  const pendingApprovalCount = useMemo(
    () => opps.filter((o) => o.approval_status === "pending_approval").length,
    [opps]
  );

  return (
    <div ref={scope}>
      <CmsShell
        title={title}
        subtitle={subtitle}
      >
        {showOverview ? (
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">Operations Overview</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-black/60">
                <Badge variant="outline">Scoped</Badge>
                {pendingApprovalCount > 0 ? (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    {pendingApprovalCount} awaiting approval
                  </Badge>
                ) : null}
                <span>New opportunities stay pending until approved by an admin.</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  refresh().catch(() => undefined);
                }}
                disabled={queryState === "loading"}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Card className="rounded-xl border border-black/10 p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-black/65">
                <span>My Opportunities</span>
                <ListChecks className="h-4 w-4" />
              </div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">
                {queryState === "ready" ? opps.length : "—"}
              </div>
            </Card>
            <Card className="rounded-xl border border-black/10 p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-black/65">
                <span>Total Volunteers</span>
                <Users className="h-4 w-4" />
              </div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">
                {queryState === "ready" ? volunteerCount : "—"}
              </div>
            </Card>
            <Card className="rounded-xl border border-black/10 p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-black/65">
                <span>Upcoming Events</span>
                <CalendarClock className="h-4 w-4" />
              </div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">
                {queryState === "ready" ? upcomingEvents : "—"}
              </div>
            </Card>
          </div>
        </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Card className="border-black/10 bg-white p-6 sm:p-8">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                  {editId ? "Edit opportunity" : "Create opportunity"}
                </div>

              <form onSubmit={submit} className="mt-6 grid gap-4">
                <FormField label="Event name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </FormField>

                <FormField label="Date">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </FormField>

                <FormField label="SDGs impacted" hint="Comma-separated">
                  <Input value={sdgs} onChange={(e) => setSdgs(e.target.value)} />
                </FormField>

                <FormField
                  label="Contact details for sign up"
                  hint={!editId ? "New submissions require admin approval before going public" : undefined}
                >
                  <Textarea value={contact} onChange={(e) => setContact(e.target.value)} />
                </FormField>

                <FormActionsBar
                  busy={savingOpportunity}
                  primaryLabel={editId ? "Update" : "Create"}
                  onCancel={editId ? clearForm : undefined}
                />
              </form>

              {queryState === "missing_scope" ? (
                <div className="mt-6 rounded-2xl border border-black/10 bg-[rgb(var(--card))] p-4 text-sm text-black/65">
                  Your account does not have a chapter assigned yet. Ask an admin to set your chapter before loading chapter data.
                </div>
              ) : null}
            </Card>
          </div>

          <div className="lg:col-span-7 lg:sticky lg:top-24 self-start">
            <Card className="border-black/10 bg-white p-6 sm:p-8">
              <CardHeader className="p-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
                  Your chapter opportunities
                </div>
                <div className="mt-2 text-sm text-black/65">
                  {pendingApprovalCount > 0
                    ? `${pendingApprovalCount} item${pendingApprovalCount === 1 ? "" : "s"} still awaiting admin approval.`
                    : "Only items for your chapter appear here, including pending approvals."}
                </div>
              </CardHeader>
              <CardContent className="mt-6 p-0">
                {queryState === "loading" ? (
                  <div className="py-10 text-center text-sm text-black/55">Loading opportunities...</div>
                ) : null}

                {queryState === "error" ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <div>Failed to load opportunities.</div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3"
                      onClick={() => refresh().catch(() => undefined)}
                    >
                      Retry
                    </Button>
                  </div>
                ) : null}

                {queryState === "ready" ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[44%]">Event</TableHead>
                        <TableHead className="w-[20%]">Status</TableHead>
                        <TableHead className="w-[16%]">Date</TableHead>
                        <TableHead className="w-[20%] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {opps.map((o) => (
                        <TableRow
                          key={o.id}
                          className="cursor-pointer"
                          onClick={() => {
                            setEditId(o.id);
                            setName(o.event_name);
                            setDate(o.event_date);
                            setSdgs((o.sdgs ?? []).join(", "));
                            setContact(o.contact_details);
                          }}
                        >
                          <TableCell className="font-semibold">{o.event_name}</TableCell>
                          <TableCell>
                            <OpportunityStatusBadge status={o.approval_status} />
                          </TableCell>
                          <TableCell className="text-black/65 tabular-nums">{o.event_date}</TableCell>
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
                                    setEditId(o.id);
                                    setName(o.event_name);
                                    setDate(o.event_date);
                                    setSdgs((o.sdgs ?? []).join(", "));
                                    setContact(o.contact_details);
                                  }}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setPendingDeleteId(o.id);
                                  }}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {opps.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-10 text-center text-sm text-black/55">
                            No opportunities found for your chapter yet.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>

        <AlertDialog open={Boolean(pendingDeleteId)} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild onClick={() => pendingDeleteId && runDelete(pendingDeleteId)}>
                <Button type="button" variant="destructive" disabled={deletingOpportunityId === pendingDeleteId}>
                  {deletingOpportunityId === pendingDeleteId ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CmsShell>
    </div>
  );
}
