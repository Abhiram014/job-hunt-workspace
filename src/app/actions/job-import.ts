"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { logActivity } from "@/lib/services/activity-service";
import { applicationInputSchema } from "@/lib/validation/application";

export async function promoteJobImport(jobImportId: string, input: unknown) {
  const userId = await requireUserId();
  const data = applicationInputSchema.parse(input);

  const jobImport = await prisma.jobImport.findFirst({
    where: { id: jobImportId, userId },
  });
  if (!jobImport) throw new Error("Import not found");

  const application = await prisma.application.create({
    data: { ...data, userId, jobURL: data.jobURL ?? jobImport.sourceURL ?? null },
  });

  await prisma.jobImport.update({
    where: { id: jobImportId },
    data: { status: "PROMOTED", promotedApplicationId: application.id },
  });

  await logActivity({
    userId,
    type: "JOB_SAVED",
    description: `Imported ${application.jobTitle} — ${application.company}`,
    applicationId: application.id,
  });

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return application;
}
