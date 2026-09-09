import { cn } from "@/lib/utils";
import {
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
} from "@/lib/constants";
import type { ApplicationStatus } from "@prisma/client";

export function StatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        APPLICATION_STATUS_COLORS[status],
        className
      )}
    >
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}
