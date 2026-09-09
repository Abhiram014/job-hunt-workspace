import Link from "next/link";
import {
  Briefcase,
  Send,
  Users,
  Trophy,
  XCircle,
  Bookmark,
  Bell,
  CalendarDays,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import {
  getDashboardStats,
  getApplicationsOverTime,
  getDueFollowups,
} from "@/lib/services/application-service";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  ApplicationsOverTimeChart,
  BreakdownBarChart,
  StatusPieChart,
} from "@/components/dashboard/charts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const userId = await requireUserId();

  const [stats, overTime, recentActivity, dueFollowups] = await Promise.all([
    getDashboardStats(userId),
    getApplicationsOverTime(userId),
    prisma.activityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    getDueFollowups(userId),
  ]);

  const statusCounts = Object.entries(
    stats.applications.reduce<Record<string, number>>((acc, a) => {
      const label = APPLICATION_STATUS_LABELS[a.applicationStatus];
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const companyCounts = Object.entries(
    stats.applications.reduce<Record<string, number>>((acc, a) => {
      acc[a.company] = (acc[a.company] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const roleCounts = Object.entries(
    stats.applications.reduce<Record<string, number>>((acc, a) => {
      const key = a.roleCategory || "Uncategorized";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s how your job search is going.
          </p>
        </div>
        <Button asChild>
          <Link href="/applications/new">+ New Application</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        <KpiCard label="Total Applications" value={stats.total} icon={Briefcase} />
        <KpiCard label="Applied" value={stats.applied} icon={Send} accent="default" />
        <KpiCard label="Interviews" value={stats.interviews} icon={Users} accent="warning" />
        <KpiCard label="Offers" value={stats.offers} icon={Trophy} accent="success" />
        <KpiCard label="Rejected" value={stats.rejected} icon={XCircle} accent="danger" />
        <KpiCard label="Saved Jobs" value={stats.saved} icon={Bookmark} />
        <KpiCard label="Follow-ups Due" value={stats.followupsDue} icon={Bell} accent={stats.followupsDue > 0 ? "warning" : "default"} />
        <KpiCard label="This Week" value={stats.thisWeek} icon={CalendarDays} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ApplicationsOverTimeChart data={overTime} />
        </div>
        <StatusPieChart data={statusCounts} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BreakdownBarChart title="Applications by company" data={companyCounts} emptyLabel="No applications yet." />
        <BreakdownBarChart title="Applications by role category" data={roleCounts} emptyLabel="Tag applications with a role category to see this." />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Conversion rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Interview conversion</span>
                <span className="text-lg font-semibold tabular-nums">
                  {stats.interviewConversionRate.toFixed(0)}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[var(--color-chart-1)]"
                  style={{ width: `${Math.min(100, stats.interviewConversionRate)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Offer conversion</span>
                <span className="text-lg font-semibold tabular-nums">
                  {stats.offerConversionRate.toFixed(0)}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[var(--color-chart-2)]"
                  style={{ width: `${Math.min(100, stats.offerConversionRate)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Interview conversion = applications reaching an interview stage ÷ applications applied or further.
              Offer conversion = offers ÷ applications that reached an interview.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity events={recentActivity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Follow-ups due</CardTitle>
          </CardHeader>
          <CardContent>
            {dueFollowups.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nothing due in the next 3 days.
              </p>
            ) : (
              <ul className="space-y-3">
                {dueFollowups.map((f) => {
                  const overdue = f.dueDate < new Date();
                  return (
                    <li key={f.id} className="text-sm">
                      <Link
                        href={f.applicationId ? `/applications/${f.applicationId}` : "#"}
                        className="font-medium hover:underline"
                      >
                        {f.title}
                      </Link>
                      {f.application && (
                        <p className="text-xs text-muted-foreground">
                          {f.application.jobTitle} — {f.application.company}
                        </p>
                      )}
                      <p className={`text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                        {overdue ? "Overdue: " : "Due "}
                        {f.dueDate.toLocaleDateString()}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
