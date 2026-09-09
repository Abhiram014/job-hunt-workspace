"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { logActivity } from "@/lib/services/activity-service";
import { noteInputSchema, noteUpdateSchema } from "@/lib/validation/note";

export async function createNote(input: unknown) {
  const userId = await requireUserId();
  const data = noteInputSchema.parse(input);

  const application = await prisma.application.findFirst({
    where: { id: data.applicationId, userId },
  });
  if (!application) throw new Error("Application not found");

  const note = await prisma.note.create({
    data: { ...data, userId },
  });

  await logActivity({
    userId,
    type: "NOTE_CREATED",
    description: `Note added on ${application.jobTitle} — ${application.company}`,
    applicationId: application.id,
  });

  revalidatePath(`/applications/${data.applicationId}`);
  return note;
}

export async function updateNote(id: string, input: unknown) {
  const userId = await requireUserId();
  const data = noteUpdateSchema.parse(input);

  const existing = await prisma.note.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Note not found");

  const note = await prisma.note.update({ where: { id }, data });
  revalidatePath(`/applications/${existing.applicationId}`);
  return note;
}

export async function deleteNote(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.note.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Note not found");

  await prisma.note.delete({ where: { id } });
  revalidatePath(`/applications/${existing.applicationId}`);
}
