"use client";

import { useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MatchAnalysisPanel } from "./match-analysis-panel";
import { TailorResumePanel } from "./tailor-resume-panel";
import { ChatPanel } from "./chat-panel";
import type { ApplicationOption, ResumeOptionForAI, ConversationListItem } from "@/types/ai";

export function AiWorkspace({
  applications,
  resumes,
  conversations,
  fixedApplicationId,
  initialResumeId,
}: {
  applications: ApplicationOption[];
  resumes: ResumeOptionForAI[];
  conversations: ConversationListItem[];
  fixedApplicationId?: string;
  initialResumeId?: string;
}) {
  const [applicationId, setApplicationId] = useState<string>(
    fixedApplicationId ?? applications[0]?.id ?? ""
  );
  const [resumeId, setResumeId] = useState<string>(
    (initialResumeId && resumes.some((r) => r.id === initialResumeId) ? initialResumeId : undefined) ??
      resumes.find((r) => r.isBaseResume)?.id ??
      resumes[0]?.id ??
      ""
  );

  const application = applications.find((a) => a.id === applicationId);
  const resume = resumes.find((r) => r.id === resumeId);

  const scopedConversations = useMemo(
    () => conversations.filter((c) => !applicationId || c.applicationId === applicationId),
    [conversations, applicationId]
  );

  if (!fixedApplicationId && applications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Add an application with a job description first, then come back here to analyze and tailor your resume for it.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {!fixedApplicationId && (
          <div className="space-y-1.5">
            <Label>Application</Label>
            <Select value={applicationId} onValueChange={setApplicationId}>
              <SelectTrigger><SelectValue placeholder="Select an application..." /></SelectTrigger>
              <SelectContent>
                {applications.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.jobTitle} — {a.company}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Base resume</Label>
          <Select value={resumeId} onValueChange={setResumeId}>
            <SelectTrigger><SelectValue placeholder="Select a resume..." /></SelectTrigger>
            <SelectContent>
              {resumes.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No resumes with extracted text yet.
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
        </div>
      </div>

      {!application ? (
        <p className="text-sm text-muted-foreground">Select an application to get started.</p>
      ) : !application.jobDescription ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          This application has no job description saved, so match analysis and tailoring aren&apos;t available.
          Edit the application to add one — chat still works below.
        </div>
      ) : null}

      <Card>
        <CardContent className="py-2">
          <Tabs defaultValue="chat">
            <TabsList>
              <TabsTrigger value="match" disabled={!application?.jobDescription}>Match Analysis</TabsTrigger>
              <TabsTrigger value="tailor" disabled={!application?.jobDescription}>Tailor Resume</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="match">
              {application?.jobDescription && (
                <MatchAnalysisPanel applicationId={application.id} resumeId={resumeId || null} />
              )}
            </TabsContent>

            <TabsContent value="tailor">
              {application?.jobDescription && (
                <TailorResumePanel
                  applicationId={application.id}
                  resumeId={resumeId || null}
                  resumeName={resume?.name ?? null}
                  resumeText={resume?.extractedText ?? null}
                />
              )}
            </TabsContent>

            <TabsContent value="chat">
              <ChatPanel
                conversations={scopedConversations}
                applicationId={application?.id}
                resumeId={resumeId || undefined}
                emptyLabel="No conversations yet — ask about this job."
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
