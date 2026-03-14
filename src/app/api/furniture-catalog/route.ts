import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import {
  createFurnitureCatalogItem,
  listFurnitureCatalogItems,
} from "@/lib/furniture-catalog-store";
import {
  defaultManagedFurnitureItems,
  managedFurnitureItemSchema,
} from "@/lib/furniture-catalog-shared";

export async function GET() {
  try {
    const items = await listFurnitureCatalogItems();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: defaultManagedFurnitureItems });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = managedFurnitureItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const item = await createFurnitureCatalogItem(parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create furniture item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
