"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WORK_MODE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
} from "@/lib/constants";
import type { WorkMode, EmploymentType } from "@prisma/client";

export interface ApplicationFormValues {
  company: string;
  jobTitle: string;
  jobURL: string;
  location: string;
  workMode: WorkMode | "";
  employmentType: EmploymentType | "";
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  jobDescription: string;
  requirements: string;
  preferredQualifications: string;
  skills: string;
  roleCategory: string;
  deadline: string;
}

export const EMPTY_APPLICATION_FORM: ApplicationFormValues = {
  company: "",
  jobTitle: "",
  jobURL: "",
  location: "",
  workMode: "",
  employmentType: "",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "USD",
  jobDescription: "",
  requirements: "",
  preferredQualifications: "",
  skills: "",
  roleCategory: "",
  deadline: "",
};

export function toApplicationInput(values: ApplicationFormValues) {
  return {
    company: values.company,
    jobTitle: values.jobTitle,
    jobURL: values.jobURL || null,
    location: values.location || null,
    workMode: values.workMode || null,
    employmentType: values.employmentType || null,
    salaryMin: values.salaryMin ? parseInt(values.salaryMin, 10) : null,
    salaryMax: values.salaryMax ? parseInt(values.salaryMax, 10) : null,
    salaryCurrency: values.salaryCurrency || null,
    jobDescription: values.jobDescription || null,
    requirements: values.requirements || null,
    preferredQualifications: values.preferredQualifications || null,
    skills: values.skills || null,
    roleCategory: values.roleCategory || null,
    deadline: values.deadline || null,
  };
}

export function ApplicationForm({
  initialValues,
  submitLabel,
  onSubmit,
  submitting,
}: {
  initialValues: ApplicationFormValues;
  submitLabel: string;
  onSubmit: (values: ApplicationFormValues) => void | Promise<void>;
  submitting?: boolean;
}) {
  const [values, setValues] = useState<ApplicationFormValues>(initialValues);

  function set<K extends keyof ApplicationFormValues>(key: K, val: ApplicationFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="company">Company *</Label>
          <Input id="company" required value={values.company} onChange={(e) => set("company", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jobTitle">Job Title *</Label>
          <Input id="jobTitle" required value={values.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="jobURL">Job URL</Label>
          <Input id="jobURL" type="url" value={values.jobURL} onChange={(e) => set("jobURL", e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={values.location} onChange={(e) => set("location", e.target.value)} placeholder="City, State" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="roleCategory">Role Category</Label>
          <Input id="roleCategory" value={values.roleCategory} onChange={(e) => set("roleCategory", e.target.value)} placeholder="e.g. Software Engineer" />
        </div>
        <div className="space-y-1.5">
          <Label>Work Mode</Label>
          <Select value={values.workMode || "UNSET"} onValueChange={(v) => set("workMode", v === "UNSET" ? "" : (v as WorkMode))}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="UNSET">Not specified</SelectItem>
              {Object.entries(WORK_MODE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Employment Type</Label>
          <Select value={values.employmentType || "UNSET"} onValueChange={(v) => set("employmentType", v === "UNSET" ? "" : (v as EmploymentType))}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="UNSET">Not specified</SelectItem>
              {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="salaryMin">Salary Min</Label>
          <Input id="salaryMin" type="number" value={values.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="salaryMax">Salary Max</Label>
          <Input id="salaryMax" type="number" value={values.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deadline">Application Deadline</Label>
          <Input id="deadline" type="date" value={values.deadline} onChange={(e) => set("deadline", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="skills">Skills (comma-separated)</Label>
          <Input id="skills" value={values.skills} onChange={(e) => set("skills", e.target.value)} placeholder="Python, SQL, AWS" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="jobDescription">Job Description</Label>
        <Textarea id="jobDescription" rows={8} value={values.jobDescription} onChange={(e) => set("jobDescription", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="requirements">Requirements</Label>
          <Textarea id="requirements" rows={5} value={values.requirements} onChange={(e) => set("requirements", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preferredQualifications">Preferred Qualifications</Label>
          <Textarea id="preferredQualifications" rows={5} value={values.preferredQualifications} onChange={(e) => set("preferredQualifications", e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
