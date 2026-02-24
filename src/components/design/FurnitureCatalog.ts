export interface FurnitureModel {
  id: string;
  name: string;
  path: string;
  yOffset?: number;
}

export interface FurnitureSubtype {
  id: string;
  name: string;
  width: number;
  length: number;
  color: string;
  models: FurnitureModel[];
}

export interface CatalogItem {
  id: string;
  name: string;
  width?: number;
  length?: number;
  color?: string;
  models?: FurnitureModel[];
  subtypes?: FurnitureSubtype[];
}

export const furnitureCatalog: CatalogItem[] = [
  {
    id: "chair",
    name: "Chair",
    subtypes: [
      {
        id: "arm-chair",
        name: "Arm Chair",
        width: 3,
        length: 3,
        color: "#228B22",
        models: [
          {
            id: "arm-chair-model",
            name: "Arm Chair",
            path: "/assets/3d-models/arm-chair/arm-chair.gltf",
          },
        ],
      },
      {
        id: "stool",
        name: "Stool",
        width: 1.5,
        length: 1.5,
        color: "#A52A2A",
        models: [
          {
            id: "stool-model",
            name: "Stool",
            path: "/assets/3d-models/stool.gltf",
          },
        ],
      },
      {
        id: "single-chair",
        name: "Dining Chair",
        width: 1.8,
        length: 1.8,
        color: "#4682B4",
        models: [
          {
            id: "single-chair-model",
            name: "Dining Chair",
            path: "/assets/3d-models/single-chair.gltf",
          },
        ],
      },
      {
        id: "computer-chair",
        name: "Computer Chair",
        width: 2,
        length: 2,
        color: "#333333",
        models: [
          {
            id: "computer-chair-model",
            name: "Computer Chair",
            path: "/assets/3d-models/computer-chair.gltf",
          },
        ],
      },
    ],
  },

  {
    id: "table",
    name: "Table",
    subtypes: [
      {
        id: "coffee-table",
        name: "Coffee Table",
        width: 4,
        length: 2,
        color: "#4682B4",
        models: [
          {
            id: "coffee-table-model",
            name: "Coffee Table",
            path: "/assets/3d-models/coffee-table.gltf",
          },
        ],
      },
      {
        id: "dining-table",
        name: "Dining Table (6 Seat)",
        width: 6,
        length: 3,
        color: "#8B4513",
        models: [
          {
            id: "dining-table-model",
            name: "Dining Table",
            path: "/assets/3d-models/dining-table.gltf",
          },
        ],
      },
      {
        id: "desk",
        name: "Work Desk",
        width: 5,
        length: 2.5,
        color: "#2F4F4F",
        models: [
          {
            id: "desk-model",
            name: "Desk",
            path: "/assets/3d-models/desk.gltf",
          },
        ],
      },
      {
        id: "nightstand",
        name: "Nightstand",
        width: 2,
        length: 2,
        color: "#8B4513",
        models: [
          {
            id: "nightstand-model",
            name: "Nightstand",
            path: "/assets/3d-models/nightstand.gltf",
          },
        ],
      },
    ],
  },
  {
    id: "sofa",
    name: "Sofa",
    subtypes: [
      {
        id: "two-seater-sofa",
        name: "3 Seater Sofa",
        width: 7,
        length: 3,
        color: "#8B4513",
        models: [
          {
            id: "two-seater-sofa-model",
            name: "2 Seater Sofa",
            path: "/assets/3d-models/sofa-2-seater/scene.gltf",
          },
        ],
      },
      {
        id: "l-shape-sofa",
        name: "L Shape Sofa",
        width: 9,
        length: 6,
        color: "#654321",
        models: [
          {
            id: "l-shape-sofa-model",
            name: "L Shape Sofa",
            path: "/assets/3d-models/l-shape-sofa/scene.gltf",
          },
        ],
      },
    ],
  },

  {
    id: "bed",
    name: "Bed",
    subtypes: [
      {
        id: "single-bed",
        name: "Single Bed",
        width: 3,
        length: 6.25,
        color: "#D2691E",
        models: [
          {
            id: "single-bed-model",
            name: "Single Bed",
            path: "/assets/3d-models/single-bed/single-bed.gltf",
          },
        ],
      },
      {
        id: "double-bed",
        name: "Queen Bed",
        width: 5,
        length: 6.5,
        color: "#FFFFFF",
        models: [
          {
            id: "double-bed-model",
            name: "Double Bed",
            path: "/assets/3d-models/double-bed.gltf",
          },
        ],
      },
    ],
  },

  {
    id: "storage",
    name: "Storage",
    subtypes: [
      {
        id: "bookshelf",
        name: "Bookshelf",
        width: 3,
        length: 1,
        color: "#8B4513",
        models: [
          {
            id: "bookshelf-model",
            name: "Bookshelf",
            path: "/assets/3d-models/bookshelf.gltf",
          },
        ],
      },
      {
        id: "dresser",
        name: "Dresser",
        width: 4,
        length: 1.8,
        color: "#8B4513",
        models: [
          {
            id: "dresser-model",
            name: "Dresser",
            path: "/assets/3d-models/dresser.gltf",
          },
        ],
      },
      {
        id: "wardrobe",
        name: "Wardrobe",
        width: 5,
        length: 2,
        color: "#6B4226",
        models: [
          {
            id: "wardrobe-model",
            name: "Wardrobe",
            path: "/assets/3d-models/wardrobe.gltf",
          },
        ],
      },
    ],
  },
];
