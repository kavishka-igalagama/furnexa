import { z } from "zod";
import {
  furnitureCatalog,
  type CatalogItem,
  type FurnitureSubtype,
} from "@/components/design/FurnitureCatalog";

export type ManagedFurnitureItem = {
  recordId?: string;
  id: string;
  groupId: string;
  groupName: string;
  name: string;
  width: number;
  length: number;
  color: string;
  category: string;
  modelPath: string;
  modelId?: string;
};

export type ManagedFurnitureSeed = ManagedFurnitureItem & {
  groupOrder: number;
  itemOrder: number;
};

export const managedFurnitureItemSchema = z.object({
  id: z.string().min(1).max(120),
  groupId: z.string().min(1).max(120),
  groupName: z.string().min(1).max(120),
  name: z.string().min(1).max(160),
  width: z.number().positive(),
  length: z.number().positive(),
  color: z.string().min(4).max(20),
  category: z.string().min(1).max(120),
  modelPath: z.string().min(1).max(255),
  modelId: z.string().max(120).optional(),
});

export type ManagedFurnitureInput = z.infer<typeof managedFurnitureItemSchema>;

export const buildManagedFromCatalog = (
  catalog: CatalogItem[],
): ManagedFurnitureItem[] => {
  const items: ManagedFurnitureItem[] = [];

  catalog.forEach((group) => {
    const groupId = group.id;
    const groupName = group.name;
    if (group.subtypes && group.subtypes.length > 0) {
      group.subtypes.forEach((sub) => {
        items.push({
          id: sub.id,
          groupId,
          groupName,
          name: sub.name,
          width: sub.width,
          length: sub.length,
          color: sub.color,
          category: sub.category,
          modelPath: sub.models?.[0]?.path ?? "",
          modelId: sub.models?.[0]?.id,
        });
      });
      return;
    }

    const modelPath = group.models?.[0]?.path ?? "";
    items.push({
      id: group.id,
      groupId,
      groupName,
      name: group.name,
      width: group.width ?? 5,
      length: group.length ?? 5,
      color: group.color ?? "#888888",
      category: group.category ?? "General",
      modelPath,
      modelId: group.models?.[0]?.id,
    });
  });

  return items;
};

export const buildCatalogFromManaged = (
  items: ManagedFurnitureItem[],
): CatalogItem[] => {
  const groups = new Map<string, { name: string; items: ManagedFurnitureItem[] }>();

  items.forEach((item) => {
    const existing = groups.get(item.groupId);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(item.groupId, { name: item.groupName, items: [item] });
    }
  });

  return Array.from(groups.entries()).map(([groupId, group]) => ({
    id: groupId,
    name: group.name,
    subtypes: group.items.map(
      (item): FurnitureSubtype => ({
        id: item.id,
        name: item.name,
        width: item.width,
        length: item.length,
        color: item.color,
        category: item.category,
        models: [
          {
            id: item.modelId ?? `${item.id}-model`,
            name: item.name,
            path: item.modelPath,
          },
        ],
      }),
    ),
  }));
};

export const defaultFurnitureSeeds: ManagedFurnitureSeed[] = [];

furnitureCatalog.forEach((group, groupOrder) => {
  if (group.subtypes && group.subtypes.length > 0) {
    group.subtypes.forEach((sub, itemOrder) => {
      defaultFurnitureSeeds.push({
        id: sub.id,
        groupId: group.id,
        groupName: group.name,
        name: sub.name,
        width: sub.width,
        length: sub.length,
        color: sub.color,
        category: sub.category,
        modelPath: sub.models?.[0]?.path ?? "",
        modelId: sub.models?.[0]?.id,
        groupOrder,
        itemOrder,
      });
    });
    return;
  }

  defaultFurnitureSeeds.push({
    id: group.id,
    groupId: group.id,
    groupName: group.name,
    name: group.name,
    width: group.width ?? 5,
    length: group.length ?? 5,
    color: group.color ?? "#888888",
    category: group.category ?? "General",
    modelPath: group.models?.[0]?.path ?? "",
    modelId: group.models?.[0]?.id,
    groupOrder,
    itemOrder: 0,
  });
});

export const defaultManagedFurnitureItems: ManagedFurnitureItem[] =
  defaultFurnitureSeeds.map(({ groupOrder: _groupOrder, itemOrder: _itemOrder, ...item }) => item);
