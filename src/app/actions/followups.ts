"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";

const followupInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300),
  dueDate: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
  applicationId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
});

export async function createFollowup(input: unknown) {
  const userId = await requireUserId();
  const data = followupInputSchema.parse(input);

  if (data.applicationId) {
    const application = await prisma.application.findFirst({
      where: { id: data.applicationId, userId },
    });
    if (!application) throw new Error("Application not found");
  }

  const followup = await prisma.followup.create({ data: { ...data, userId } });

  revalidatePath("/dashboard");
  if (data.applicationId) revalidatePath(`/applications/${data.applicationId}`);
  return followup;
}

export async function toggleFollowup(id: string, completed: boolean) {
  const userId = await requireUserId();
  const existing = await prisma.followup.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Follow-up not found");

  const followup = await prisma.followup.update({
    where: { id },
    data: { completed, completedAt: completed ? new Date() : null },
  });

  revalidatePath("/dashboard");
  if (existing.applicationId) revalidatePath(`/applications/${existing.applicationId}`);
  return followup;
}

export async function deleteFollowup(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.followup.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Follow-up not found");

  await prisma.followup.delete({ where: { id } });
  revalidatePath("/dashboard");
  if (existing.applicationId) revalidatePath(`/applications/${existing.applicationId}`);
}
