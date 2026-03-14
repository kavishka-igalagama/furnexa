import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import {
  createRoomTemplate,
  listRoomTemplates,
} from "@/lib/room-templates-store";
import {
  defaultRoomTemplates,
  roomTemplateSchema,
} from "@/lib/room-templates-shared";

export async function GET() {
  try {
    const templates = await listRoomTemplates();
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ templates: defaultRoomTemplates });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = roomTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const template = await createRoomTemplate(parsed.data);
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create template";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
