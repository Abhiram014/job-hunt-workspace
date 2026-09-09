import { prisma } from "@/lib/db";
import type { ApplicationStatus } from "@prisma/client";
import { STATUSES_COUNTING_AS_INTERVIEW } from "@/lib/constants";
import { startOfWeek, subDays } from "date-fns";

export interface ApplicationFilters {
  status?: ApplicationStatus[];
  company?: string;
  location?: string;
  resumeId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export function buildApplicationWhere(userId: string, filters: ApplicationFilters) {
  return {
    userId,
    ...(filters.status?.length ? { applicationStatus: { in: filters.status } } : {}),
    ...(filters.company ? { company: { contains: filters.company } } : {}),
    ...(filters.location ? { location: { contains: filters.location } } : {}),
    ...(filters.resumeId
      ? { applicationResumes: { some: { resumeId: filters.resumeId } } }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { company: { contains: filters.search } },
            { jobTitle: { contains: filters.search } },
            { jobDescription: { contains: filters.search } },
          ],
        }
      : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          createdAt: {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: filters.dateTo } : {}),
          },
        }
      : {}),
  };
}

export async function getDashboardStats(userId: string) {
  const [all, weekStart, followupsDue] = await Promise.all([
    prisma.application.findMany({
      where: { userId },
      select: { applicationStatus: true, createdAt: true, company: true, roleCategory: true },
    }),
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    prisma.followup.count({
      where: { userId, completed: false, dueDate: { lte: new Date() } },
    }),
  ]);

  const total = all.length;
  const applied = all.filter((a) => a.applicationStatus === "APPLIED").length;
  const interviews = all.filter((a) =>
    STATUSES_COUNTING_AS_INTERVIEW.includes(a.applicationStatus)
  ).length;
  const offers = all.filter((a) => a.applicationStatus === "OFFER").length;
  const rejected = all.filter((a) => a.applicationStatus === "REJECTED").length;
  const saved = all.filter((a) => a.applicationStatus === "SAVED").length;
  const thisWeek = all.filter((a) => a.createdAt >= weekStart).length;

  const interviewedOrBeyond = all.filter((a) =>
    [...STATUSES_COUNTING_AS_INTERVIEW, "OFFER", "REJECTED", "WITHDRAWN"].includes(
      a.applicationStatus
    )
  ).length;

  const appliedOrBeyond = all.filter((a) => a.applicationStatus !== "SAVED" && a.applicationStatus !== "PREPARING").length;

  const interviewConversionRate =
    appliedOrBeyond > 0 ? (interviewedOrBeyond / appliedOrBeyond) * 100 : 0;
  const offerConversionRate = interviews > 0 ? (offers / interviews) * 100 : 0;

  return {
    total,
    applied,
    interviews,
    offers,
    rejected,
    saved,
    followupsDue,
    thisWeek,
    interviewConversionRate,
    offerConversionRate,
    applications: all,
  };
}

export async function getDueFollowups(userId: string, withinDays = 3) {
  const cutoff = new Date(Date.now() + withinDays * 86400000);
  return prisma.followup.findMany({
    where: { userId, completed: false, dueDate: { lte: cutoff } },
    orderBy: { dueDate: "asc" },
    take: 5,
    include: { application: { select: { id: true, company: true, jobTitle: true } } },
  });
}

export async function getApplicationsOverTime(userId: string, days = 90) {
  const since = subDays(new Date(), days);
  const applications = await prisma.application.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, number>();
  for (const app of applications) {
    const key = app.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  return Array.from(byDay.entries()).map(([date, count]) => ({ date, count }));
}
