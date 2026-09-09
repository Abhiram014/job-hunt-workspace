import { Sparkles, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLANNED_FEATURES = [
  "Resume ↔ job description match analysis with an internal heuristic score",
  "Missing keyword and ATS readability gaps",
  "AI-tailored resume suggestions, reviewed side-by-side (accept/reject per change)",
  "Job-specific chat: interview prep, recruiter outreach drafts, bullet rewrites",
  "Conversations saved permanently per application and per resume",
];

export default function AiWorkspacePage() {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">AI Workspace</h1>
          <p className="text-sm text-muted-foreground">Phase 2 — not yet available</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">What&apos;s built vs. what&apos;s next</CardTitle>
          <CardDescription>
            This page is an honest placeholder, not a disabled button pretending to work. The
            provider-agnostic AI abstraction and database (conversations, messages) are already in
            the schema — the actual model calls are the next phase of work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2">
            {PLANNED_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              {hasKey ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              Anthropic API key
              <Badge variant={hasKey ? "default" : "outline"} className="ml-auto text-[10px]">
                {hasKey ? "Configured" : "Not set"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {hasKey
                ? "A key is present. AI features will activate once the Phase 2 endpoints ship."
                : "Add ANTHROPIC_API_KEY to your .env file to enable AI features when Phase 2 lands."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
