import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import {
  deleteFurnitureCatalogItem,
  updateFurnitureCatalogItem,
} from "@/lib/furniture-catalog-store";
import { managedFurnitureItemSchema } from "@/lib/furniture-catalog-shared";

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
  const parsed = managedFurnitureItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const item = await updateFurnitureCatalogItem(recordId, parsed.data);
    return NextResponse.json({ item });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update furniture item";
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
    await deleteFurnitureCatalogItem(recordId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete furniture item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
