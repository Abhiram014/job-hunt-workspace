import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { importJobFromUrl } from "@/lib/extractors";
import { extractFromPastedText } from "@/lib/extractors/paste-heuristic";

// Designed to also serve the future browser extension flow: it POSTs
// { url, pageTitle, rawText } scraped client-side, this creates a draft
// JobImport for the user to review inside the app (see spec section 17).
const bodySchema = z.object({
  url: z.string().url().max(2000).optional(),
  rawText: z.string().max(50000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success || (!parsed.data.url && !parsed.data.rawText)) {
    return NextResponse.json(
      { error: "Provide either a job URL or pasted job description text" },
      { status: 400 }
    );
  }

  const { url, rawText } = parsed.data;

  if (url) {
    try {
      const { extractedJob, extractorUsed, rawHTML, lowConfidence } = await importJobFromUrl(url);
      const jobImport = await prisma.jobImport.create({
        data: {
          userId,
          sourceURL: url,
          rawHTML,
          extractedJSON: JSON.stringify(extractedJob),
          extractorUsed,
          status: "EXTRACTED",
        },
      });
      return NextResponse.json({ jobImport, extractedJob, lowConfidence });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to import job";
      const jobImport = await prisma.jobImport.create({
        data: {
          userId,
          sourceURL: url,
          status: "FAILED",
          errorMessage: message,
        },
      });
      return NextResponse.json(
        { error: message, jobImport },
        { status: 422 }
      );
    }
  }

  // rawText path: paste-a-JD flow.
  const extractedJob = extractFromPastedText(rawText!);
  const jobImport = await prisma.jobImport.create({
    data: {
      userId,
      rawText,
      extractedJSON: JSON.stringify(extractedJob),
      extractorUsed: "paste-heuristic",
      status: "EXTRACTED",
    },
  });
  return NextResponse.json({ jobImport, extractedJob });
}
