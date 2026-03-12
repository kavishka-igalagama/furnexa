import Link from "next/link";
import { getServerSession } from "next-auth";
import { LayoutTemplate, Package2 } from "lucide-react";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const AdminPage = async () => {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === Role.ADMIN;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Access denied
          </h1>
          <p className="text-sm text-muted-foreground">
            You need an admin account to view the admin dashboard.
          </p>
          <Button asChild>
            <Link href="/design">Back to Designer</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">
              Admin Dashboard
            </p>
            <h1 className="text-xl font-display font-semibold text-foreground">
              Furnexa Admin
            </h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/design">Open Designer</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/furniture"
            className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-soft hover:border-accent/50 transition-colors"
          >
            <Package2 className="w-8 h-8 text-accent mb-4" />
            <h2 className="text-lg font-display font-semibold text-foreground">
              Furniture Management
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create, edit, and delete furniture items used by both the 2D and 3D designer.
            </p>
          </Link>

          <Link
            href="/admin/templates"
            className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-soft hover:border-accent/50 transition-colors"
          >
            <LayoutTemplate className="w-8 h-8 text-accent mb-4" />
            <h2 className="text-lg font-display font-semibold text-foreground">
              Template Management
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage starter room templates, dimensions, colors, and default furniture layouts.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
