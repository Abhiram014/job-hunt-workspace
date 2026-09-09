"use client";

import { useMemo, useState } from "react";
import { Search, LayoutGrid, Table2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUSES,
} from "@/lib/constants";
import type { ApplicationStatus } from "@prisma/client";
import type { ApplicationListItem, ResumeOption } from "@/types/application";
import { ApplicationsTable } from "./applications-table";
import { KanbanBoard } from "./kanban-board";
import { cn } from "@/lib/utils";

export function ApplicationsView({
  applications,
  resumes,
}: {
  applications: ApplicationListItem[];
  resumes: ResumeOption[];
}) {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "ALL">("ALL");
  const [resumeFilter, setResumeFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((app) => {
      if (statusFilter !== "ALL" && app.applicationStatus !== statusFilter) return false;
      if (
        resumeFilter !== "ALL" &&
        !app.applicationResumes.some((r) => r.resumeId === resumeFilter)
      )
        return false;
      if (
        locationFilter &&
        !(app.location ?? "").toLowerCase().includes(locationFilter.toLowerCase())
      )
        return false;
      if (
        q &&
        !`${app.company} ${app.jobTitle} ${app.location ?? ""}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [applications, search, statusFilter, resumeFilter, locationFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search company or role..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApplicationStatus | "ALL")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Filter by location..."
          className="w-44"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        />

        {resumes.length > 0 && (
          <Select value={resumeFilter} onValueChange={setResumeFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Resume" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All resumes</SelectItem>
              {resumes.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name} (v{r.version})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="ml-auto flex items-center gap-1 rounded-md border p-0.5">
          <Button
            size="sm"
            variant="ghost"
            className={cn("h-7 px-2", view === "table" && "bg-muted")}
            onClick={() => setView("table")}
          >
            <Table2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn("h-7 px-2", view === "kanban" && "bg-muted")}
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          No applications match these filters.
        </div>
      ) : view === "table" ? (
        <ApplicationsTable applications={filtered} />
      ) : (
        <KanbanBoard applications={filtered} />
      )}
    </div>
  );
}
