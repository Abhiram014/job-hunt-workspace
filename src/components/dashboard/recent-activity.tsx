import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Briefcase,
  ArrowRightLeft,
  Sparkles,
  UserPlus,
  Handshake,
  CalendarClock,
  StickyNote,
  Trophy,
  FileText,
  Circle,
} from "lucide-react";
import type { ActivityType } from "@prisma/client";

const ICONS: Record<ActivityType, typeof Briefcase> = {
  JOB_SAVED: Briefcase,
  APPLICATION_SUBMITTED: ArrowRightLeft,
  STATUS_CHANGED: ArrowRightLeft,
  RESUME_TAILORED: Sparkles,
  RESUME_SUBMITTED: FileText,
  CONTACT_ADDED: UserPlus,
  REFERRAL_REQUESTED: Handshake,
  INTERVIEW_SCHEDULED: CalendarClock,
  NOTE_CREATED: StickyNote,
  OFFER_RECEIVED: Trophy,
  OTHER: Circle,
};

export function RecentActivity({
  events,
}: {
  events: {
    id: string;
    type: ActivityType;
    description: string;
    createdAt: Date;
    applicationId: string | null;
  }[];
}) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No activity yet. Save your first job to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {events.map((event) => {
        const Icon = ICONS[event.type] ?? Circle;
        const content = (
          <div className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/60">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{event.description}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(event.createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
        );

        return (
          <li key={event.id}>
            {event.applicationId ? (
              <Link href={`/applications/${event.applicationId}`}>{content}</Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
