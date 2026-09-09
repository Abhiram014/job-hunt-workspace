"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileText, X, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { linkResumeToApplication, unlinkResumeFromApplication } from "@/app/actions/resumes";
import type { ApplicationDetailItem, BaseResumeOption } from "@/types/application";

export function ResumePanel({
  applicationId,
  applicationResumes,
  resumes,
}: {
  applicationId: string;
  applicationResumes: ApplicationDetailItem["applicationResumes"];
  resumes: BaseResumeOption[];
}) {
  const [selected, setSelected] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAttach() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await linkResumeToApplication(applicationId, selected);
      setSelected("");
      toast.success("Resume attached");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to attach resume");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnlink(id: string) {
    if (!confirm("Remove this resume from the application?")) return;
    try {
      await unlinkResumeFromApplication(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border p-3">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="flex-1"><SelectValue placeholder="Select a resume to attach..." /></SelectTrigger>
          <SelectContent>
            {resumes.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No resumes yet — upload one in the Resume Library.
              </div>
            ) : (
              resumes.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name} (v{r.version}){r.isBaseResume ? " · Base" : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleAttach} disabled={!selected || submitting}>
          Attach
        </Button>
      </div>

      {applicationResumes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No resume attached to this application yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {applicationResumes.map((ar) => (
            <li key={ar.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{ar.resume.name} <span className="text-muted-foreground">v{ar.resume.version}</span></p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(ar.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {ar.resume.fileType && (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Preview">
                      <a href={`/api/resumes/${ar.resume.id}/file`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Download">
                      <a href={`/api/resumes/${ar.resume.id}/file?download=1`}>
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUnlink(ar.id)} title="Remove">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Need to tailor a resume for this job first?{" "}
        <Link href="/ai" className="underline underline-offset-2">Open the AI Workspace</Link>.
      </p>
    </div>
  );
}
