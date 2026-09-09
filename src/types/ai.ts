import type { Prisma } from "@prisma/client";

export type ConversationListItem = Prisma.ConversationGetPayload<{
  include: {
    application: { select: { id: true; company: true; jobTitle: true } };
    resume: { select: { id: true; name: true; version: true } };
    _count: { select: { messages: true } };
  };
}>;

export type ConversationWithMessages = Prisma.ConversationGetPayload<{
  include: {
    messages: true;
    application: { select: { id: true; company: true; jobTitle: true } };
    resume: { select: { id: true; name: true; version: true } };
  };
}>;

export type ApplicationOption = {
  id: string;
  company: string;
  jobTitle: string;
  jobDescription: string | null;
};

export type ResumeOptionForAI = {
  id: string;
  name: string;
  version: number;
  extractedText: string | null;
  isBaseResume: boolean;
};
