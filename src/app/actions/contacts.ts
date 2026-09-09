"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { logActivity } from "@/lib/services/activity-service";
import { contactInputSchema, contactUpdateSchema } from "@/lib/validation/contact";

export async function createContact(input: unknown) {
  const userId = await requireUserId();
  const { applicationId, ...data } = contactInputSchema.parse(input);

  if (applicationId) {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId },
    });
    if (!application) throw new Error("Application not found");
  }

  const contact = await prisma.contact.create({
    data: {
      ...data,
      userId,
      ...(applicationId
        ? { applicationContacts: { create: { applicationId } } }
        : {}),
    },
  });

  if (applicationId) {
    await logActivity({
      userId,
      type: contact.contactType === "REFERRAL" ? "REFERRAL_REQUESTED" : "CONTACT_ADDED",
      description: `Added ${contact.name} as a ${contact.contactType.toLowerCase().replace("_", " ")}`,
      applicationId,
    });
    revalidatePath(`/applications/${applicationId}`);
  }

  revalidatePath("/contacts");
  return contact;
}

export async function updateContact(id: string, input: unknown) {
  const userId = await requireUserId();
  const data = contactUpdateSchema.parse(input);

  const existing = await prisma.contact.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Contact not found");

  const contact = await prisma.contact.update({ where: { id }, data });
  revalidatePath("/contacts");
  return contact;
}

export async function deleteContact(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.contact.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Contact not found");

  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
}

export async function linkContactToApplication(contactId: string, applicationId: string) {
  const userId = await requireUserId();
  const [contact, application] = await Promise.all([
    prisma.contact.findFirst({ where: { id: contactId, userId } }),
    prisma.application.findFirst({ where: { id: applicationId, userId } }),
  ]);
  if (!contact) throw new Error("Contact not found");
  if (!application) throw new Error("Application not found");

  await prisma.applicationContact.upsert({
    where: { applicationId_contactId: { applicationId, contactId } },
    create: { applicationId, contactId },
    update: {},
  });

  revalidatePath(`/applications/${applicationId}`);
}

export async function unlinkContactFromApplication(applicationContactId: string) {
  const userId = await requireUserId();
  const link = await prisma.applicationContact.findFirst({
    where: { id: applicationContactId, application: { userId } },
  });
  if (!link) throw new Error("Link not found");

  await prisma.applicationContact.delete({ where: { id: applicationContactId } });
  revalidatePath(`/applications/${link.applicationId}`);
}
