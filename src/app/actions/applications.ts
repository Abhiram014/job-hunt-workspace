"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { logActivity } from "@/lib/services/activity-service";
import {
  applicationInputSchema,
  applicationUpdateSchema,
  applicationStatusUpdateSchema,
} from "@/lib/validation/application";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";

export async function createApplication(input: unknown) {
  const userId = await requireUserId();
  const data = applicationInputSchema.parse(input);

  const application = await prisma.application.create({
    data: { ...data, userId },
  });

  await logActivity({
    userId,
    type: "JOB_SAVED",
    description: `Saved ${application.jobTitle} — ${application.company}`,
    applicationId: application.id,
  });

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return application;
}

export async function updateApplication(id: string, input: unknown) {
  const userId = await requireUserId();
  const data = applicationUpdateSchema.parse(input);

  const existing = await prisma.application.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Application not found");

  const application = await prisma.application.update({
    where: { id },
    data,
  });

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  revalidatePath("/dashboard");
  return application;
}

export async function updateApplicationStatus(id: string, input: unknown) {
  const userId = await requireUserId();
  const { applicationStatus } = applicationStatusUpdateSchema.parse(input);

  const existing = await prisma.application.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Application not found");

  const data: { applicationStatus: typeof applicationStatus; dateApplied?: Date } = {
    applicationStatus,
  };
  if (applicationStatus === "APPLIED" && !existing.dateApplied) {
    data.dateApplied = new Date();
  }

  const application = await prisma.application.update({ where: { id }, data });

  await logActivity({
    userId,
    type: applicationStatus === "OFFER" ? "OFFER_RECEIVED" : "STATUS_CHANGED",
    description: `${existing.jobTitle} — ${existing.company} moved to ${APPLICATION_STATUS_LABELS[applicationStatus]}`,
    applicationId: id,
  });

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  revalidatePath("/dashboard");
  return application;
}

export async function deleteApplication(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.application.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Application not found");

  await prisma.application.delete({ where: { id } });

  revalidatePath("/applications");
  revalidatePath("/dashboard");
}
