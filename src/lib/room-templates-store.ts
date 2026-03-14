import type { CatalogRoomTemplate, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  defaultRoomTemplateSeeds,
  normalizeRoomTemplate,
  roomTemplateSchema,
  type RoomTemplateInput,
} from "@/lib/room-templates-shared";
import type { RoomTemplate } from "@/data/templates";

const toRoomTemplate = (
  item: CatalogRoomTemplate,
): RoomTemplate => ({
  recordId: item.id,
  id: item.slug,
  name: item.name,
  description: item.description,
  icon: item.icon,
  thumbnail: item.thumbnail,
  dimensions: {
    width: item.width,
    length: item.length,
  },
  defaultFurniture: Array.isArray(item.defaultFurniture)
    ? (item.defaultFurniture as unknown as RoomTemplate["defaultFurniture"])
    : [],
  suggestedWallColor: item.suggestedWallColor,
  suggestedFloorColor: item.suggestedFloorColor,
  suggestedFloorType: item.suggestedFloorType,
});

export const ensureRoomTemplatesSeeded = async () => {
  const count = await prisma.catalogRoomTemplate.count();
  if (count > 0) return;

  try {
    await prisma.catalogRoomTemplate.createMany({
      data: defaultRoomTemplateSeeds.map((item) => ({
        slug: item.id,
        name: item.name,
        description: item.description,
        icon: item.icon,
        thumbnail: item.thumbnail,
        width: item.dimensions.width,
        length: item.dimensions.length,
        defaultFurniture: item.defaultFurniture as unknown as Prisma.InputJsonValue,
        suggestedWallColor: item.suggestedWallColor,
        suggestedFloorColor: item.suggestedFloorColor,
        suggestedFloorType: item.suggestedFloorType,
        displayOrder: item.displayOrder,
      })),
    });
  } catch {
    // Ignore concurrent seeding attempts.
  }
};

const removeDuplicateRoomTemplates = async () => {
  const items = await prisma.catalogRoomTemplate.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
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
    await prisma.catalogRoomTemplate.deleteMany({
      where: { id: { in: duplicateIds } },
    });
  }
};

export const listRoomTemplates = async () => {
  await ensureRoomTemplatesSeeded();
  await removeDuplicateRoomTemplates();
  const items = await prisma.catalogRoomTemplate.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  return items.map(toRoomTemplate);
};

const getNextDisplayOrder = async () => {
  const lastItem = await prisma.catalogRoomTemplate.findFirst({
    orderBy: { displayOrder: "desc" },
  });
  return (lastItem?.displayOrder ?? -1) + 1;
};

export const createRoomTemplate = async (input: RoomTemplateInput) => {
  const normalized = normalizeRoomTemplate(roomTemplateSchema.parse(input));
  const existing = await prisma.catalogRoomTemplate.findFirst({
    where: { slug: normalized.id },
  });
  if (existing) {
    throw new Error("A template with this id already exists.");
  }
  const displayOrder = await getNextDisplayOrder();

  const item = await prisma.catalogRoomTemplate.create({
    data: {
      slug: normalized.id,
      name: normalized.name,
      description: normalized.description,
      icon: normalized.icon,
      thumbnail: normalized.thumbnail,
      width: normalized.dimensions.width,
      length: normalized.dimensions.length,
      defaultFurniture:
        normalized.defaultFurniture as unknown as Prisma.InputJsonValue,
      suggestedWallColor: normalized.suggestedWallColor,
      suggestedFloorColor: normalized.suggestedFloorColor,
      suggestedFloorType: normalized.suggestedFloorType,
      displayOrder,
    },
  });

  return toRoomTemplate(item);
};

export const updateRoomTemplate = async (
  recordId: string,
  input: RoomTemplateInput,
) => {
  const current = await prisma.catalogRoomTemplate.findUniqueOrThrow({
    where: { id: recordId },
  });
  const normalized = normalizeRoomTemplate(roomTemplateSchema.parse(input));
  const conflicting = await prisma.catalogRoomTemplate.findFirst({
    where: {
      slug: normalized.id,
      NOT: { id: recordId },
    },
  });
  if (conflicting) {
    throw new Error("A template with this id already exists.");
  }

  const item = await prisma.catalogRoomTemplate.update({
    where: { id: recordId },
    data: {
      slug: normalized.id,
      name: normalized.name,
      description: normalized.description,
      icon: normalized.icon,
      thumbnail: normalized.thumbnail,
      width: normalized.dimensions.width,
      length: normalized.dimensions.length,
      defaultFurniture:
        normalized.defaultFurniture as unknown as Prisma.InputJsonValue,
      suggestedWallColor: normalized.suggestedWallColor,
      suggestedFloorColor: normalized.suggestedFloorColor,
      suggestedFloorType: normalized.suggestedFloorType,
      displayOrder: current.displayOrder,
    },
  });

  return toRoomTemplate(item);
};

export const deleteRoomTemplate = async (recordId: string) => {
  await prisma.catalogRoomTemplate.delete({
    where: { id: recordId },
  });
};
