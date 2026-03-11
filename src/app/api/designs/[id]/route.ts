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

const canAccess = (userId: string, ownerId: string, isAdmin: boolean) => {
  return isAdmin || userId === ownerId;
};

const isValidObjectId = (value: string) => /^[a-f0-9]{24}$/i.test(value);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid design id" }, { status: 400 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let design;
  try {
    design = await prisma.roomDesign.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to load design", error);
    return NextResponse.json(
      { error: "Failed to load design" },
      { status: 500 },
    );
  }

  if (!design) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === Role.ADMIN;
  if (!canAccess(session.user.id, design.userId, isAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ design });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid design id" }, { status: 400 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let design;
  try {
    design = await prisma.roomDesign.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to load design", error);
    return NextResponse.json(
      { error: "Failed to load design" },
      { status: 500 },
    );
  }

  if (!design) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === Role.ADMIN;
  if (!canAccess(session.user.id, design.userId, isAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = designSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let updated;
  try {
    updated = await prisma.roomDesign.update({
      where: { id },
      data: {
        name: parsed.data.name ?? design.name,
        roomSpecs: parsed.data.roomSpecs,
        furnitureItems: parsed.data.furnitureItems,
        theme: parsed.data.theme ?? null,
        globalColors: parsed.data.globalColors ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to update design", error);
    return NextResponse.json(
      { error: "Failed to update design" },
      { status: 500 },
    );
  }

  return NextResponse.json({ design: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid design id" }, { status: 400 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let design;
  try {
    design = await prisma.roomDesign.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to load design", error);
    return NextResponse.json(
      { error: "Failed to load design" },
      { status: 500 },
    );
  }

  if (!design) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === Role.ADMIN;
  if (!canAccess(session.user.id, design.userId, isAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.roomDesign.delete({ where: { id } });
  } catch (error) {
    console.error("Failed to delete design", error);
    return NextResponse.json(
      { error: "Failed to delete design" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
