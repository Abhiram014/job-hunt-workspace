import { auth } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}

export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user.id;
}
