"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, ClipboardPaste, PencilLine, Loader2 } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  ApplicationForm,
  EMPTY_APPLICATION_FORM,
  toApplicationInput,
  type ApplicationFormValues,
} from "@/components/applications/application-form";
import { createApplication } from "@/app/actions/applications";
import { promoteJobImport } from "@/app/actions/job-import";
import type { ExtractedJob } from "@/lib/extractors/types";

function extractedToFormValues(job: ExtractedJob): ApplicationFormValues {
  return {
    ...EMPTY_APPLICATION_FORM,
    company: job.company ?? "",
    jobTitle: job.jobTitle ?? "",
    location: job.location ?? "",
    workMode: job.workMode ?? "",
    employmentType: job.employmentType ?? "",
    salaryMin: job.salaryMin?.toString() ?? "",
    salaryMax: job.salaryMax?.toString() ?? "",
    salaryCurrency: job.salaryCurrency ?? "USD",
    jobDescription: job.jobDescription ?? "",
  };
}

export default function NewApplicationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // URL import state
  const [url, setUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlImport, setUrlImport] = useState<{
    jobImportId: string;
    values: ApplicationFormValues;
    jobURL: string;
    source: "GREENHOUSE" | "LEVER" | "ASHBY" | "OTHER";
  } | null>(null);

  // Paste JD state
  const [jdText, setJdText] = useState("");
  const [jdLoading, setJdLoading] = useState(false);
  const [jdImport, setJdImport] = useState<{ jobImportId: string; values: ApplicationFormValues } | null>(null);

  async function handleUrlExtract() {
    if (!url.trim()) return;
    setUrlLoading(true);
    setUrlImport(null);
    try {
      const res = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't extract this job posting. Try pasting the description instead.");
        return;
      }
      const source = data.extractedJob?.source;
      setUrlImport({
        jobImportId: data.jobImport.id,
        values: extractedToFormValues(data.extractedJob),
        jobURL: url.trim(),
        source: ["GREENHOUSE", "LEVER", "ASHBY"].includes(source) ? source : "OTHER",
      });
      toast.success("Extracted job details — review and edit before saving.");
    } catch {
      toast.error("Couldn't reach the job posting page.");
    } finally {
      setUrlLoading(false);
    }
  }

  async function handleJdExtract() {
    if (!jdText.trim()) return;
    setJdLoading(true);
    setJdImport(null);
    try {
      const res = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: jdText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't parse this job description.");
        return;
      }
      setJdImport({
        jobImportId: data.jobImport.id,
        values: extractedToFormValues(data.extractedJob),
      });
      toast.success("Parsed what we could find — review and fill in the rest.");
    } catch {
      toast.error("Something went wrong parsing the description.");
    } finally {
      setJdLoading(false);
    }
  }

  async function handlePromote(
    jobImportId: string,
    values: ApplicationFormValues,
    source: "GREENHOUSE" | "LEVER" | "ASHBY" | "OTHER",
    jobURL?: string
  ) {
    setSubmitting(true);
    try {
      const input = toApplicationInput(values);
      const application = await promoteJobImport(jobImportId, {
        ...input,
        jobURL: input.jobURL ?? jobURL ?? null,
        source,
      });
      toast.success("Application saved.");
      router.push(`/applications/${application.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save application");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleManualSubmit(values: ApplicationFormValues) {
    setSubmitting(true);
    try {
      const application = await createApplication({
        ...toApplicationInput(values),
        source: "MANUAL",
      });
      toast.success("Application saved.");
      router.push(`/applications/${application.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save application");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">New Application</h1>
        <p className="text-sm text-muted-foreground">
          Import from a job posting URL, paste a job description, or enter details manually.
        </p>
      </div>

      <Tabs defaultValue="url">
        <TabsList>
          <TabsTrigger value="url"><Link2 className="mr-1.5 h-3.5 w-3.5" />From URL</TabsTrigger>
          <TabsTrigger value="paste"><ClipboardPaste className="mr-1.5 h-3.5 w-3.5" />Paste Description</TabsTrigger>
          <TabsTrigger value="manual"><PencilLine className="mr-1.5 h-3.5 w-3.5" />Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Paste a job posting URL</CardTitle>
              <CardDescription>
                Works best with Greenhouse, Lever, and Ashby postings. Other sites (LinkedIn, Workday, Indeed) often
                render with JavaScript and may only yield partial results — review carefully before saving.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                placeholder="https://boards.greenhouse.io/company/jobs/12345"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlExtract()}
              />
              <Button onClick={handleUrlExtract} disabled={urlLoading || !url.trim()}>
                {urlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Extract"}
              </Button>
            </CardContent>
          </Card>

          {urlImport && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Review extracted details</CardTitle>
                <CardDescription>Edit anything that looks wrong before saving.</CardDescription>
              </CardHeader>
              <CardContent>
                <ApplicationForm
                  initialValues={urlImport.values}
                  submitLabel="Save Application"
                  submitting={submitting}
                  onSubmit={(values) =>
                    handlePromote(urlImport.jobImportId, values, urlImport.source, urlImport.jobURL)
                  }
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paste" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Paste the full job description</CardTitle>
              <CardDescription>
                We&apos;ll pull out what we can (title, location, salary range) using simple heuristics.
                Full AI-powered parsing arrives in Phase 2 — review the results either way.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={10}
                placeholder="Paste the complete job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
              <Button onClick={handleJdExtract} disabled={jdLoading || !jdText.trim()}>
                {jdLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Parse Description"}
              </Button>
            </CardContent>
          </Card>

          {jdImport && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Review extracted details</CardTitle>
                <CardDescription>Edit anything that looks wrong before saving.</CardDescription>
              </CardHeader>
              <CardContent>
                <ApplicationForm
                  initialValues={jdImport.values}
                  submitLabel="Save Application"
                  submitting={submitting}
                  onSubmit={(values) => handlePromote(jdImport.jobImportId, values, "OTHER")}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Enter job details</CardTitle>
            </CardHeader>
            <CardContent>
              <ApplicationForm
                initialValues={EMPTY_APPLICATION_FORM}
                submitLabel="Save Application"
                submitting={submitting}
                onSubmit={handleManualSubmit}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
