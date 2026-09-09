import type { Prisma, ContactType } from "@prisma/client";

export type ApplicationListItem = Prisma.ApplicationGetPayload<{
  include: {
    applicationResumes: {
      include: { resume: { select: { name: true; version: true } } };
    };
    _count: { select: { notes: true; interviews: true } };
  };
}>;

export type ResumeOption = { id: string; name: string; version: number };

export type ApplicationDetailItem = Prisma.ApplicationGetPayload<{
  include: {
    applicationResumes: {
      include: { resume: { select: { id: true; name: true; version: true; fileType: true } } };
    };
    notes: true;
    applicationContacts: { include: { contact: true } };
    interviews: true;
    activityEvents: true;
    followups: true;
  };
}>;

export type BaseResumeOption = {
  id: string;
  name: string;
  version: number;
  isBaseResume: boolean;
};

export type ContactOption = {
  id: string;
  name: string;
  company: string | null;
  contactType: ContactType;
};

export type ResumeListItem = Prisma.ResumeGetPayload<{
  include: {
    applicationResumes: {
      include: { application: { select: { id: true; company: true; jobTitle: true } } };
    };
    _count: { select: { applicationResumes: true } };
  };
}>;

export type ContactListItem = Prisma.ContactGetPayload<{
  include: {
    applicationContacts: {
      include: { application: { select: { id: true; company: true; jobTitle: true } } };
    };
  };
}>;
