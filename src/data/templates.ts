export interface TemplateFurniture {
  recordId?: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  length: number;
  color: string;
  rotation?: number;
}

export interface RoomTemplate {
  recordId?: string;
  id: string;
  name: string;
  description: string;
  icon: string;
  thumbnail: string;
  dimensions: { width: number; length: number };
  defaultFurniture: TemplateFurniture[];
  suggestedWallColor: string;
  suggestedFloorColor: string;
  suggestedFloorType: string;
}

export const buildTemplateThumbnail = (label: string, c1: string, c2: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${c1}" />
          <stop offset="1" stop-color="${c2}" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="20" fill="url(#g)"/>
      <rect x="24" y="24" width="272" height="152" rx="16" fill="rgba(255,255,255,0.22)"/>
      <text x="50%" y="56%" font-size="24" font-family="Arial, sans-serif" fill="#1f2937" text-anchor="middle">${label}</text>
    </svg>`,
  )}`;

export const roomTemplates: RoomTemplate[] = [
  {
    id: "living-room",
    name: "Living Room",
    description: "A relaxed lounge setup with sofa seating and media.",
    icon: "🛋️",
    thumbnail: buildTemplateThumbnail("Living Room", "#f3ede6", "#d8c9b8"),
    dimensions: { width: 22, length: 18 },
    defaultFurniture: [
      {
        type: "two-seater-sofa",
        name: "2 Seater Sofa",
        x: 7.5,
        y: 0.5,
        width: 7,
        length: 3,
        color: "#f3d9c4",
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
        x: 15.5,
        y: 5,
        width: 2.5,
        length: 2.5,
        color: "#228B22",
        rotation: 90,
      },
      {
        type: "arm-chair",
        name: "Arm Chair",
        x: 4,
        y: 5,
        width: 2.5,
        length: 2.5,
        color: "#228B22",
        rotation: 270,
      },
      {
        type: "books-helf",
        name: "Bookshelf",
        x: -0.5,
        y: 12,
        width: 2.5,
        length: 0.8,
        color: "#8B4513",
        rotation: 270,
      },
      {
        type: "tv-stand",
        name: "TV Stand",
        x: 8,
        y: 16,
        width: 6,
        length: 1.5,
        color: "#e69141",
        rotation: 180,
      },
    ],
    suggestedWallColor: "#F5F0EB",
    suggestedFloorColor: "#d4a76a",
    suggestedFloorType: "tile",
  },
  {
    id: "bedroom",
    name: "Bedroom",
    description: "Sleep-focused layout with storage and soft lighting.",
    icon: "🛏️",
    thumbnail: buildTemplateThumbnail("Bedroom", "#f6eee5", "#c8d4de"),
    dimensions: { width: 18, length: 16 },
    defaultFurniture: [
      {
        type: "king-bed",
        name: "King Bed",
        x: 6,
        y: 0.5,
        width: 6,
        length: 6,
        color: "#C8D4DE",
      },
      {
        type: "night-stand",
        name: "Nightstand Left",
        x: 4,
        y: 0.5,
        width: 1.8,
        length: 1.8,
        color: "#8B4513",
      },
      {
        type: "night-stand",
        name: "Nightstand Right",
        x: 12.2,
        y: 0.5,
        width: 1.8,
        length: 1.8,
        color: "#8B4513",
      },
      {
        type: "wardrobe-01",
        name: "Wardrobe",
        x: 14.3,
        y: 10,
        width: 5,
        length: 2,
        color: "#c6c2be",
        rotation: 90,
      },
      {
        type: "dresser-01",
        name: "Dresser",
        x: 14.9,
        y: 5,
        width: 4,
        length: 1.8,
        color: "#8B4513",
        rotation: 90,
      },
    ],
    suggestedWallColor: "#F5E6D3",
    suggestedFloorColor: "#d4a76a",
    suggestedFloorType: "wood",
  },
  {
    id: "dining-room",
    name: "Dining Room",
    description: "Balanced dining setup with seating for six.",
    icon: "🍽️",
    thumbnail: buildTemplateThumbnail("Dining Room", "#f5f0eb", "#e8e4e0"),
    dimensions: { width: 16, length: 14 },
    defaultFurniture: [
      {
        type: "dining-table",
        name: "Dining Table (6 Seat)",
        x: 5,
        y: 5,
        width: 6,
        length: 4,
        color: "#dbd7d7",
      },
      {
        type: "single-chair",
        name: "Single Chair",
        x: 4,
        y: 6.3,
        width: 1.5,
        length: 1.5,
        color: "#4682B4",
        rotation: 270,
      },
      {
        type: "single-chair",
        name: "Single Chair",
        x: 10.5,
        y: 6.3,
        width: 1.5,
        length: 1.5,
        color: "#4682B4",
        rotation: 90,
      },
    ],
    suggestedWallColor: "#F5F0EB",
    suggestedFloorColor: "#e8e4e0",
    suggestedFloorType: "tile",
  },
  {
    id: "home-office",
    name: "Home Office",
    description: "Focused workspace with desk, chair and shelving.",
    icon: "💻",
    thumbnail: buildTemplateThumbnail("Home Office", "#e8e4e0", "#b0abad"),
    dimensions: { width: 12, length: 14 },
    defaultFurniture: [
      {
        type: "office-desk",
        name: "Office Desk",
        x: 0.5,
        y: 3.5,
        width: 5,
        length: 2.5,
        color: "#2F4F4F",
      },
      {
        type: "computer-chair",
        name: "Computer Chair",
        x: 2,
        y: 1.5,
        width: 2,
        length: 2,
        color: "#333333",
      },
      {
        type: "books-helf",
        name: "Bookshelf",
        x: 8.5,
        y: 0.3,
        width: 3,
        length: 1,
        color: "#8B4513",
        rotation: 360,
      },
    ],
    suggestedWallColor: "#E8E4E0",
    suggestedFloorColor: "#b0abad",
    suggestedFloorType: "carpet",
  },
  {
    id: "kitchen",
    name: "Kitchen",
    description: "Compact prep zone with central island.",
    icon: "🍳",
    thumbnail: buildTemplateThumbnail("Kitchen", "#f7f2ec", "#d4a76a"),
    dimensions: { width: 16, length: 12 },
    defaultFurniture: [
      {
        type: "dining-table",
        name: "Island Table",
        x: 5,
        y: 4,
        width: 6,
        length: 3,
        color: "#dbd7d7",
      },
      {
        type: "stool-01",
        name: "Stool",
        x: 4,
        y: 2,
        width: 1.5,
        length: 1.5,
        color: "#A52A2A",
      },
      {
        type: "stool-01",
        name: "Stool",
        x: 10.5,
        y: 2,
        width: 1.5,
        length: 1.5,
        color: "#A52A2A",
      },
      {
        type: "tv-stand",
        name: "Side Console",
        x: 0.5,
        y: 9,
        width: 4,
        length: 1.5,
        color: "#e69141",
        rotation: 90,
      },
    ],
    suggestedWallColor: "#F7F2EC",
    suggestedFloorColor: "#d4a76a",
    suggestedFloorType: "tile",
  },
  {
    id: "studio",
    name: "Studio",
    description: "Multi-purpose studio with sleep and work zones.",
    icon: "🏢",
    thumbnail: buildTemplateThumbnail("Studio", "#f5f0eb", "#c9b9a6"),
    dimensions: { width: 24, length: 18 },
    defaultFurniture: [
      {
        type: "queen-bed",
        name: "Queen Bed",
        x: 4,
        y: 0.5,
        width: 5,
        length: 6,
        color: "#dbd7d7",
      },
      {
        type: "l-shape-sofa",
        name: "L Shape Sofa",
        x: 14.6,
        y: 11.9,
        width: 9,
        length: 6,
        color: "#c6c2be",
        rotation: 180,
      },
      {
        type: "office-desk",
        name: "Office Desk",
        x: 18.5,
        y: 0.5,
        width: 5,
        length: 2.5,
        color: "#2F4F4F",
      },
      {
        type: "computer-chair",
        name: "Computer Chair",
        x: 20.5,
        y: 3.5,
        width: 2,
        length: 2,
        color: "#333333",
        rotation: 180,
      },
    ],
    suggestedWallColor: "#F5F0EB",
    suggestedFloorColor: "#c9b9a6",
    suggestedFloorType: "wood",
  },
];
