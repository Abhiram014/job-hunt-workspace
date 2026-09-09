import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { ResumesView } from "@/components/resumes/resumes-view";

export default async function ResumesPage() {
  const userId = await requireUserId();

  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: [{ name: "asc" }, { version: "asc" }],
    include: {
      applicationResumes: {
        include: { application: { select: { id: true, company: true, jobTitle: true } } },
      },
      _count: { select: { applicationResumes: true } },
    },
  });

  return <ResumesView resumes={resumes} />;
}
