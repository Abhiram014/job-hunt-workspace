import { prisma } from "@/lib/db";
import type { ActivityType } from "@prisma/client";

export async function logActivity(params: {
  userId: string;
  type: ActivityType;
  description: string;
  applicationId?: string | null;
}) {
  return prisma.activityEvent.create({
    data: {
      userId: params.userId,
      type: params.type,
      description: params.description,
      applicationId: params.applicationId ?? null,
    },
  });
}
