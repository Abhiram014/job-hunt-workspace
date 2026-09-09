"use client";

import { formatDistanceToNow } from "date-fns";
import { Sparkles } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplicationHeader } from "./application-header";
import { NotesPanel } from "./notes-panel";
import { ResumePanel } from "./resume-panel";
import { ContactsPanel } from "./contacts-panel";
import { InterviewsPanel } from "./interviews-panel";
import { AiWorkspace } from "@/components/ai/ai-workspace";
import {
  JOB_SOURCE_LABELS,
  WORK_MODE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
} from "@/lib/constants";
import type {
  ApplicationDetailItem,
  BaseResumeOption,
  ContactOption,
} from "@/types/application";
import type { ConversationListItem } from "@/types/ai";

export function ApplicationDetail({
  application,
  resumes,
  allContacts,
  conversations,
}: {
  application: ApplicationDetailItem;
  resumes: BaseResumeOption[];
  allContacts: ContactOption[];
  conversations: ConversationListItem[];
}) {
  return (
    <div className="space-y-6">
      <ApplicationHeader application={application} />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="description">Job Description</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="notes">Notes {application.notes.length > 0 && `(${application.notes.length})`}</TabsTrigger>
          <TabsTrigger value="contacts">Contacts {application.applicationContacts.length > 0 && `(${application.applicationContacts.length})`}</TabsTrigger>
          <TabsTrigger value="interviews">Interviews {application.interviews.length > 0 && `(${application.interviews.length})`}</TabsTrigger>
          <TabsTrigger value="ai"><Sparkles className="mr-1 h-3 w-3" />AI Workspace</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="grid gap-6 py-2 sm:grid-cols-2">
              <div className="space-y-3">
                <Field label="Source" value={JOB_SOURCE_LABELS[application.source]} />
                <Field label="Work Mode" value={application.workMode ? WORK_MODE_LABELS[application.workMode] : undefined} />
                <Field label="Employment Type" value={application.employmentType ? EMPLOYMENT_TYPE_LABELS[application.employmentType] : undefined} />
                <Field label="Role Category" value={application.roleCategory ?? undefined} />
              </div>
              <div className="space-y-3">
                <Field label="Date Found" value={application.dateFound ? new Date(application.dateFound).toLocaleDateString() : undefined} />
                <Field label="Date Applied" value={application.dateApplied ? new Date(application.dateApplied).toLocaleDateString() : undefined} />
                <Field label="Deadline" value={application.deadline ? new Date(application.deadline).toLocaleDateString() : undefined} />
                <Field label="Skills" value={application.skills ?? undefined} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="description">
          <Card>
            <CardContent className="space-y-4 py-2">
              <DescriptionBlock title="Job Description" content={application.jobDescription} />
              <DescriptionBlock title="Requirements" content={application.requirements} />
              <DescriptionBlock title="Preferred Qualifications" content={application.preferredQualifications} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resume">
          <Card>
            <CardContent className="py-2">
              <ResumePanel
                applicationId={application.id}
                applicationResumes={application.applicationResumes}
                resumes={resumes}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardContent className="py-2">
              <NotesPanel applicationId={application.id} notes={application.notes} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardContent className="py-2">
              <ContactsPanel
                applicationId={application.id}
                applicationContacts={application.applicationContacts}
                allContacts={allContacts}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews">
          <Card>
            <CardContent className="py-2">
              <InterviewsPanel applicationId={application.id} interviews={application.interviews} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <AiWorkspace
            fixedApplicationId={application.id}
            initialResumeId={application.applicationResumes[0]?.resumeId}
            applications={[
              {
                id: application.id,
                company: application.company,
                jobTitle: application.jobTitle,
                jobDescription: application.jobDescription,
              },
            ]}
            resumes={resumes
              .filter((r) => r.extractedText)
              .map((r) => ({
                id: r.id,
                name: r.name,
                version: r.version,
                extractedText: r.extractedText,
                isBaseResume: r.isBaseResume,
              }))}
            conversations={conversations}
          />
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="py-2">
              {application.activityEvents.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {application.activityEvents.map((event) => (
                    <li key={event.id} className="flex items-start justify-between gap-2 border-b pb-3 last:border-0">
                      <span className="text-sm">{event.description}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || <span className="text-muted-foreground">Not specified</span>}</p>
    </div>
  );
}

function DescriptionBlock({ title, content }: { title: string; content: string | null }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {!content && <Badge variant="outline" className="text-[10px]">Not provided</Badge>}
      </div>
      {content ? (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{content}</p>
      ) : (
        <p className="text-sm text-muted-foreground">—</p>
      )}
    </div>
  );
}
