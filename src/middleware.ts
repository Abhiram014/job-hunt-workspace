import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Uses the edge-safe base config directly (no Prisma/bcrypt) since
// middleware runs on Vercel's Edge runtime with a strict bundle size limit.
// This only checks for a valid session JWT — actual credential
// verification happens in the Node.js runtime via lib/auth.ts.
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/register"];

export default auth((req) => {
  const { nextUrl } = req;
  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

  if (isApiAuth || isPublic) return NextResponse.next();

  if (!req.auth) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
