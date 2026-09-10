import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation/auth";

// When SIGNUP_INVITE_CODE is set (recommended once this app is deployed
// somewhere reachable by strangers), registration requires it — otherwise
// anyone who finds the URL can create an account and start using the AI
// features on the deployer's Anthropic API key. Unset in local dev.
function stripBom(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function isValidInviteCode(provided: string | undefined): boolean {
  // Vercel's CLI (env add via piped stdin, on Windows at least) has been
  // observed to prepend a UTF-8 BOM to the stored value regardless of how
  // clean the input stream is — stripping it here is more reliable than
  // fighting that upstream, and is a harmless no-op for a clean value.
  const required = process.env.SIGNUP_INVITE_CODE ? stripBom(process.env.SIGNUP_INVITE_CODE) : "";
  if (!required) return true;
  if (!provided) return false;

  const a = Buffer.from(stripBom(provided));
  const b = Buffer.from(required);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, inviteCode } = parsed.data;

  if (!isValidInviteCode(inviteCode)) {
    return NextResponse.json(
      { error: "Invalid or missing invite code" },
      { status: 403 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
