import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, CalendarClock, RefreshCw, Users } from "lucide-react";
import { CmsShell } from "../components/cms/CmsShell";
import { Button } from "../components/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/shadcn/card";
import { useAuth } from "../auth/useAuth";
import { useGsapReveal } from "../hooks/useGsapReveal";
import { listOpportunities, listVolunteerSignupsByOpportunityIds, type OpportunityRow, type VolunteerSignupRow } from "../lib/admin.api";
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

export default function ChapterHeadReports() {
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
      addToast({ type: "error", message: getErrorMessage(error, "Failed to load reports.") });
    } finally {
      setLoading(false);
    }
  }, [addToast, chapterId]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const upcomingOpportunityCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return opportunities.filter((opportunity) => opportunity.event_date >= today).length;
  }, [opportunities]);

  const latestSignups = useMemo(() => signups.slice(0, 5), [signups]);

  return (
    <div ref={scope}>
      <CmsShell
        title="Reports"
        subtitle="A quick operational snapshot of activity across your chapter opportunities."
      >
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">Performance snapshot</div>
            </div>
            <Button type="button" variant="outline" onClick={() => refresh().catch(() => undefined)} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Card className="rounded-xl border border-black/10 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-black/65">Tracked Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-semibold tabular-nums">{opportunities.length}</div>
                  <BarChart3 className="h-4 w-4 text-black/45" />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-black/10 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-black/65">Volunteer Signups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-semibold tabular-nums">{signups.length}</div>
                  <Users className="h-4 w-4 text-black/45" />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-black/10 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-black/65">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-semibold tabular-nums">{upcomingOpportunityCount}</div>
                  <CalendarClock className="h-4 w-4 text-black/45" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="border-black/10 bg-white">
            <CardHeader>
              <CardTitle className="text-base">Recent signups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!chapterId ? (
                <div className="rounded-2xl border border-black/10 bg-[rgb(var(--card))] p-4 text-sm text-black/65">
                  Your account does not have a chapter assigned yet.
                </div>
              ) : latestSignups.length === 0 ? (
                <div className="text-sm text-black/55">No signups recorded yet.</div>
              ) : (
                latestSignups.map((signup) => (
                  <div key={signup.id} className="rounded-2xl border border-black/10 p-4">
                    <div className="font-medium">{signup.full_name}</div>
                    <div className="mt-1 text-sm text-black/65">
                      {signup.opportunity?.event_name ?? "Opportunity unavailable"}
                    </div>
                    <div className="mt-2 text-xs text-black/50">
                      Submitted {new Date(signup.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-black/10 bg-white">
            <CardHeader>
              <CardTitle className="text-base">Operational notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-black/65">
              <div className="rounded-2xl border border-black/10 p-4">
                Keep an eye on upcoming events to make sure each opportunity still has the right chapter contact details.
              </div>
              <div className="rounded-2xl border border-black/10 p-4">
                Volunteer interest is calculated from submitted signup records scoped to your chapter opportunities.
              </div>
              <div className="rounded-2xl border border-black/10 p-4">
                Use the Volunteers page for full signup details and the Opportunities page for edits.
              </div>
            </CardContent>
          </Card>
        </div>
      </CmsShell>
    </div>
  );
}
