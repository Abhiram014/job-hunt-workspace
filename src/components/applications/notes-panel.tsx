"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Pin, PinOff, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { NOTE_CATEGORY_LABELS } from "@/lib/constants";
import type { Note, NoteCategory } from "@prisma/client";
import { createNote, updateNote, deleteNote } from "@/app/actions/notes";

export function NotesPanel({
  applicationId,
  notes,
}: {
  applicationId: string;
  notes: Note[];
}) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteCategory>("GENERAL");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd() {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await createNote({ applicationId, content: content.trim(), category });
      setContent("");
      setCategory("GENERAL");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePin(note: Note) {
    try {
      await updateNote(note.id, { pinned: !note.pinned });
    } catch {
      toast.error("Couldn't update note");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this note?")) return;
    try {
      await deleteNote(id);
    } catch {
      toast.error("Couldn't delete note");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border p-3">
        <Textarea
          placeholder='e.g. "Messaged recruiter on LinkedIn" or "Referral requested from John"'
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex items-center justify-between gap-2">
          <Select value={category} onValueChange={(v) => setCategory(v as NoteCategory)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(NOTE_CATEGORY_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAdd} disabled={submitting || !content.trim()}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Note
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{NOTE_CATEGORY_LABELS[note.category]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => togglePin(note)} title={note.pinned ? "Unpin" : "Pin"}>
                    {note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(note.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{note.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
