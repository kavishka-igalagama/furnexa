import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";

export const getAdminSession = async () => {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== Role.ADMIN) {
    return null;
  }
  return session;
};
