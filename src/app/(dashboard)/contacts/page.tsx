import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { ContactsView } from "@/components/contacts/contacts-view";

export default async function ContactsPage() {
  const userId = await requireUserId();

  const contacts = await prisma.contact.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      applicationContacts: {
        include: { application: { select: { id: true, company: true, jobTitle: true } } },
      },
    },
  });

  return <ContactsView contacts={contacts} />;
}
