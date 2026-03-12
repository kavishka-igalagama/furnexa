import Link from "next/link";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import TemplateAdminPanel from "@/components/admin/TemplateAdminPanel";

const AdminTemplatesPage = async () => {
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
            You need an admin account to manage room templates.
          </p>
          <Button asChild>
            <Link href="/design">Back to Designer</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <TemplateAdminPanel />;
};

export default AdminTemplatesPage;
