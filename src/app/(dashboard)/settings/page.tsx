import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SignOutButton } from "@/components/settings/sign-out-button";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, createdAt: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Account</CardTitle>
          <CardDescription>
            {user?.email} · Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Name: <span className="text-foreground">{user?.name || "Not set"}</span>
          </p>
          <SignOutButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Environment</CardTitle>
          <CardDescription>
            AI features (Phase 2) require an ANTHROPIC_API_KEY in your .env file. File storage is currently local
            disk — swappable for Supabase Storage or S3 later via the StorageProvider interface.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
