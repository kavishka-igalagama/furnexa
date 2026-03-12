import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth-validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

type CredentialsInput = Record<"email" | "password", string> | undefined;
type AuthRequestLike =
  | {
      headers?: Headers | Record<string, string | string[] | undefined>;
    }
  | null
  | undefined;

export const authorizeCredentials = async (
  credentials: CredentialsInput,
  req?: AuthRequestLike,
) => {
  if (!credentials?.email || !credentials?.password) return null;

  const email = normalizeEmail(credentials.email);
  const ip = getClientIp(req ?? null);
  const rate = checkRateLimit(`login:${ip}:${email}`, {
    windowMs: 10 * 60 * 1000,
    max: 10,
  });
  if (!rate.allowed) return null;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return null;

  const isValid = await bcrypt.compare(
    credentials.password,
    user.passwordHash,
  );

  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  jwt: { maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? Role.USER;
      }
      return session;
    },
  },
};
