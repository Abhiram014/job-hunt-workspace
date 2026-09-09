import { Sparkles, CheckCircle2, Circle } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AiWorkspace } from "@/components/ai/ai-workspace";

export default async function AiWorkspacePage() {
  const userId = await requireUserId();
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);

  const [applications, resumes, conversations] = await Promise.all([
    prisma.application.findMany({
      where: { userId, jobDescription: { not: null } },
      select: { id: true, company: true, jobTitle: true, jobDescription: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.resume.findMany({
      where: { userId, extractedText: { not: null } },
      select: { id: true, name: true, version: true, extractedText: true, isBaseResume: true },
      orderBy: [{ isBaseResume: "desc" }, { name: "asc" }],
    }),
    prisma.conversation.findMany({
      where: { userId },
      include: {
        application: { select: { id: true, company: true, jobTitle: true } },
        resume: { select: { id: true, name: true, version: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">AI Workspace</h1>
          <p className="text-sm text-muted-foreground">
            Match analysis, resume tailoring, and job-specific chat.
          </p>
        </div>
      </div>

      {!hasKey ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">AI features aren&apos;t configured yet</CardTitle>
            <CardDescription>
              Add <code className="rounded bg-muted px-1 py-0.5 text-xs">ANTHROPIC_API_KEY</code> to your{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> file and restart the dev server to
              enable match analysis, tailoring, and chat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Circle className="h-4 w-4 text-muted-foreground" />
              Anthropic API key
              <Badge variant="outline" className="ml-auto text-[10px]">Not set</Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          Anthropic API key configured
        </div>
      )}

      <AiWorkspace applications={applications} resumes={resumes} conversations={conversations} />
    </div>
  );
}
