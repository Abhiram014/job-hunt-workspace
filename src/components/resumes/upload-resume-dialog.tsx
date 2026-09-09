"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { uploadResume } from "@/app/actions/resumes";

export function UploadResumeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [isBase, setIsBase] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file first");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("name", name || file.name);
      formData.set("tags", tags);
      formData.set("isBaseResume", String(isBase));
      await uploadResume(formData);
      toast.success("Resume uploaded");
      onOpenChange(false);
      setName("");
      setTags("");
      setIsBase(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Resume</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="resume-file">File (PDF, DOCX, or TXT — max 10MB)</Label>
            <Input id="resume-file" type="file" ref={fileRef} accept=".pdf,.docx,.txt" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resume-name">Name</Label>
            <Input id="resume-name" placeholder="e.g. Software Engineer — Base" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resume-tags">Tags (comma-separated)</Label>
            <Input id="resume-tags" placeholder="backend, ML, general" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="is-base" checked={isBase} onCheckedChange={(v) => setIsBase(!!v)} />
            <Label htmlFor="is-base" className="font-normal">Mark as a base resume</Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
