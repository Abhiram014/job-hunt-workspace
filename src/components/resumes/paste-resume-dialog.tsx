"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createResumeFromText } from "@/app/actions/resumes";

export function PasteResumeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [isBase, setIsBase] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !text.trim()) {
      toast.error("Name and resume content are required");
      return;
    }
    setSubmitting(true);
    try {
      await createResumeFromText({
        name: name.trim(),
        extractedText: text.trim(),
        tags: tags || null,
        isBaseResume: isBase,
      });
      toast.success("Resume created");
      onOpenChange(false);
      setName("");
      setText("");
      setTags("");
      setIsBase(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create resume");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New Resume from Text</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="paste-name">Name</Label>
            <Input id="paste-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Data Science — Base" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paste-tags">Tags (comma-separated)</Label>
            <Input id="paste-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paste-text">Resume content</Label>
            <Textarea id="paste-text" rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your resume text here..." />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="paste-is-base" checked={isBase} onCheckedChange={(v) => setIsBase(!!v)} />
            <Label htmlFor="paste-is-base" className="font-normal">Mark as a base resume</Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save Resume"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
