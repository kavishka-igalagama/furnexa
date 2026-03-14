import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import {
  deleteRoomTemplate,
  updateRoomTemplate,
} from "@/lib/room-templates-store";
import { roomTemplateSchema } from "@/lib/room-templates-shared";

type Params = {
  params: Promise<{ recordId: string }>;
};

export async function PUT(req: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recordId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = roomTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const template = await updateRoomTemplate(recordId, parsed.data);
    return NextResponse.json({ template });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update template";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recordId } = await params;

  try {
    await deleteRoomTemplate(recordId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete template";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
