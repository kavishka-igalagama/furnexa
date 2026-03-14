import { z } from "zod";
import {
  buildTemplateThumbnail,
  roomTemplates,
  type RoomTemplate,
  type TemplateFurniture,
} from "@/data/templates";

export const templateFurnitureSchema = z.object({
  type: z.string().min(1).max(120),
  name: z.string().min(1).max(160),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  length: z.number().positive(),
  color: z.string().min(4).max(20),
  rotation: z.number().optional(),
});

export const roomTemplateSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(160),
  description: z.string().min(1).max(500),
  icon: z.string().min(1).max(40),
  thumbnail: z.string().max(4000).optional(),
  dimensions: z.object({
    width: z.number().positive(),
    length: z.number().positive(),
  }),
  defaultFurniture: z.array(templateFurnitureSchema),
  suggestedWallColor: z.string().min(4).max(20),
  suggestedFloorColor: z.string().min(4).max(20),
  suggestedFloorType: z.enum(["tile", "carpet", "wood"]),
});

export type RoomTemplateInput = z.infer<typeof roomTemplateSchema>;

export type RoomTemplateSeed = RoomTemplate & {
  displayOrder: number;
};

export const normalizeRoomTemplate = (
  input: RoomTemplateInput & { recordId?: string },
): RoomTemplate => ({
  recordId: input.recordId,
  id: input.id,
  name: input.name,
  description: input.description,
  icon: input.icon,
  thumbnail:
    input.thumbnail && input.thumbnail.trim().length > 0
      ? input.thumbnail
      : buildTemplateThumbnail(
          input.name,
          input.suggestedWallColor,
          input.suggestedFloorColor,
        ),
  dimensions: {
    width: input.dimensions.width,
    length: input.dimensions.length,
  },
  defaultFurniture: input.defaultFurniture.map(
    (item): TemplateFurniture => ({
      type: item.type,
      name: item.name,
      x: item.x,
      y: item.y,
      width: item.width,
      length: item.length,
      color: item.color,
      rotation: item.rotation,
    }),
  ),
  suggestedWallColor: input.suggestedWallColor,
  suggestedFloorColor: input.suggestedFloorColor,
  suggestedFloorType: input.suggestedFloorType,
});

export const defaultRoomTemplateSeeds: RoomTemplateSeed[] = roomTemplates.map(
  (template, displayOrder) => ({
    ...template,
    displayOrder,
  }),
);

export const defaultRoomTemplates: RoomTemplate[] = roomTemplates;
