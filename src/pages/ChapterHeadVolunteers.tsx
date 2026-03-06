import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
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
import { listOpportunities, listVolunteerSignupsByOpportunityIds, type OpportunityRow, type VolunteerSignupRow } from "../lib/admin.api";
import { useAuth } from "../auth/useAuth";
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

export default function ChapterHeadVolunteers() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  const { profile } = useAuth();
  const chapterId = profile?.chapter_id ?? null;
  const { addToast } = useToast();

  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [signups, setSignups] = useState<VolunteerSignupRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!chapterId) {
      setOpportunities([]);
      setSignups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const chapterOpportunities = await listOpportunities(chapterId);
      setOpportunities(chapterOpportunities);
      const chapterSignups = await listVolunteerSignupsByOpportunityIds(
        chapterOpportunities.map((opportunity) => opportunity.id)
      );
      setSignups(chapterSignups);
    } catch (error: unknown) {
      addToast({ type: "error", message: getErrorMessage(error, "Failed to load volunteer data.") });
    } finally {
      setLoading(false);
    }
  }, [addToast, chapterId]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const uniqueVolunteerCount = useMemo(() => {
    return new Set(signups.map((signup) => signup.email.trim().toLowerCase())).size;
  }, [signups]);

  return (
    <div ref={scope}>
      <CmsShell
        title="Chapter Volunteers"
        subtitle="View volunteer interest and signups for your chapter opportunities."
      >
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">Volunteer pipeline</div>
            </div>
            <Button type="button" variant="outline" onClick={() => refresh().catch(() => undefined)} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Card className="rounded-xl border border-black/10 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-black/65">My Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tabular-nums">{opportunities.length}</div>
              </CardContent>
            </Card>
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
                <div className="text-3xl font-semibold tabular-nums">{uniqueVolunteerCount}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-8 border-black/10 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Chapter signup log</CardTitle>
          </CardHeader>
          <CardContent>
            {!chapterId ? (
              <div className="rounded-2xl border border-black/10 bg-[rgb(var(--card))] p-4 text-sm text-black/65">
                Your account does not have a chapter assigned yet. Ask an admin to set your chapter before reviewing volunteer data.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20%]">Volunteer</TableHead>
                    <TableHead className="w-[18%]">Email</TableHead>
                    <TableHead className="w-[16%]">Phone</TableHead>
                    <TableHead className="w-[24%]">Opportunity</TableHead>
                    <TableHead className="w-[10%]">Event Date</TableHead>
                    <TableHead className="w-[12%]">Submitted</TableHead>
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
                      <TableCell className="break-all text-black/65">{signup.email}</TableCell>
                      <TableCell className="text-black/65">{signup.phone}</TableCell>
                      <TableCell className="font-medium">
                        {signup.opportunity?.event_name ?? "Opportunity unavailable"}
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
                        No volunteer signups found for your chapter yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </CmsShell>
    </div>
  );
}
