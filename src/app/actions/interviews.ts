"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { logActivity } from "@/lib/services/activity-service";
import {
  interviewInputSchema,
  interviewUpdateSchema,
} from "@/lib/validation/interview";
import { INTERVIEW_STAGE_LABELS } from "@/lib/constants";

export async function createInterview(input: unknown) {
  const userId = await requireUserId();
  const data = interviewInputSchema.parse(input);

  const application = await prisma.application.findFirst({
    where: { id: data.applicationId, userId },
  });
  if (!application) throw new Error("Application not found");

  const interview = await prisma.interview.create({ data: { ...data, userId } });

  await logActivity({
    userId,
    type: "INTERVIEW_SCHEDULED",
    description: `${INTERVIEW_STAGE_LABELS[interview.stage]} scheduled for ${application.jobTitle} — ${application.company}`,
    applicationId: application.id,
  });

  revalidatePath(`/applications/${data.applicationId}`);
  return interview;
}

export async function updateInterview(id: string, input: unknown) {
  const userId = await requireUserId();
  const data = interviewUpdateSchema.parse(input);

  const existing = await prisma.interview.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Interview not found");

  const interview = await prisma.interview.update({ where: { id }, data });
  revalidatePath(`/applications/${existing.applicationId}`);
  return interview;
}

export async function deleteInterview(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.interview.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Interview not found");

  await prisma.interview.delete({ where: { id } });
  revalidatePath(`/applications/${existing.applicationId}`);
}
