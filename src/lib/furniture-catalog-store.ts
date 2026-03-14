import type { CatalogFurnitureItem } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  defaultFurnitureSeeds,
  managedFurnitureItemSchema,
  type ManagedFurnitureInput,
  type ManagedFurnitureItem,
} from "@/lib/furniture-catalog-shared";

const toManagedFurnitureItem = (
  item: CatalogFurnitureItem,
): ManagedFurnitureItem => ({
  recordId: item.id,
  id: item.slug,
  groupId: item.groupId,
  groupName: item.groupName,
  name: item.name,
  width: item.width,
  length: item.length,
  color: item.color,
  category: item.category,
  modelPath: item.modelPath,
  modelId: item.modelId ?? undefined,
});

export const ensureFurnitureCatalogSeeded = async () => {
  const count = await prisma.catalogFurnitureItem.count();
  if (count > 0) return;

  try {
    await prisma.catalogFurnitureItem.createMany({
      data: defaultFurnitureSeeds.map((item) => ({
        slug: item.id,
        groupId: item.groupId,
        groupName: item.groupName,
        groupOrder: item.groupOrder,
        itemOrder: item.itemOrder,
        name: item.name,
        width: item.width,
        length: item.length,
        color: item.color,
        category: item.category,
        modelPath: item.modelPath,
        modelId: item.modelId,
      })),
    });
  } catch {
    // Ignore concurrent seeding attempts.
  }
};

const removeDuplicateFurnitureCatalogItems = async () => {
  const items = await prisma.catalogFurnitureItem.findMany({
    orderBy: [{ groupOrder: "asc" }, { itemOrder: "asc" }, { createdAt: "asc" }],
  });

  const seen = new Set<string>();
  const duplicateIds: string[] = [];

  items.forEach((item) => {
    if (seen.has(item.slug)) {
      duplicateIds.push(item.id);
      return;
    }
    seen.add(item.slug);
  });

  if (duplicateIds.length > 0) {
    await prisma.catalogFurnitureItem.deleteMany({
      where: { id: { in: duplicateIds } },
    });
  }
};

export const listFurnitureCatalogItems = async () => {
  await ensureFurnitureCatalogSeeded();
  await removeDuplicateFurnitureCatalogItems();
  const items = await prisma.catalogFurnitureItem.findMany({
    orderBy: [{ groupOrder: "asc" }, { itemOrder: "asc" }, { createdAt: "asc" }],
  });
  return items.map(toManagedFurnitureItem);
};

const getGroupOrder = async (groupId: string) => {
  const existingGroup = await prisma.catalogFurnitureItem.findFirst({
    where: { groupId },
    orderBy: { groupOrder: "asc" },
  });
  if (existingGroup) return existingGroup.groupOrder;

  const lastGroup = await prisma.catalogFurnitureItem.findFirst({
    orderBy: { groupOrder: "desc" },
  });
  return (lastGroup?.groupOrder ?? -1) + 1;
};

const getItemOrder = async (groupId: string) => {
  const lastItem = await prisma.catalogFurnitureItem.findFirst({
    where: { groupId },
    orderBy: { itemOrder: "desc" },
  });
  return (lastItem?.itemOrder ?? -1) + 1;
};

export const createFurnitureCatalogItem = async (input: ManagedFurnitureInput) => {
  const data = managedFurnitureItemSchema.parse(input);
  const existing = await prisma.catalogFurnitureItem.findFirst({
    where: { slug: data.id },
  });
  if (existing) {
    throw new Error("A furniture item with this id already exists.");
  }
  const groupOrder = await getGroupOrder(data.groupId);
  const itemOrder = await getItemOrder(data.groupId);

  const item = await prisma.catalogFurnitureItem.create({
    data: {
      slug: data.id,
      groupId: data.groupId,
      groupName: data.groupName,
      groupOrder,
      itemOrder,
      name: data.name,
      width: data.width,
      length: data.length,
      color: data.color,
      category: data.category,
      modelPath: data.modelPath,
      modelId: data.modelId,
    },
  });

  return toManagedFurnitureItem(item);
};

export const updateFurnitureCatalogItem = async (
  recordId: string,
  input: ManagedFurnitureInput,
) => {
  const data = managedFurnitureItemSchema.parse(input);
  const current = await prisma.catalogFurnitureItem.findUniqueOrThrow({
    where: { id: recordId },
  });
  const conflicting = await prisma.catalogFurnitureItem.findFirst({
    where: {
      slug: data.id,
      NOT: { id: recordId },
    },
  });
  if (conflicting) {
    throw new Error("A furniture item with this id already exists.");
  }

  const nextGroupIdChanged = current.groupId !== data.groupId;
  const groupOrder = nextGroupIdChanged
    ? await getGroupOrder(data.groupId)
    : current.groupOrder;
  const itemOrder = nextGroupIdChanged
    ? await getItemOrder(data.groupId)
    : current.itemOrder;

  const item = await prisma.catalogFurnitureItem.update({
    where: { id: recordId },
    data: {
      slug: data.id,
      groupId: data.groupId,
      groupName: data.groupName,
      groupOrder,
      itemOrder,
      name: data.name,
      width: data.width,
      length: data.length,
      color: data.color,
      category: data.category,
      modelPath: data.modelPath,
      modelId: data.modelId,
    },
  });

  return toManagedFurnitureItem(item);
};

export const deleteFurnitureCatalogItem = async (recordId: string) => {
  await prisma.catalogFurnitureItem.delete({
    where: { id: recordId },
  });
};
