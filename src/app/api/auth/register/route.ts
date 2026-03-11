import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { registerSchema } from "@/lib/auth-validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

const REGISTER_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 };

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(`register:${ip}`, REGISTER_LIMIT);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: Role.USER,
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
