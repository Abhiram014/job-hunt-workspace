"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Check, X, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tailorResume, saveTailoredResume } from "@/app/actions/ai";
import type { TailorResult } from "@/lib/ai/provider";
import { cn } from "@/lib/utils";

export function TailorResumePanel({
  applicationId,
  resumeId,
  resumeName,
  resumeText,
}: {
  applicationId: string;
  resumeId: string | null;
  resumeName: string | null;
  resumeText: string | null;
}) {
  const [result, setResult] = useState<TailorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rejected, setRejected] = useState<Set<number>>(new Set());
  const [newName, setNewName] = useState("");

  async function handleTailor() {
    if (!resumeId) {
      toast.error("Select a base resume first");
      return;
    }
    setLoading(true);
    setResult(null);
    setRejected(new Set());
    try {
      const res = await tailorResume({ applicationId, resumeId });
      if (res.changes.length === 0) {
        toast.info("The AI didn't find safe, well-anchored changes to suggest for this resume.");
      }
      setResult(res);
      setNewName(resumeName ? `${resumeName} (tailored)` : "Tailored resume");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to tailor resume");
    } finally {
      setLoading(false);
    }
  }

  const tailoredText = useMemo(() => {
    if (!resumeText || !result) return resumeText ?? "";
    let text = resumeText;
    result.changes.forEach((change, i) => {
      if (rejected.has(i)) return;
      if (text.includes(change.original)) {
        text = text.replace(change.original, change.suggested);
      }
    });
    return text;
  }, [resumeText, result, rejected]);

  function toggleChange(i: number) {
    setRejected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function acceptAll() {
    setRejected(new Set());
  }

  function restoreOriginal() {
    if (!result) return;
    setRejected(new Set(result.changes.map((_, i) => i)));
  }

  async function handleSave() {
    if (!resumeId || !newName.trim()) {
      toast.error("Give the new resume version a name");
      return;
    }
    setSaving(true);
    try {
      await saveTailoredResume({ resumeId, tailoredText, name: newName.trim() }, applicationId);
      toast.success("Saved as a new resume version");
      setResult(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const acceptedCount = result ? result.changes.length - rejected.size : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Proposes truthful, JD-aligned rewordings of your existing bullets — never new experience, employers, or credentials.
        </p>
        <Button size="sm" onClick={handleTailor} disabled={loading || !resumeId}>
          {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
          Tailor Resume
        </Button>
      </div>

      {!result && !loading && (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Run tailoring to get suggested, review-before-you-accept edits.
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
          Drafting tailored suggestions...
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{result.summary}</p>

          {result.changes.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {acceptedCount} of {result.changes.length} changes applied
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={acceptAll}>
                    <Check className="mr-1 h-3 w-3" /> Accept All
                  </Button>
                  <Button size="sm" variant="outline" onClick={restoreOriginal}>
                    <RotateCcw className="mr-1 h-3 w-3" /> Restore Original
                  </Button>
                </div>
              </div>

              <ul className="space-y-2">
                {result.changes.map((change, i) => {
                  const isRejected = rejected.has(i);
                  return (
                    <li key={i} className={cn("rounded-lg border p-3", isRejected && "opacity-50")}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-1.5 text-sm">
                          <p className="text-muted-foreground line-through decoration-red-400/60">{change.original}</p>
                          <p className="font-medium">{change.suggested}</p>
                          <p className="text-xs text-muted-foreground">{change.rationale}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isRejected ? "outline" : "secondary"}
                          className="shrink-0"
                          onClick={() => toggleChange(i)}
                        >
                          {isRejected ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          {isRejected ? "Accept" : "Reject"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <div>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Preview (original → tailored applied)
            </h4>
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 font-sans text-sm">
              {tailoredText}
            </pre>
          </div>

          <div className="flex items-end gap-2 rounded-lg border p-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="tailored-name">New version name</Label>
              <Input id="tailored-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save as New Version"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
