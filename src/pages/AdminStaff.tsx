import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card } from "../components/ui/Card";
import { CmsShell } from "../components/cms/CmsShell";
import { DataTable } from "../components/cms/DataTable";
import { Field, Input } from "../components/cms/Field";
import { FormActions } from "../components/cms/FormActions";
import { Button } from "../components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/shadcn/dialog";
import {
  adminListChapters,
  createChapterHeadUser,
  listChapterHeadUsers,
  updateChapterHeadAssignment,
  type ChapterHeadStaffRow,
  type ChapterRow,
} from "../lib/admin.api";
import { withTimeout } from "../lib/async";
import { useToast } from "../components/ui/useToast";

type QueryState = "loading" | "error" | "ready";

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function AdminStaff() {
  const aliveRef = useRef(true);
  const [queryState, setQueryState] = useState<QueryState>("loading");
  const [users, setUsers] = useState<ChapterHeadStaffRow[]>([]);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [savingNewUser, setSavingNewUser] = useState(false);
  const [savingAssignmentId, setSavingAssignmentId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newChapterId, setNewChapterId] = useState("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState("");
  const { addToast } = useToast();

  const chapterOptions = useMemo(
    () => chapters.map((chapter) => ({ value: chapter.id, label: chapter.name })),
    [chapters]
  );

  const refresh = useCallback(async () => {
    if (aliveRef.current) setQueryState("loading");

    const results = await Promise.allSettled([
      withTimeout(listChapterHeadUsers(), 15000, "Chapter head request timed out. Please try again."),
      withTimeout(adminListChapters(), 15000, "Chapter request timed out. Please try again."),
    ]);

    if (!aliveRef.current) return;

    const [usersResult, chaptersResult] = results;
    const errors: string[] = [];
    let successCount = 0;

    if (usersResult.status === "fulfilled") {
      setUsers(usersResult.value);
      successCount += 1;
    } else {
      errors.push(getErrorMessage(usersResult.reason, "Failed to load chapter head users."));
    }

    if (chaptersResult.status === "fulfilled") {
      setChapters(chaptersResult.value);
      successCount += 1;
    } else {
      errors.push(getErrorMessage(chaptersResult.reason, "Failed to load chapters."));
    }

    if (errors.length > 0) {
      addToast({ type: "error", message: errors[0] });
    }

    setQueryState(successCount === 2 ? "ready" : "error");
  }, [addToast]);

  useEffect(() => {
    aliveRef.current = true;
    refresh().catch(() => undefined);
    return () => {
      aliveRef.current = false;
    };
  }, [refresh]);

  function clearCreateForm() {
    setEmail("");
    setPassword("");
    setNewChapterId("");
  }

  function clearEditForm() {
    setEditingProfileId(null);
    setEditingChapterId("");
  }

  function openCreateDialog() {
    clearCreateForm();
    setCreateDialogOpen(true);
  }

  function openEditDialog(user: ChapterHeadStaffRow) {
    setEditingProfileId(user.id);
    setEditingChapterId(user.chapter_id ?? "");
    setEditDialogOpen(true);
  }

  async function handleCreateChapterHead(e: React.FormEvent) {
    e.preventDefault();
    setSavingNewUser(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail || !password.trim() || !newChapterId) {
        addToast({ type: "error", message: "Email, temporary password, and chapter are required." });
        return;
      }

      if (!isValidEmail(normalizedEmail)) {
        addToast({ type: "error", message: "Please provide a valid email address." });
        return;
      }

      if (password.trim().length < 8) {
        addToast({ type: "error", message: "Temporary password must be at least 8 characters." });
        return;
      }

      await withTimeout(
        createChapterHeadUser({
          email: normalizedEmail,
          password: password.trim(),
          chapter_id: newChapterId,
        }),
        15000,
        "Chapter head creation timed out. Please try again."
      );

      await refresh();
      if (!aliveRef.current) return;
      clearCreateForm();
      setCreateDialogOpen(false);
      addToast({ type: "success", message: "Chapter head user created." });
    } catch (error: unknown) {
      if (!aliveRef.current) return;
      addToast({ type: "error", message: getErrorMessage(error, "Failed to create chapter head.") });
    } finally {
      if (aliveRef.current) setSavingNewUser(false);
    }
  }

  async function handleUpdateAssignment(e: React.FormEvent) {
    e.preventDefault();

    if (!editingProfileId) return;
    setSavingAssignmentId(editingProfileId);

    try {
      if (!editingChapterId) {
        addToast({ type: "error", message: "Please select a chapter." });
        return;
      }

      await withTimeout(
        updateChapterHeadAssignment({
          profile_id: editingProfileId,
          chapter_id: editingChapterId,
        }),
        15000,
        "Chapter assignment timed out. Please try again."
      );

      await refresh();
      if (!aliveRef.current) return;
      clearEditForm();
      setEditDialogOpen(false);
      addToast({ type: "success", message: "Chapter assignment updated." });
    } catch (error: unknown) {
      if (!aliveRef.current) return;
      addToast({
        type: "error",
        message: getErrorMessage(error, "Failed to update chapter assignment."),
      });
    } finally {
      if (aliveRef.current) setSavingAssignmentId(null);
    }
  }

  return (
    <CmsShell
      title="Staff"
      subtitle="Create chapter head accounts and manage chapter assignments."
      right={
        <div className="flex items-center gap-2">
          <Button type="button" onClick={openCreateDialog}>
            Create Chapter Head
          </Button>
          <Button type="button" variant="outline" onClick={() => refresh().catch(() => undefined)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      }
    >
      {queryState === "loading" ? (
        <Card className="border-black/10 bg-white p-6 text-sm text-black/55">Loading staff users...</Card>
      ) : null}

      {queryState === "error" ? (
        <Card className="border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <div>Failed to load chapter head management data.</div>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => refresh().catch(() => undefined)}
          >
            Retry
          </Button>
        </Card>
      ) : null}

      {queryState === "ready" ? (
        <DataTable
          title="Chapter heads"
          description="Use the roster as the primary workspace, then open a focused modal when you need to create an account or update an assignment."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-black/45">
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Chapter</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-black/5 transition hover:bg-black/[0.02]">
                    <td className="py-4 font-medium text-black/80">{user.email ?? "—"}</td>
                    <td className="py-4 text-black/65">{user.chapter_name ?? "Unassigned"}</td>
                    <td className="py-4 text-black/55">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-4 text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                        Edit assignment
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-[rgb(var(--card))] p-4 text-sm text-black/65">
              No chapter head users found yet.
            </div>
          ) : null}
        </DataTable>
      ) : null}

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open && !savingNewUser) clearCreateForm();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-black/10 bg-white p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle>Create chapter head</DialogTitle>
            <DialogDescription>Create an account and assign its initial chapter.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateChapterHead} className="mt-2 grid gap-4">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chapterhead@example.com"
              />
            </Field>

            <Field label="Temporary password" hint="Admin creates initial access">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </Field>

            <Field label="Assigned chapter">
              <select
                value={newChapterId}
                onChange={(e) => setNewChapterId(e.target.value)}
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
              >
                <option value="">Select chapter…</option>
                {chapterOptions.map((chapter) => (
                  <option key={chapter.value} value={chapter.value}>
                    {chapter.label}
                  </option>
                ))}
              </select>
            </Field>

            <FormActions
              busy={savingNewUser}
              primaryLabel="Create chapter head"
              onCancel={() => setCreateDialogOpen(false)}
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open && !savingAssignmentId) clearEditForm();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-black/10 bg-white p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle>Edit chapter assignment</DialogTitle>
            <DialogDescription>Update the assigned chapter for this chapter-head account.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateAssignment} className="mt-2 grid gap-4">
            <Field label="Staff user">
              <Input value={editingProfileId ? users.find((user) => user.id === editingProfileId)?.email ?? "" : ""} readOnly />
            </Field>

            <Field label="Assigned chapter">
              <select
                value={editingChapterId}
                onChange={(e) => setEditingChapterId(e.target.value)}
                className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[rgba(255,119,31,0.45)]"
                disabled={!editingProfileId}
              >
                <option value="">Select chapter…</option>
                {chapterOptions.map((chapter) => (
                  <option key={chapter.value} value={chapter.value}>
                    {chapter.label}
                  </option>
                ))}
              </select>
            </Field>

            <FormActions
              busy={Boolean(editingProfileId && savingAssignmentId === editingProfileId)}
              primaryLabel="Update assignment"
              onCancel={() => setEditDialogOpen(false)}
            />
          </form>
        </DialogContent>
      </Dialog>
    </CmsShell>
  );
}
