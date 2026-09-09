"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_TYPE_LABELS } from "@/lib/constants";
import type { ContactType } from "@prisma/client";
import type { ApplicationDetailItem, ContactOption } from "@/types/application";
import { createContact, unlinkContactFromApplication, linkContactToApplication } from "@/app/actions/contacts";

export function ContactsPanel({
  applicationId,
  applicationContacts,
  allContacts,
}: {
  applicationId: string;
  applicationContacts: ApplicationDetailItem["applicationContacts"];
  allContacts: ContactOption[];
}) {
  const [existingId, setExistingId] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ContactType>("RECRUITER");
  const [submitting, setSubmitting] = useState(false);

  const linkedIds = new Set(applicationContacts.map((ac) => ac.contactId));
  const availableExisting = allContacts.filter((c) => !linkedIds.has(c.id));

  async function handleLinkExisting() {
    if (!existingId) return;
    setSubmitting(true);
    try {
      await linkContactToApplication(existingId, applicationId);
      setExistingId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link contact");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateNew() {
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await createContact({ name: newName.trim(), contactType: newType, applicationId });
      setNewName("");
      toast.success("Contact added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnlink(id: string) {
    try {
      await unlinkContactFromApplication(id);
    } catch {
      toast.error("Couldn't remove contact");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border p-3">
        <p className="text-xs font-medium text-muted-foreground">Add a new contact</p>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 min-w-40" />
          <Select value={newType} onValueChange={(v) => setNewType(v as ContactType)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CONTACT_TYPE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleCreateNew} disabled={submitting || !newName.trim()}>
            <UserPlus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {availableExisting.length > 0 && (
          <>
            <p className="pt-1 text-xs font-medium text-muted-foreground">Or link an existing contact</p>
            <div className="flex gap-2">
              <Select value={existingId} onValueChange={setExistingId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select a contact..." /></SelectTrigger>
                <SelectContent>
                  {availableExisting.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.company ? ` — ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={handleLinkExisting} disabled={!existingId || submitting}>
                Link
              </Button>
            </div>
          </>
        )}
      </div>

      {applicationContacts.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No contacts linked yet.</p>
      ) : (
        <ul className="space-y-2">
          {applicationContacts.map((ac) => (
            <li key={ac.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{ac.contact.name}</p>
                <p className="text-xs text-muted-foreground">
                  {CONTACT_TYPE_LABELS[ac.contact.contactType]}
                  {ac.contact.company ? ` · ${ac.contact.company}` : ""}
                  {ac.contact.jobTitle ? ` · ${ac.contact.jobTitle}` : ""}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUnlink(ac.id)} title="Remove">
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
