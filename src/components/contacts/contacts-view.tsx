"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, UserPlus, Mail, Link2, Trash2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CONTACT_TYPE_LABELS } from "@/lib/constants";
import type { ContactType } from "@prisma/client";
import type { ContactListItem } from "@/types/application";
import { createContact, updateContact, deleteContact } from "@/app/actions/contacts";

export function ContactsView({ contacts }: { contacts: ContactListItem[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContactType | "ALL">("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContactListItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (typeFilter !== "ALL" && c.contactType !== typeFilter) return false;
      if (q && !`${c.name} ${c.company ?? ""} ${c.jobTitle ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [contacts, search, typeFilter]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this contact?")) return;
    try {
      await deleteContact(id);
      toast.success("Contact deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {contacts.length} contact{contacts.length === 1 ? "" : "s"} — recruiters, referrals, and more
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <UserPlus className="mr-1.5 h-4 w-4" /> Add Contact
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search contacts..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ContactType | "ALL")}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {Object.entries(CONTACT_TYPE_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          No contacts yet. Add recruiters, referrals, or alumni you&apos;re in touch with.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-2 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.jobTitle ? `${c.jobTitle} · ` : ""}{c.company ?? ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(c); setDialogOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">{CONTACT_TYPE_LABELS[c.contactType]}</Badge>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                      <Mail className="h-3 w-3" /> Email
                    </a>
                  )}
                  {c.linkedinURL && (
                    <a href={c.linkedinURL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                      <Link2 className="h-3 w-3" /> LinkedIn
                    </a>
                  )}
                </div>
                {c.applicationContacts.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {c.applicationContacts.map((ac) => (
                      <Link key={ac.id} href={`/applications/${ac.application.id}`} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                        {ac.application.company}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ContactDialog open={dialogOpen} onOpenChange={setDialogOpen} contact={editing} />
    </div>
  );
}

function ContactDialog({
  open,
  onOpenChange,
  contact,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactListItem | null;
}) {
  const [name, setName] = useState(contact?.name ?? "");
  const [company, setCompany] = useState(contact?.company ?? "");
  const [jobTitle, setJobTitle] = useState(contact?.jobTitle ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [linkedinURL, setLinkedinURL] = useState(contact?.linkedinURL ?? "");
  const [contactType, setContactType] = useState<ContactType>(contact?.contactType ?? "OTHER");
  const [submitting, setSubmitting] = useState(false);

  // Reset local state whenever the dialog opens for a different contact.
  const [lastId, setLastId] = useState(contact?.id ?? null);
  if (open && contact?.id !== lastId) {
    setLastId(contact?.id ?? null);
    setName(contact?.name ?? "");
    setCompany(contact?.company ?? "");
    setJobTitle(contact?.jobTitle ?? "");
    setEmail(contact?.email ?? "");
    setLinkedinURL(contact?.linkedinURL ?? "");
    setContactType(contact?.contactType ?? "OTHER");
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        company: company || null,
        jobTitle: jobTitle || null,
        email: email || null,
        linkedinURL: linkedinURL || null,
        contactType,
      };
      if (contact) {
        await updateContact(contact.id, data);
        toast.success("Contact updated");
      } else {
        await createContact(data);
        toast.success("Contact added");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save contact");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Contact" : "Add Contact"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Name *</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-company">Company</Label>
              <Input id="c-company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-title">Job Title</Label>
              <Input id="c-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Contact Type</Label>
            <Select value={contactType} onValueChange={(v) => setContactType(v as ContactType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CONTACT_TYPE_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-email">Email</Label>
            <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-linkedin">LinkedIn URL</Label>
            <Input id="c-linkedin" value={linkedinURL} onChange={(e) => setLinkedinURL(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : contact ? "Save Changes" : "Add Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
