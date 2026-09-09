import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { ApplicationsView } from "@/components/applications/applications-view";

export default async function ApplicationsPage() {
  const userId = await requireUserId();

  const applications = await prisma.application.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      applicationResumes: {
        orderBy: { submittedAt: "desc" },
        take: 1,
        include: { resume: { select: { name: true, version: true } } },
      },
      _count: { select: { notes: true, interviews: true } },
    },
  });

  const resumes = await prisma.resume.findMany({
    where: { userId },
    select: { id: true, name: true, version: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Applications</h1>
          <p className="text-sm text-muted-foreground">
            {applications.length} tracked application{applications.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild>
          <Link href="/applications/new">+ New Application</Link>
        </Button>
      </div>

      <ApplicationsView applications={applications} resumes={resumes} />
    </div>
  );
}
