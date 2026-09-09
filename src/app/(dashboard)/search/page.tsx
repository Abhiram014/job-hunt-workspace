import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const userId = await requireUserId();
  const query = (q ?? "").trim();

  if (!query) {
    return (
      <div className="text-sm text-muted-foreground">Type something in the search bar above.</div>
    );
  }

  const [applications, notes, contacts, resumes] = await Promise.all([
    prisma.application.findMany({
      where: {
        userId,
        OR: [
          { company: { contains: query } },
          { jobTitle: { contains: query } },
          { jobDescription: { contains: query } },
          { location: { contains: query } },
        ],
      },
      take: 20,
    }),
    prisma.note.findMany({
      where: { userId, content: { contains: query } },
      include: { application: { select: { id: true, company: true, jobTitle: true } } },
      take: 20,
    }),
    prisma.contact.findMany({
      where: {
        userId,
        OR: [{ name: { contains: query } }, { company: { contains: query } }],
      },
      take: 20,
    }),
    prisma.resume.findMany({
      where: {
        userId,
        OR: [{ name: { contains: query } }, { extractedText: { contains: query } }, { tags: { contains: query } }],
      },
      take: 20,
    }),
  ]);

  const noResults =
    applications.length === 0 && notes.length === 0 && contacts.length === 0 && resumes.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Search results for &quot;{query}&quot;</h1>

      {noResults && <p className="text-sm text-muted-foreground">No matches found.</p>}

      {applications.length > 0 && (
        <ResultSection title="Applications">
          {applications.map((a) => (
            <Link key={a.id} href={`/applications/${a.id}`} className="block rounded-md p-2 hover:bg-muted">
              <p className="text-sm font-medium">{a.jobTitle} — {a.company}</p>
              {a.location && <p className="text-xs text-muted-foreground">{a.location}</p>}
            </Link>
          ))}
        </ResultSection>
      )}

      {notes.length > 0 && (
        <ResultSection title="Notes">
          {notes.map((n) => (
            <Link key={n.id} href={`/applications/${n.applicationId}`} className="block rounded-md p-2 hover:bg-muted">
              <p className="text-sm">{n.content.slice(0, 140)}</p>
              <p className="text-xs text-muted-foreground">{n.application.jobTitle} — {n.application.company}</p>
            </Link>
          ))}
        </ResultSection>
      )}

      {contacts.length > 0 && (
        <ResultSection title="Contacts">
          {contacts.map((c) => (
            <Link key={c.id} href="/contacts" className="block rounded-md p-2 hover:bg-muted">
              <p className="text-sm font-medium">{c.name}</p>
              {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
            </Link>
          ))}
        </ResultSection>
      )}

      {resumes.length > 0 && (
        <ResultSection title="Resumes">
          {resumes.map((r) => (
            <Link key={r.id} href="/resumes" className="block rounded-md p-2 hover:bg-muted">
              <p className="text-sm font-medium">{r.name} <span className="text-muted-foreground">v{r.version}</span></p>
            </Link>
          ))}
        </ResultSection>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">{children}</CardContent>
    </Card>
  );
}
