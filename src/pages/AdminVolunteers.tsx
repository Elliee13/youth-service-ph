import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { CmsShell } from "../components/cms/CmsShell";
import { Button } from "../components/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/shadcn/table";
import { useGsapReveal } from "../hooks/useGsapReveal";
import { listVolunteerSignups, type VolunteerSignupRow } from "../lib/admin.api";
import { useToast } from "../components/ui/useToast";

type PostgrestLikeError = { message?: string };

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as PostgrestLikeError).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function AdminVolunteers() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  const [signups, setSignups] = useState<VolunteerSignupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listVolunteerSignups();
      setSignups(data);
    } catch (error: unknown) {
      addToast({ type: "error", message: getErrorMessage(error, "Failed to load volunteer signups.") });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const uniqueVolunteers = useMemo(() => {
    return new Set(signups.map((signup) => signup.email.trim().toLowerCase())).size;
  }, [signups]);

  const upcomingVolunteerCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return signups.filter((signup) => (signup.opportunity?.event_date ?? "") >= today).length;
  }, [signups]);

  return (
    <div ref={scope}>
      <CmsShell
        title="Volunteer Signups"
        subtitle="Monitor incoming volunteer interest across chapters and opportunities."
      >
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-black/45">Admin / Volunteers</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">Volunteer activity</div>
            </div>
            <Button type="button" variant="outline" onClick={() => refresh().catch(() => undefined)} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Card className="rounded-xl border border-black/10 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-black/65">Total Signups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tabular-nums">{signups.length}</div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-black/10 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-black/65">Unique Volunteers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tabular-nums">{uniqueVolunteers}</div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-black/10 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-black/65">Upcoming Event Signups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tabular-nums">{upcomingVolunteerCount}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-8 border-black/10 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Signup log</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[18%]">Volunteer</TableHead>
                  <TableHead className="w-[18%]">Contact</TableHead>
                  <TableHead className="w-[20%]">Opportunity</TableHead>
                  <TableHead className="w-[16%]">Chapter</TableHead>
                  <TableHead className="w-[12%]">Event Date</TableHead>
                  <TableHead className="w-[16%]">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signups.map((signup) => (
                  <TableRow key={signup.id}>
                    <TableCell>
                      <div className="font-medium">{signup.full_name}</div>
                      {signup.message ? (
                        <div className="mt-1 line-clamp-2 text-xs text-black/55">{signup.message}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm text-black/65">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="break-all">{signup.email}</span>
                      </div>
                      <div className="mt-1">{signup.phone}</div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {signup.opportunity?.event_name ?? "Opportunity unavailable"}
                    </TableCell>
                    <TableCell className="text-black/65">
                      {signup.opportunity?.chapter?.name ?? "Unknown chapter"}
                    </TableCell>
                    <TableCell className="tabular-nums text-black/65">
                      {signup.opportunity?.event_date ?? "TBD"}
                    </TableCell>
                    <TableCell className="tabular-nums text-black/65">
                      {new Date(signup.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && signups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-black/55">
                      No volunteer signups found yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </CmsShell>
    </div>
  );
}
