import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { ApplicationDetail } from "@/components/applications/application-detail";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();

  const application = await prisma.application.findFirst({
    where: { id, userId },
    include: {
      applicationResumes: {
        orderBy: { submittedAt: "desc" },
        include: { resume: { select: { id: true, name: true, version: true, fileType: true, fileURL: true } } },
      },
      notes: { orderBy: [{ pinned: "desc" }, { createdAt: "desc" }] },
      applicationContacts: {
        include: { contact: true },
        orderBy: { createdAt: "desc" },
      },
      interviews: { orderBy: { scheduledAt: "asc" } },
      activityEvents: { orderBy: { createdAt: "desc" }, take: 50 },
      followups: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!application) notFound();

  const [resumes, allContacts] = await Promise.all([
    prisma.resume.findMany({
      where: { userId },
      select: { id: true, name: true, version: true, isBaseResume: true },
      orderBy: [{ isBaseResume: "desc" }, { name: "asc" }],
    }),
    prisma.contact.findMany({
      where: { userId },
      select: { id: true, name: true, company: true, contactType: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ApplicationDetail application={application} resumes={resumes} allContacts={allContacts} />
  );
}
