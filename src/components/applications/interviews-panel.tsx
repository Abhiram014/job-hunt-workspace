"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  INTERVIEW_STAGE_LABELS,
  INTERVIEW_RESULT_LABELS,
} from "@/lib/constants";
import type { Interview, InterviewStage, InterviewResult } from "@prisma/client";
import { createInterview, updateInterview, deleteInterview } from "@/app/actions/interviews";

export function InterviewsPanel({
  applicationId,
  interviews,
}: {
  applicationId: string;
  interviews: Interview[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [stage, setStage] = useState<InterviewStage>("RECRUITER_SCREEN");
  const [scheduledAt, setScheduledAt] = useState("");
  const [interviewer, setInterviewer] = useState("");
  const [meetingURL, setMeetingURL] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd() {
    setSubmitting(true);
    try {
      await createInterview({
        applicationId,
        stage,
        scheduledAt: scheduledAt || null,
        interviewer: interviewer || null,
        meetingURL: meetingURL || null,
        notes: notes || null,
      });
      setStage("RECRUITER_SCREEN");
      setScheduledAt("");
      setInterviewer("");
      setMeetingURL("");
      setNotes("");
      setShowForm(false);
      toast.success("Interview added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add interview");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResultChange(id: string, result: InterviewResult) {
    try {
      await updateInterview(id, { result });
    } catch {
      toast.error("Couldn't update result");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this interview?")) return;
    try {
      await deleteInterview(id);
    } catch {
      toast.error("Couldn't delete interview");
    }
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Interview
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={stage} onValueChange={(v) => setStage(v as InterviewStage)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(INTERVIEW_STAGE_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            <Input placeholder="Interviewer name" value={interviewer} onChange={(e) => setInterviewer(e.target.value)} />
            <Input placeholder="Meeting URL" value={meetingURL} onChange={(e) => setMeetingURL(e.target.value)} />
          </div>
          <Textarea placeholder="Notes, questions asked, prep..." rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={submitting}>Save Interview</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {interviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No interviews recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {interviews.map((iv) => (
            <li key={iv.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{INTERVIEW_STAGE_LABELS[iv.stage]}</span>
                    {iv.scheduledAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(iv.scheduledAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {iv.interviewer && <p className="text-xs text-muted-foreground">with {iv.interviewer}</p>}
                  {iv.meetingURL && (
                    <a href={iv.meetingURL} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Video className="h-3 w-3" /> Meeting link
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={iv.result} onValueChange={(v) => handleResultChange(iv.id, v as InterviewResult)}>
                    <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(INTERVIEW_RESULT_LABELS).map(([k, label]) => (
                        <SelectItem key={k} value={k}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(iv.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {iv.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{iv.notes}</p>}
              {iv.followUpRequired && <Badge variant="outline" className="mt-2 text-[10px]">Follow-up required</Badge>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
