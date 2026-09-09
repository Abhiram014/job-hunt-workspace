"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Pencil, Trash2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "./status-badge";
import {
  ApplicationForm,
  toApplicationInput,
  type ApplicationFormValues,
} from "./application-form";
import { updateApplication, updateApplicationStatus, deleteApplication } from "@/app/actions/applications";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUSES } from "@/lib/constants";
import type { ApplicationStatus } from "@prisma/client";
import type { ApplicationDetailItem } from "@/types/application";

export function ApplicationHeader({ application }: { application: ApplicationDetailItem }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: string) {
    startTransition(async () => {
      try {
        await updateApplicationStatus(application.id, { applicationStatus: status as ApplicationStatus });
        toast.success("Status updated");
      } catch {
        toast.error("Couldn't update status");
      }
    });
  }

  async function handleEditSubmit(values: ApplicationFormValues) {
    try {
      await updateApplication(application.id, toApplicationInput(values));
      toast.success("Application updated");
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete the application for ${application.jobTitle} at ${application.company}? This can't be undone.`)) {
      return;
    }
    try {
      await deleteApplication(application.id);
      toast.success("Application deleted");
      router.push("/applications");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const initialValues: ApplicationFormValues = {
    company: application.company,
    jobTitle: application.jobTitle,
    jobURL: application.jobURL ?? "",
    location: application.location ?? "",
    workMode: application.workMode ?? "",
    employmentType: application.employmentType ?? "",
    salaryMin: application.salaryMin?.toString() ?? "",
    salaryMax: application.salaryMax?.toString() ?? "",
    salaryCurrency: application.salaryCurrency ?? "USD",
    jobDescription: application.jobDescription ?? "",
    requirements: application.requirements ?? "",
    preferredQualifications: application.preferredQualifications ?? "",
    skills: application.skills ?? "",
    roleCategory: application.roleCategory ?? "",
    deadline: application.deadline ? new Date(application.deadline).toISOString().slice(0, 10) : "",
  };

  return (
    <div className="space-y-3">
      <Link href="/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to Applications
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-semibold">
            {application.company.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight leading-tight">{application.jobTitle}</h1>
            <p className="text-muted-foreground">{application.company}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {application.location && <span>{application.location}</span>}
              {(application.salaryMin || application.salaryMax) && (
                <span>
                  {application.salaryCurrency ?? "USD"} {application.salaryMin?.toLocaleString()}
                  {application.salaryMax ? ` – ${application.salaryMax.toLocaleString()}` : ""}
                </span>
              )}
              {application.dateApplied && (
                <span>Applied {new Date(application.dateApplied).toLocaleDateString()}</span>
              )}
              {application.jobURL && (
                <a
                  href={application.jobURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                >
                  Job posting <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={application.applicationStatus} onValueChange={handleStatusChange} disabled={isPending}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setEditOpen(true)} title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleDelete} title="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StatusBadge status={application.applicationStatus} />
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
          </DialogHeader>
          <ApplicationForm initialValues={initialValues} submitLabel="Save Changes" onSubmit={handleEditSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
