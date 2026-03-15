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
  category: string;
  models: FurnitureModel[];
}

export interface CatalogItem {
  id: string;
  name: string;
  category?: string;
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
        width: 2.5,
        length: 2.5,
        color: "#228B22",
        category: "Seating",
        models: [
          {
            id: "arm-chair-model",
            name: "Arm Chair",
            path: "/assets/3d-models/arm-chair/arm-chair.gltf",
          },
        ],
      },
      {
        id: "stool-01",
        name: "Stool",
        width: 1.5,
        length: 1.5,
        color: "#A52A2A",
        category: "Seating",
        models: [
          {
            id: "stool-model",
            name: "Stool",
            path: "/assets/3d-models/stool/scene.gltf",
          },
        ],
      },
      {
        id: "single-chair",
        name: "Single Chair",
        width: 1.5,
        length: 1.5,
        color: "#4682B4",
        category: "Seating",
        models: [
          {
            id: "single-chair-model",
            name: "Dining Chair",
            path: "/assets/3d-models/single-chair/scene.gltf",
          },
        ],
      },
      {
        id: "computer-chair",
        name: "Computer Chair",
        width: 2,
        length: 2,
        color: "#333333",
        category: "Seating",
        models: [
          {
            id: "computer-chair-model",
            name: "Computer Chair",
            path: "/assets/3d-models/computer chair/scene.gltf",
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
        category: "Tables",
        models: [
          {
            id: "coffee-table-model",
            name: "Coffee Table",
            path: "/assets/3d-models/coffee table/scene.gltf",
          },
        ],
      },
      {
        id: "dining-table",
        name: "Dining Table (6 Seat)",
        width: 6,
        length: 3,
        color: "#dbd7d7",
        category: "Tables",
        models: [
          {
            id: "dining-table-model",
            name: "Dining Table",
            path: "/assets/3d-models/dining table/scene.gltf",
          },
        ],
      },
      {
        id: "office-desk",
        name: "Office Desk",
        width: 5,
        length: 2.5,
        color: "#2F4F4F",
        category: "Tables",
        models: [
          {
            id: "desk-model",
            name: "Desk",
            path: "/assets/3d-models/office desk/scene.gltf",
          },
        ],
      },
      {
        id: "tv-stand",
        name: "TV Stand",
        width: 6,
        length: 1.5,
        color: "#e69141",
        category: "Tables",
        models: [
          {
            id: "tv-stand-model",
            name: "TV Stand",
            path: "/assets/3d-models/tv stand/scene.gltf",
          },
        ],
      },
      {
        id: "night-stand",
        name: "Nightstand",
        width: 1.8,
        length: 1.8,
        color: "#8B4513",
        category: "Tables",
        models: [
          {
            id: "nightstand-model",
            name: "Nightstand",
            path: "/assets/3d-models/nightstand/scene.gltf",
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
        name: "2 Seater Sofa",
        width: 7,
        length: 3,
        color: "#f3d9c4",
        category: "Seating",
        models: [
          {
            id: "two-seater-sofa-model",
            name: "2 Seater Sofa",
            path: "/assets/3d-models/2 seat sofa/scene.gltf",
          },
        ],
      },
      {
        id: "l-shape-sofa",
        name: "L Shape Sofa",
        width: 9,
        length: 6,
        color: "#c6c2be",
        category: "Seating",
        models: [
          {
            id: "l-shape-sofa-model",
            name: "L Shape Sofa",
            path: "/assets/3d-models/L shape sofa/scene.gltf",
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
        id: "queen-bed",
        name: "Queen Bed",
        width: 5,
        length: 6,
        color: "#dbd7d7",
        category: "Beds",
        models: [
          {
            id: "queen-bed-model",
            name: "Queen Bed",
            path: "/assets/3d-models/queen bed/scene.gltf",
          },
        ],
      },
      {
        id: "king-bed",
        name: "King Bed",
        width: 6,
        length: 6,
        color: "#C8D4DE",
        category: "Beds",
        models: [
          {
            id: "king-bed-model",
            name: "King Bed",
            path: "/assets/3d-models/king bed/king-bed.gltf",
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
        id: "books-helf",
        name: "Bookshelf",
        width: 3,
        length: 1,
        color: "#8B4513",
        category: "Storage",
        models: [
          {
            id: "bookshelf-model",
            name: "Bookshelf",
            path: "/assets/3d-models/bookshelf/scene.gltf",
          },
        ],
      },
      {
        id: "dresser-01",
        name: "Dresser",
        width: 4,
        length: 1.8,
        color: "#8B4513",
        category: "Storage",
        models: [
          {
            id: "dresser-model",
            name: "Dresser",
            path: "/assets/3d-models/dresser/scene.gltf",
          },
        ],
      },
      {
        id: "wardrobe-01",
        name: "Wardrobe",
        width: 5,
        length: 2,
        color: "#c6c2be",
        category: "Storage",
        models: [
          {
            id: "wardrobe-model",
            name: "Wardrobe",
            path: "/assets/3d-models/wardrobe/scene.gltf",
          },
        ],
      },
    ],
  },
];
