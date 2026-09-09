import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { STATUSES_COUNTING_AS_INTERVIEW, JOB_SOURCE_LABELS } from "@/lib/constants";
import { BreakdownBarChart } from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AnalyticsPage() {
  const userId = await requireUserId();

  const applications = await prisma.application.findMany({
    where: { userId },
    select: {
      id: true,
      applicationStatus: true,
      source: true,
      location: true,
      createdAt: true,
      dateApplied: true,
      applicationResumes: { select: { resumeId: true } },
    },
  });

  const resumes = await prisma.resume.findMany({
    where: { userId },
    select: { id: true, name: true, version: true },
  });

  const interviewOrBeyond = new Set([...STATUSES_COUNTING_AS_INTERVIEW, "OFFER"]);

  const resumeStats = resumes
    .map((resume) => {
      const usedIn = applications.filter((a) =>
        a.applicationResumes.some((ar) => ar.resumeId === resume.id)
      );
      const interviews = usedIn.filter((a) => interviewOrBeyond.has(a.applicationStatus)).length;
      return {
        id: resume.id,
        name: `${resume.name} (v${resume.version})`,
        used: usedIn.length,
        interviews,
        rate: usedIn.length > 0 ? (interviews / usedIn.length) * 100 : 0,
      };
    })
    .filter((r) => r.used > 0)
    .sort((a, b) => b.rate - a.rate);

  const bySource = groupCount(applications, (a) => JOB_SOURCE_LABELS[a.source]);
  const byLocation = groupCount(applications, (a) => a.location || "Not specified");

  const totalApplied = applications.filter((a) => a.applicationStatus !== "SAVED").length;
  const totalRejected = applications.filter((a) => a.applicationStatus === "REJECTED").length;
  const rejectionRate = totalApplied > 0 ? (totalRejected / totalApplied) * 100 : 0;

  const responseTimes = applications
    .filter((a) => a.dateApplied)
    .map((a) => Math.round((a.createdAt.getTime() - new Date(a.dateApplied!).getTime()) / 86400000));
  const avgDaysFoundToApplied =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((s, v) => s + Math.abs(v), 0) / responseTimes.length)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Deeper insight into what&apos;s working in your search.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-semibold">{rejectionRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Rejection rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-semibold">{avgDaysFoundToApplied ?? "—"}{avgDaysFoundToApplied !== null && <span className="text-sm font-normal text-muted-foreground"> days</span>}</p>
            <p className="text-xs text-muted-foreground">Avg. days from found to applied</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-2xl font-semibold">{applications.length}</p>
            <p className="text-xs text-muted-foreground">Total applications tracked</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownBarChart title="Applications by source" data={bySource} emptyLabel="No applications yet." />
        <BreakdownBarChart title="Applications by location" data={byLocation} emptyLabel="No applications yet." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Resume performance</CardTitle>
        </CardHeader>
        <CardContent>
          {resumeStats.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Attach resumes to applications to see which versions perform best.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resume</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Interviews+</TableHead>
                  <TableHead className="text-right">Interview Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumeStats.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.used}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.interviews}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.rate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function groupCount<T>(items: T[], keyFn: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
