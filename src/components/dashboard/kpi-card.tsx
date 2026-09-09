import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  suffix,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: "default" | "warning" | "success" | "danger";
  suffix?: string;
}) {
  const accentClasses: Record<string, string> = {
    default: "text-muted-foreground",
    warning: "text-amber-600 dark:text-amber-400",
    success: "text-emerald-600 dark:text-emerald-400",
    danger: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="rounded-xl border bg-card px-4 py-3.5 shadow-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", accentClasses[accent ?? "default"])} />
        <p className="truncate text-xs font-medium">{label}</p>
      </div>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums leading-none tracking-tight">
        {value}
        {suffix && <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}
