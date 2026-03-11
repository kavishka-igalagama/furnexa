import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

const roomSpecsSchema = z.object({
  width: z.number(),
  length: z.number(),
  wallColor: z.string(),
  floorColor: z.string(),
  floorType: z.enum(["tile", "carpet", "wood"]),
  ceilingColor: z.string().optional(),
});

const furnitureItemSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  x: z.number(),
  y: z.number(),
  z: z.number(),
  rotation: z.number(),
  scale: z.number(),
  color: z.string(),
  width: z.number().optional(),
  length: z.number().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  modelPath: z.string().optional(),
});

const designSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  roomSpecs: roomSpecsSchema,
  furnitureItems: z.array(furnitureItemSchema),
  theme: z
    .object({
      id: z.string(),
      label: z.string(),
      wallColor: z.string(),
      floorColor: z.string(),
      floorType: z.enum(["tile", "carpet", "wood"]),
      furnitureColor: z.string(),
      ceilingColor: z.string().optional(),
    })
    .nullable()
    .optional(),
  globalColors: z
    .object({
      walls: z.string().optional(),
      floor: z.string().optional(),
      ceiling: z.string().optional(),
      furniture: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === Role.ADMIN;
  const designs = await prisma.roomDesign.findMany({
    where: isAdmin ? undefined : { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ designs });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = designSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const design = await prisma.roomDesign.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name ?? "Untitled Design",
      roomSpecs: parsed.data.roomSpecs,
      furnitureItems: parsed.data.furnitureItems,
      theme: parsed.data.theme ?? null,
      globalColors: parsed.data.globalColors ?? null,
    },
  });

  return NextResponse.json({ design }, { status: 201 });
}
