export interface TemplateFurniture {
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  length: number;
  color: string;
}

export interface RoomTemplate {
  id: string;
  name: string;
  icon: string;
  dimensions: { width: number; length: number };
  defaultFurniture: TemplateFurniture[];
  suggestedWallColor: string;
  suggestedFloorColor: string;
  suggestedFloorType: string;
}

export const roomTemplates: RoomTemplate[] = [
  {
    id: "living-room",
    name: "Living Room",
    icon: "🛋️",
    dimensions: { width: 22, length: 18 },

    defaultFurniture: [
      {
        type: "sofa",
        name: "3 Seater Sofa",
        x: 7.5,
        y: 0.5,
        width: 7,
        length: 3,
        color: "#8B4513",
      },
      {
        type: "coffee-table",
        name: "Coffee Table",
        x: 9,
        y: 5.5,
        width: 4,
        length: 2,
        color: "#4682B4",
      },
      {
        type: "arm-chair",
        name: "Arm Chair",
        x: 16,
        y: 5,
        width: 3,
        length: 3,
        color: "#228B22",
      },
      {
        type: "arm-chair",
        name: "Arm Chair",
        x: 3,
        y: 5,
        width: 3,
        length: 3,
        color: "#228B22",
      },
      {
        type: "bookshelf",
        name: "Bookshelf",
        x: 0.5,
        y: 12,
        width: 1,
        length: 3,
        color: "#8B4513",
      },
      {
        type: "tv-stand",
        name: "TV Stand",
        x: 8,
        y: 16,
        width: 6,
        length: 1.5,
        color: "#333333",
      },
    ],

    suggestedWallColor: "#F4EFEA",
    suggestedFloorColor: "#CFAE82",
    suggestedFloorType: "tile",
  },

  {
    id: "bedroom",
    name: "Bedroom",
    icon: "🛏️",
    dimensions: { width: 18, length: 16 },

    defaultFurniture: [
      {
        type: "queen-bed",
        name: "Queen Bed",
        x: 6,
        y: 3,
        width: 5,
        length: 6.5,
        color: "#FFFFFF",
      },
      {
        type: "nightstand",
        name: "Nightstand Left",
        x: 4,
        y: 3,
        width: 1.8,
        length: 1.8,
        color: "#8B4513",
      },
      {
        type: "nightstand",
        name: "Nightstand Right",
        x: 11.3,
        y: 3,
        width: 1.8,
        length: 1.8,
        color: "#8B4513",
      },
      {
        type: "wardrobe",
        name: "Wardrobe",
        x: 13,
        y: 8,
        width: 4,
        length: 2,
        color: "#654321",
      },
      {
        type: "dresser",
        name: "Dresser",
        x: 3,
        y: 11,
        width: 3.5,
        length: 1.8,
        color: "#8B4513",
      },
    ],

    suggestedWallColor: "#F3E4CF",
    suggestedFloorColor: "#D4A76A",
    suggestedFloorType: "wood",
  },

  {
    id: "home-office",
    name: "Home Office",
    icon: "💻",
    dimensions: { width: 12, length: 14 },

    defaultFurniture: [
      {
        type: "desk",
        name: "Executive Desk",
        x: 2,
        y: 2,
        width: 6,
        length: 2.5,
        color: "#2F4F4F",
      },
      {
        type: "office-chair",
        name: "Ergonomic Chair",
        x: 3.5,
        y: 5.2,
        width: 2.5,
        length: 2.5,
        color: "#333333",
      },
      {
        type: "bookshelf",
        name: "Tall Bookshelf",
        x: 9.5,
        y: 2,
        width: 2,
        length: 1,
        color: "#8B4513",
      },
      {
        type: "filing-cabinet",
        name: "Filing Cabinet",
        x: 9.5,
        y: 4,
        width: 1.6,
        length: 1.6,
        color: "#555555",
      },
    ],

    suggestedWallColor: "#E7E4DF",
    suggestedFloorColor: "#B0ABAD",
    suggestedFloorType: "tile",
  },

  {
    id: "dining-room",
    name: "Dining Room",
    icon: "🍽️",
    dimensions: { width: 16, length: 14 },

    defaultFurniture: [
      {
        type: "dining-table",
        name: "6 Seat Dining Table",
        x: 5,
        y: 5,
        width: 6,
        length: 3,
        color: "#8B4513",
      },
      {
        type: "chair",
        name: "North Chair",
        x: 6.5,
        y: 3.2,
        width: 1.5,
        length: 1.5,
        color: "#4682B4",
      },
      {
        type: "chair",
        name: "South Chair",
        x: 6.5,
        y: 8.8,
        width: 1.5,
        length: 1.5,
        color: "#4682B4",
      },
      {
        type: "chair",
        name: "East Chair",
        x: 11.5,
        y: 5.8,
        width: 1.5,
        length: 1.5,
        color: "#4682B4",
      },
      {
        type: "chair",
        name: "West Chair",
        x: 3.5,
        y: 5.8,
        width: 1.5,
        length: 1.5,
        color: "#4682B4",
      },
      {
        type: "sideboard",
        name: "Sideboard Cabinet",
        x: 11,
        y: 11,
        width: 4,
        length: 1.5,
        color: "#5C4033",
      },
    ],

    suggestedWallColor: "#F5F0EB",
    suggestedFloorColor: "#E8E4E0",
    suggestedFloorType: "tile",
  },
  {
    id: "studio-apartment",
    name: "Studio Apartment",
    icon: "🏢",
    dimensions: { width: 24, length: 18 },

    defaultFurniture: [
      {
        type: "queen-bed",
        name: "Queen Bed",
        x: 2,
        y: 2,
        width: 5,
        length: 6.5,
        color: "#FFFFFF",
      },
      {
        type: "two-seater-sofa",
        name: "2 Seater Sofa",
        x: 10,
        y: 2,
        width: 5.5,
        length: 3,
        color: "#8B4513",
      },
      {
        type: "coffee-table",
        name: "Coffee Table",
        x: 11,
        y: 6,
        width: 4,
        length: 2,
        color: "#4682B4",
      },
      {
        type: "desk",
        name: "Compact Desk",
        x: 18,
        y: 2,
        width: 4,
        length: 2,
        color: "#2F4F4F",
      },
      {
        type: "wardrobe",
        name: "Wardrobe",
        x: 18,
        y: 8,
        width: 4,
        length: 2,
        color: "#654321",
      },
    ],

    suggestedWallColor: "#F2EFE9",
    suggestedFloorColor: "#D6CFC7",
    suggestedFloorType: "wood",
  },

  {
    id: "kids-bedroom",
    name: "Kids Bedroom",
    icon: "🧸",
    dimensions: { width: 14, length: 12 },

    defaultFurniture: [
      {
        type: "single-bed",
        name: "Single Bed",
        x: 2,
        y: 2,
        width: 3,
        length: 6.25,
        color: "#FFDAB9",
      },
      {
        type: "study-desk",
        name: "Study Desk",
        x: 8,
        y: 2,
        width: 4,
        length: 2,
        color: "#87CEEB",
      },
      {
        type: "chair",
        name: "Study Chair",
        x: 9,
        y: 4.5,
        width: 1.5,
        length: 1.5,
        color: "#4682B4",
      },
      {
        type: "toy-storage",
        name: "Toy Storage",
        x: 2,
        y: 9,
        width: 4,
        length: 1.8,
        color: "#FFA07A",
      },
      {
        type: "bookshelf",
        name: "Kids Bookshelf",
        x: 10,
        y: 9,
        width: 2,
        length: 1,
        color: "#DEB887",
      },
    ],

    suggestedWallColor: "#FFF0F5",
    suggestedFloorColor: "#F4C2C2",
    suggestedFloorType: "wood",
  },

  {
    id: "lounge-room",
    name: "Lounge Room",
    icon: "📺",
    dimensions: { width: 20, length: 16 },

    defaultFurniture: [
      {
        type: "l-shape-sofa",
        name: "L Shape Sofa",
        x: 2,
        y: 2,
        width: 9,
        length: 6,
        color: "#654321",
      },
      {
        type: "coffee-table",
        name: "Coffee Table",
        x: 7,
        y: 8,
        width: 4,
        length: 2,
        color: "#4682B4",
      },
      {
        type: "tv-stand",
        name: "TV Stand",
        x: 12,
        y: 2,
        width: 6,
        length: 1.5,
        color: "#333333",
      },
      {
        type: "bookshelf",
        name: "Display Shelf",
        x: 15,
        y: 10,
        width: 3,
        length: 1,
        color: "#8B4513",
      },
      {
        type: "arm-chair",
        name: "Reading Chair",
        x: 3,
        y: 11,
        width: 3,
        length: 3,
        color: "#228B22",
      },
    ],

    suggestedWallColor: "#EFE6DD",
    suggestedFloorColor: "#C8B6A6",
    suggestedFloorType: "wood",
  },
];
