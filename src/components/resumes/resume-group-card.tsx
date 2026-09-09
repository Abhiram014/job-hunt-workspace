"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  MoreVertical,
  Download,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Star,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateResume, deleteResume, duplicateResume } from "@/app/actions/resumes";
import type { ResumeListItem } from "@/types/application";

export function ResumeGroupCard({ versions }: { versions: ResumeListItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const latest = versions[0];
  const older = versions.slice(1);

  return (
    <Card>
      <CardContent className="space-y-3 py-2">
        <ResumeRow resume={latest} isLatest />
        {older.length > 0 && (
          <>
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {older.length} earlier version{older.length === 1 ? "" : "s"}
            </button>
            {expanded && (
              <div className="space-y-3 border-t pt-3">
                {older.map((v) => (
                  <ResumeRow key={v.id} resume={v} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ResumeRow({ resume, isLatest }: { resume: ResumeListItem; isLatest?: boolean }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(resume.name);

  async function handleRename() {
    if (!name.trim() || name === resume.name) {
      setRenaming(false);
      return;
    }
    try {
      await updateResume(resume.id, { name: name.trim() });
      toast.success("Renamed");
    } catch {
      toast.error("Couldn't rename");
    } finally {
      setRenaming(false);
    }
  }

  async function handleDuplicate() {
    const newName = prompt("Name for the duplicate:", `${resume.name} (copy)`);
    if (!newName) return;
    try {
      await duplicateResume(resume.id, newName);
      toast.success("Duplicated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't duplicate");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${resume.name}"?`)) return;
    try {
      await deleteResume(resume.id);
      toast.success("Deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete");
    }
  }

  async function handleSetBase() {
    try {
      await updateResume(resume.id, { isBaseResume: true });
    } catch {
      toast.error("Couldn't update");
    }
  }

  const usageCount = resume._count.applicationResumes;

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {renaming ? (
            <input
              autoFocus
              className="w-full rounded border bg-transparent px-1 text-sm font-medium outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
          ) : (
            <p className="truncate text-sm font-medium">
              {resume.name} <span className="text-muted-foreground">v{resume.version}</span>
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {isLatest && resume.isBaseResume && (
              <Badge variant="secondary" className="text-[10px]"><Star className="mr-1 h-2.5 w-2.5" />Base</Badge>
            )}
            {resume.fileType && <Badge variant="outline" className="text-[10px] uppercase">{resume.fileType}</Badge>}
            {resume.tags?.split(",").filter(Boolean).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">{tag.trim()}</Badge>
            ))}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {resume.fileURL && (
              <>
                <DropdownMenuItem asChild>
                  <a href={`/api/resumes/${resume.id}/file`} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-3.5 w-3.5" /> Preview
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`/api/resumes/${resume.id}/file?download=1`}>
                    <Download className="mr-2 h-3.5 w-3.5" /> Download
                  </a>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => setRenaming(true)}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
            </DropdownMenuItem>
            {!resume.isBaseResume && (
              <DropdownMenuItem onClick={handleSetBase}>
                <Star className="mr-2 h-3.5 w-3.5" /> Mark as base resume
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDelete} variant="destructive">
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {usageCount > 0 ? (
        <div className="flex flex-wrap gap-1">
          {resume.applicationResumes.slice(0, 3).map((ar) => (
            <Link
              key={ar.id}
              href={`/applications/${ar.application.id}`}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {ar.application.company}
              {resume.applicationResumes.indexOf(ar) < Math.min(2, resume.applicationResumes.length - 1) ? "," : ""}
            </Link>
          ))}
          {usageCount > 3 && <span className="text-xs text-muted-foreground">+{usageCount - 3} more</span>}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Not used in any application yet</p>
      )}
    </div>
  );
}
