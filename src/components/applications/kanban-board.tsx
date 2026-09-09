"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { toast } from "sonner";
import { KANBAN_COLUMNS, APPLICATION_STATUS_LABELS } from "@/lib/constants";
import type { ApplicationStatus } from "@prisma/client";
import type { ApplicationListItem } from "@/types/application";
import { updateApplicationStatus } from "@/app/actions/applications";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function KanbanCard({ application }: { application: ApplicationListItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn("touch-none", isDragging && "opacity-40")}
    >
      <Card className="cursor-grab gap-2 p-3 active:cursor-grabbing">
        <Link
          href={`/applications/${application.id}`}
          onClick={(e) => isDragging && e.preventDefault()}
          className="block"
        >
          <p className="text-sm font-medium leading-tight">{application.jobTitle}</p>
          <p className="text-xs text-muted-foreground">{application.company}</p>
          {application.location && (
            <p className="mt-1 text-xs text-muted-foreground">{application.location}</p>
          )}
        </Link>
      </Card>
    </div>
  );
}

function KanbanColumn({
  status,
  applications,
}: {
  status: ApplicationStatus;
  applications: ApplicationListItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 shrink-0 flex-col rounded-lg border bg-muted/30 p-2",
        isOver && "ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-center justify-between px-1 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {APPLICATION_STATUS_LABELS[status]}
        </h3>
        <span className="text-xs text-muted-foreground">{applications.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {applications.map((app) => (
          <KanbanCard key={app.id} application={app} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ applications }: { applications: ApplicationListItem[] }) {
  const [localApps, setLocalApps] = useState(applications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const grouped = useMemo(() => {
    const map = new Map<ApplicationStatus, ApplicationListItem[]>();
    for (const status of KANBAN_COLUMNS) map.set(status, []);
    for (const app of localApps) {
      if (!map.has(app.applicationStatus)) map.set(app.applicationStatus, []);
      map.get(app.applicationStatus)!.push(app);
    }
    return map;
  }, [localApps]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as ApplicationStatus;
    const appId = active.id as string;
    const app = localApps.find((a) => a.id === appId);
    if (!app || app.applicationStatus === newStatus) return;

    const previousStatus = app.applicationStatus;
    setLocalApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, applicationStatus: newStatus } : a))
    );

    startTransition(async () => {
      try {
        await updateApplicationStatus(appId, { applicationStatus: newStatus });
      } catch {
        setLocalApps((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, applicationStatus: previousStatus } : a))
        );
        toast.error("Couldn't update status. Please try again.");
      }
    });
  }

  const activeApp = localApps.find((a) => a.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn key={status} status={status} applications={grouped.get(status) ?? []} />
        ))}
      </div>
      <DragOverlay>
        {activeApp && (
          <Card className="w-64 gap-2 p-3 shadow-lg">
            <p className="text-sm font-medium leading-tight">{activeApp.jobTitle}</p>
            <p className="text-xs text-muted-foreground">{activeApp.company}</p>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
