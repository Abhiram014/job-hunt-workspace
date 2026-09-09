"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyzeResumeMatch } from "@/app/actions/ai";
import type { MatchAnalysis } from "@/lib/ai/provider";
import { cn } from "@/lib/utils";

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 75
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="40" fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700", color)}
          stroke="currentColor"
        />
      </svg>
      <span className={cn("absolute text-xl font-semibold tabular-nums", color)}>{score}</span>
    </div>
  );
}

export function MatchAnalysisPanel({
  applicationId,
  resumeId,
}: {
  applicationId: string;
  resumeId: string | null;
}) {
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    if (!resumeId) {
      toast.error("Select a base resume first");
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeResumeMatch({ applicationId, resumeId });
      setAnalysis(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to analyze match");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Compares the selected resume against this job&apos;s description and requirements.
        </p>
        <Button size="sm" onClick={handleAnalyze} disabled={loading || !resumeId}>
          {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
          Analyze Match
        </Button>
      </div>

      {!analysis && !loading && (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Run an analysis to see the match score, keyword gaps, and alignment notes.
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
          Analyzing resume against job description...
        </div>
      )}

      {analysis && (
        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <ScoreRing score={analysis.matchScore} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Internal heuristic match score — not an official ATS score
              </p>
              <p className="mt-1 text-sm">{analysis.summary}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Strong matches
              </h4>
              {analysis.strongMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground">None identified.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.strongMatches.map((s) => (
                    <Badge key={s} variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Missing keywords
              </h4>
              {analysis.missingKeywords.length === 0 ? (
                <p className="text-sm text-muted-foreground">None identified.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missingKeywords.map((s) => (
                    <Badge key={s} variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {analysis.weakAreas.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Weak areas
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {analysis.weakAreas.map((w) => (
                  <li key={w}>• {w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <SkillCoverageList title="Required skills" items={analysis.requiredSkillsCoverage} />
            <SkillCoverageList title="Preferred skills" items={analysis.preferredSkillsCoverage} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <AlignmentCard title="Experience" text={analysis.experienceAlignment} />
            <AlignmentCard title="Education" text={analysis.educationAlignment} />
            <AlignmentCard title="Projects" text={analysis.projectsAlignment} />
          </div>
        </div>
      )}
    </div>
  );
}

function SkillCoverageList({
  title,
  items,
}: {
  title: string;
  items: { skill: string; covered: boolean }[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.skill} className="flex items-center gap-2 text-sm">
            {item.covered ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
            )}
            {item.skill}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AlignmentCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 text-sm">{text}</p>
    </div>
  );
}
