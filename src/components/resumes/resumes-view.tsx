"use client";

import { useMemo, useState } from "react";
import { Search, Upload, FileType, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadResumeDialog } from "./upload-resume-dialog";
import { PasteResumeDialog } from "./paste-resume-dialog";
import { ResumeGroupCard } from "./resume-group-card";
import type { ResumeListItem } from "@/types/application";

export function ResumesView({ resumes }: { resumes: ResumeListItem[] }) {
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);

  const groups = useMemo(() => {
    const rootId = (r: ResumeListItem) => r.parentResumeId ?? r.id;
    const map = new Map<string, ResumeListItem[]>();
    for (const r of resumes) {
      const key = rootId(r);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    const groupList = Array.from(map.values()).map((versions) =>
      versions.sort((a, b) => b.version - a.version)
    );

    const q = search.trim().toLowerCase();
    if (!q) return groupList;
    return groupList.filter((versions) =>
      versions.some(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.tags ?? "").toLowerCase().includes(q)
      )
    );
  }, [resumes, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Resumes</h1>
          <p className="text-sm text-muted-foreground">
            {resumes.length} resume{resumes.length === 1 ? "" : "s"} in your library
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPasteOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New from Text
          </Button>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" /> Upload Resume
          </Button>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search resumes or tags..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileType className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">No resumes yet</p>
          <p className="text-sm text-muted-foreground">Upload a PDF/DOCX or paste plain text to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((versions) => (
            <ResumeGroupCard key={versions[0].id} versions={versions} />
          ))}
        </div>
      )}

      <UploadResumeDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <PasteResumeDialog open={pasteOpen} onOpenChange={setPasteOpen} />
    </div>
  );
}
