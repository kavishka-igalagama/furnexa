"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { ArrowLeft, Undo2, Redo2 } from "lucide-react";
import { drawRasterLine } from "@/lib/rasterize";
import { useDesignContext } from "@/context/DesignContext";

interface Room3DState {
  dimensions: { width: number; length: number };
  wallColor: string;
  floorColor: string;
  floorType: FloorType;
  ceilingColor?: string;
}

type FloorType = "tile" | "carpet" | "wood";
type ShadingMode = "flat" | "gouraud" | "phong";

interface Furniture3DItem {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  length: number;
  color: string;
  rotation?: number;
  modelPath?: string;
}

interface FurnitureTransform {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
}

const WALL_HEIGHT = 9;
const FLOOR_TEXTURES: Record<FloorType, string> = {
  tile: "/assets/floor-textures/tile%20floor.jpg",
  carpet: "/assets/floor-textures/carpet%20floor.jpg",
  wood: "/assets/floor-textures/wood%20floor.jpg",
};

const isFloorType = (value: unknown): value is FloorType => {
  return value === "tile" || value === "carpet" || value === "wood";
};

const FLOOR_COLOR_PRESETS = [
  { label: "Honey Oak", value: "#d4a76a" },
  { label: "Classic Teak", value: "#b88e5a" },
  { label: "Walnut Brown", value: "#6b4226" },
  { label: "Slate Gray", value: "#b0abad" },
  { label: "Soft Ivory", value: "#e8e4e0" },
  { label: "Sand Beige", value: "#c9b9a6" },
];

const WALL_COLOR_PRESETS = [
  { label: "White", value: "#F5F0EB" },
  { label: "Cream", value: "#F5E6D3" },
  { label: "Light Gray", value: "#E8E4E0" },
  { label: "Warm Beige", value: "#E8D5C4" },
  { label: "Sage", value: "#C5CCBE" },
  { label: "Soft Blue", value: "#C8D4DE" },
];

const MODEL_PATH_FALLBACKS: Record<string, string> = {
  "arm-chair": "/assets/3d-models/arm-chair/arm-chair.gltf",
  "stool-01": "/assets/3d-models/stool/scene.gltf",
  "single-chair": "/assets/3d-models/single-chair/scene.gltf",
  "computer-chair": "/assets/3d-models/computer chair/scene.gltf",
  "coffee-table": "/assets/3d-models/coffee table/scene.gltf",
  "dining-table": "/assets/3d-models/dining table/scene.gltf",
  "office-desk": "/assets/3d-models/office desk/scene.gltf",
  "tv-stand": "/assets/3d-models/tv stand/scene.gltf",
  "night-stand": "/assets/3d-models/nightstand/scene.gltf",
  "two-seater-sofa": "/assets/3d-models/2 seat sofa/scene.gltf",
  "l-shape-sofa": "/assets/3d-models/L shape sofa/scene.gltf",
  "queen-bed": "/assets/3d-models/queen bed/scene.gltf",
  "king-bed": "/assets/3d-models/king bed/king-bed.gltf",
  "books-helf": "/assets/3d-models/bookshelf/scene.gltf",
  "dresser-01": "/assets/3d-models/dresser/scene.gltf",
  "wardrobe-01": "/assets/3d-models/wardrobe/scene.gltf",
};

const resolveModelPath = (item: Furniture3DItem) => {
  if (item.modelPath && item.modelPath.trim().length > 0) {
    return item.modelPath;
  }

  return MODEL_PATH_FALLBACKS[item.type];
};

const DEFAULT_VIEW_STATE: { room: Room3DState; furniture: Furniture3DItem[] } =
  {
    room: {
      dimensions: { width: 20, length: 20 },
      wallColor: "#f5f5f5",
      floorColor: "#e0e0e0",
      floorType: "tile",
    },
    furniture: [],
  };

const ThreeDView = () => {
  const searchParams = useSearchParams();
  const designId = searchParams.get("designId");
  const {
    state: designState,
    designId: contextDesignId,
    setDesignId,
    setState,
    applyAction,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDesignContext();
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const floorMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const wallMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const ceilingMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const floorTextureRef = useRef<THREE.Texture | null>(null);
  const aoTextureRef = useRef<THREE.Texture | null>(null);
  const zoomControllerRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    reset: () => void;
  } | null>(null);
  const spotlightRef = useRef<THREE.SpotLight | null>(null);
  const shadowPlaneRef = useRef<THREE.Mesh | null>(null);
  const pendingLoadsRef = useRef(0);
  const gltfLoaderRef = useRef<GLTFLoader | null>(null);
  const modelCacheRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const fpsRef = useRef({ last: performance.now(), frames: 0 });
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [fps, setFps] = useState(0);
  const [sceneToken, setSceneToken] = useState(0);
  const [shadingMode, setShadingMode] = useState<ShadingMode>("phong");
  const [globalColors, setGlobalColors] = useState<{
    walls?: string;
    floor?: string;
    ceiling?: string;
    furniture?: string;
  } | null>(null);
  const [activeTheme, setActiveTheme] = useState<{
    id: string;
    label: string;
    wallColor: string;
    floorColor: string;
    floorType: FloorType;
    furnitureColor: string;
  } | null>(null);
  const { room, furniture } = viewState;
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(
    null,
  );
  const [furnitureTransforms, setFurnitureTransforms] = useState<
    Record<string, FurnitureTransform>
  >({});
  const furnitureTransformsRef = useRef<Record<string, FurnitureTransform>>({});

  const [furnitureColors, setFurnitureColors] = useState<
    Record<string, string>
  >({});
  const furnitureColorsRef = useRef<Record<string, string>>({});
  const furnitureRef = useRef<Furniture3DItem[]>([]);
  const roomStyleRef = useRef({
    floorType: room.floorType,
    floorColor: room.floorColor,
    wallColor: room.wallColor,
  });

  const commit = useCallback(
    (type: string, updater: (prev: typeof designState) => typeof designState) => {
      if (!designId || contextDesignId !== designId) return;
      const next = updater(designState);
      applyAction(type, next);
    },
    [applyAction, contextDesignId, designId, designState],
  );

  const wireframeCanvasRef = useRef<HTMLCanvasElement>(null);
  const wireframeContextRef = useRef<CanvasRenderingContext2D | null>(null);

  const wireframeColor = useMemo(() => "rgba(255, 200, 120, 0.6)", []);
  const wireframeGridColor = useMemo(() => "rgba(255, 255, 255, 0.15)", []);

  const buildMaterial = useCallback(
    (mode: ShadingMode, color: string) => {
      if (mode === "flat") {
        return new THREE.MeshBasicMaterial({ color });
      }
      if (mode === "gouraud") {
        return new THREE.MeshLambertMaterial({ color });
      }
      return new THREE.MeshPhongMaterial({
        color,
        shininess: 60,
        specular: new THREE.Color("#ffffff"),
      });
    },
    [],
  );

  const applyMaterialColor = useCallback(
    (material: THREE.Material | THREE.Material[], color: string) => {
      if (Array.isArray(material)) {
        material.forEach((mat) => {
          const m = mat as THREE.MeshStandardMaterial;
          if (m.color) m.color.set(color);
        });
      } else {
        const m = material as THREE.MeshStandardMaterial;
        if (m.color) m.color.set(color);
      }
    },
    [],
  );

  useEffect(() => {
    if (!designId) return;

    if (designId === "local" && contextDesignId !== "local") {
      return;
    }

    if (contextDesignId === designId) {
      setViewState({
        room: {
          dimensions: {
            width: designState.room.width,
            length: designState.room.height,
          },
          wallColor: designState.room.wallColor,
          floorColor: designState.room.floorColor,
          floorType: designState.room.floorType,
          ceilingColor: designState.room.ceilingColor,
        },
        furniture: designState.furniture.map((item) => ({
          id: item.id,
          type: item.type ?? item.modelId ?? "furniture",
          name: item.label ?? "Furniture",
          x: item.x,
          y: item.y,
          width: item.width ?? 1,
          length: item.height ?? 1,
          color: item.color ?? "#999999",
          rotation: item.rotation ?? 0,
          modelPath: item.modelPath,
        })),
      });
      setGlobalColors(designState.globalColors ?? null);
      setActiveTheme(designState.activeTheme ?? null);
      setFurnitureColors({});
      return;
    }

    let isActive = true;
    const loadDesign = async () => {
      const res = await fetch(`/api/designs/${designId}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        design?: {
          roomSpecs?: {
            width: number;
            length: number;
            wallColor: string;
            floorColor: string;
            floorType: FloorType;
            ceilingColor?: string;
          };
          furnitureItems?: Array<{
            id: string;
            modelId: string;
            x: number;
            y: number;
            z: number;
            rotation: number;
            scale: number;
            color: string;
            width?: number;
            length?: number;
            name?: string;
            type?: string;
            modelPath?: string;
          }>;
          theme?: {
            id: string;
            label: string;
            wallColor: string;
            floorColor: string;
            floorType: FloorType;
            furnitureColor: string;
            ceilingColor?: string;
          } | null;
          globalColors?: {
            walls?: string;
            floor?: string;
            ceiling?: string;
            furniture?: string;
          } | null;
        };
      };

      if (!isActive || !data.design?.roomSpecs) return;

      const nextRoom: Room3DState = {
        dimensions: {
          width: data.design.roomSpecs.width,
          length: data.design.roomSpecs.length,
        },
        wallColor:
          data.design.globalColors?.walls ??
          data.design.roomSpecs.wallColor,
        floorColor:
          data.design.globalColors?.floor ??
          data.design.roomSpecs.floorColor,
        floorType: isFloorType(data.design.roomSpecs.floorType)
          ? data.design.roomSpecs.floorType
          : "tile",
        ceilingColor:
          data.design.globalColors?.ceiling ??
          data.design.roomSpecs.ceilingColor,
      };

      const nextFurniture: Furniture3DItem[] = Array.isArray(
        data.design.furnitureItems,
      )
        ? data.design.furnitureItems.map((item) => ({
            id: item.id,
            type: item.type ?? item.modelId,
            name: item.name ?? "Furniture",
            x: item.x,
            y: item.y,
            width: item.width ?? 1,
            length: item.length ?? 1,
            color:
              data.design.globalColors?.furniture ?? item.color ?? "#999999",
            rotation: item.rotation ?? 0,
            modelPath: item.modelPath,
          }))
        : [];

      setViewState({ room: nextRoom, furniture: nextFurniture });
      setGlobalColors(data.design.globalColors ?? null);
      setActiveTheme(data.design.theme ?? null);

      setDesignId(designId);
      setState({
        room: {
          width: nextRoom.dimensions.width,
          height: nextRoom.dimensions.length,
          wallColor: nextRoom.wallColor,
          floorColor: nextRoom.floorColor,
          floorType: nextRoom.floorType,
          ceilingColor: nextRoom.ceilingColor,
        },
        furniture: nextFurniture.map((item) => ({
          id: item.id,
          label: item.name,
          type: item.type,
          width: item.width,
          height: item.length,
          color: item.color,
          x: item.x,
          y: item.y,
          rotation: item.rotation ?? 0,
          modelPath: item.modelPath,
        })),
        activeTheme: data.design.theme ?? null,
        globalColors: data.design.globalColors ?? {},
      });
      setFurnitureColors({});
    };

    void loadDesign();
    return () => {
      isActive = false;
    };
  }, [
    designId,
    contextDesignId,
    designState,
    setDesignId,
    setState,
  ]);

  useEffect(() => {
    if (!wireframeCanvasRef.current) return;
    const canvas = wireframeCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    wireframeContextRef.current = ctx;
  }, []);

  useEffect(() => {
    furnitureColorsRef.current = furnitureColors;
  }, [furnitureColors]);

  useEffect(() => {
    furnitureRef.current = furniture;
  }, [furniture]);

  useEffect(() => {
    roomStyleRef.current = {
      floorType: room.floorType,
      floorColor: room.floorColor,
      wallColor: room.wallColor,
    };
  }, [room.floorType, room.floorColor, room.wallColor]);

  const furnitureModelsRef = useRef<Record<string, THREE.Object3D>>({});
  const loadingIdsRef = useRef<Set<string>>(new Set());

  const getDefaultTransform = useCallback(
    (item: Furniture3DItem): FurnitureTransform => ({
      x: item.x - room.dimensions.width / 2 + item.width / 2,
      y: 0,
      z: item.y - room.dimensions.length / 2 + item.length / 2,
      scale: 1,
      rotation: item.rotation ?? 0,
    }),
    [room.dimensions.width, room.dimensions.length],
  );

  useEffect(() => {
    setFurnitureTransforms((prev) => {
      const next: Record<string, FurnitureTransform> = {};

      furniture.forEach((item) => {
        next[item.id] = prev[item.id] ?? getDefaultTransform(item);
      });

      furnitureTransformsRef.current = next;

      return next;
    });

    setSelectedFurnitureId((prev) =>
      prev && furniture.some((item) => item.id === prev) ? prev : null,
    );
  }, [furniture, getDefaultTransform]);

  useEffect(() => {
    furnitureTransformsRef.current = furnitureTransforms;

    Object.entries(furnitureTransforms).forEach(([id, transform]) => {
      const model = furnitureModelsRef.current[id];
      if (!model) return;

      model.position.set(transform.x, transform.y, transform.z);
      model.scale.setScalar(transform.scale);
      model.rotation.y = -THREE.MathUtils.degToRad(transform.rotation);
    });
  }, [furnitureTransforms]);

  const handleColorChange = (id: string, color: string) => {
    setFurnitureColors((prev) => ({ ...prev, [id]: color }));
    setViewState((prev) => ({
      ...prev,
      furniture: prev.furniture.map((item) =>
        item.id === id ? { ...item, color } : item,
      ),
    }));
    commit("recolor-furniture-3d", (prev) => ({
      ...prev,
      furniture: prev.furniture.map((item) =>
        item.id === id ? { ...item, color } : item,
      ),
    }));
    const model = furnitureModelsRef.current[id];
    if (model) {
      model.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          applyMaterialColor(mesh.material, color);
        }
      });
    }
  };

  const handleFloorTypeChange = (floorType: FloorType) => {
    setViewState((prev) => ({
      ...prev,
      room: {
        ...prev.room,
        floorType,
      },
    }));
    commit("update-room-floor-type-3d", (prev) => ({
      ...prev,
      room: {
        ...prev.room,
        floorType,
      },
    }));
  };

  const handleFloorColorChange = (floorColor: string) => {
    setViewState((prev) => ({
      ...prev,
      room: {
        ...prev.room,
        floorColor,
      },
    }));
    commit("update-room-floor-color-3d", (prev) => ({
      ...prev,
      room: {
        ...prev.room,
        floorColor,
      },
    }));
  };

  const handleWallColorChange = (wallColor: string) => {
    setViewState((prev) => ({
      ...prev,
      room: {
        ...prev.room,
        wallColor,
      },
    }));
    commit("update-room-wall-color-3d", (prev) => ({
      ...prev,
      room: {
        ...prev.room,
        wallColor,
      },
    }));
  };

  const handleZoomControl = (direction: "in" | "out" | "reset") => {
    const controller = zoomControllerRef.current;
    if (!controller) return;

    if (direction === "in") {
      controller.zoomIn();
      return;
    }

    if (direction === "out") {
      controller.zoomOut();
      return;
    }

    controller.reset();
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (wireframeCanvasRef.current) {
      wireframeCanvasRef.current.width = w;
      wireframeCanvasRef.current.height = h;
    }

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f0eb);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    const maxDim = Math.max(room.dimensions.width, room.dimensions.length);
    camera.position.set(maxDim * 0.8, WALL_HEIGHT * 1.5, maxDim * 1.2);
    camera.lookAt(0, WALL_HEIGHT * 0.3, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;

    const rw = room.dimensions.width;
    const rl = room.dimensions.length;
    const { floorType, floorColor, wallColor } = roomStyleRef.current;

    // Floor
    const floorTexture = new THREE.TextureLoader().load(
      FLOOR_TEXTURES[floorType],
    );
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(Math.max(1, rw / 4), Math.max(1, rl / 4));
    floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const aoCanvas = document.createElement("canvas");
    aoCanvas.width = 256;
    aoCanvas.height = 256;
    const aoCtx = aoCanvas.getContext("2d");
    if (aoCtx) {
      const gradient = aoCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
      gradient.addColorStop(0, "rgba(255,255,255,0.9)");
      gradient.addColorStop(1, "rgba(0,0,0,0.15)");
      aoCtx.fillStyle = gradient;
      aoCtx.fillRect(0, 0, 256, 256);
    }
    const aoTexture = new THREE.CanvasTexture(aoCanvas);
    aoTextureRef.current = aoTexture;

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      aoMap: aoTexture,
      aoMapIntensity: 0.6,
      color: floorColor,
      roughness:
        floorType === "carpet"
          ? 0.9
          : floorType === "tile"
            ? 0.3
            : 0.5,
      metalness: floorType === "tile" ? 0.2 : 0,
    });
    floorTextureRef.current = floorTexture;
    floorMaterialRef.current = floorMat;
    const floorGeo = new THREE.PlaneGeometry(rw, rl);
    if (floorGeo.attributes.uv) {
      floorGeo.setAttribute("uv2", floorGeo.attributes.uv);
    }
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.5,
      side: THREE.DoubleSide,
      aoMap: aoTexture,
      aoMapIntensity: 0.35,
    });
    wallMaterialRef.current = wallMat;
    const addWall = (
      geo: THREE.PlaneGeometry,
      pos: THREE.Vector3,
      rotY: number,
    ) => {
      if (geo.attributes.uv) {
        geo.setAttribute("uv2", geo.attributes.uv);
      }
      const wall = new THREE.Mesh(geo, wallMat);
      wall.position.copy(pos);
      wall.rotation.y = rotY;
      wall.receiveShadow = true;
      scene.add(wall);
    };
    addWall(
      new THREE.PlaneGeometry(rw, WALL_HEIGHT),
      new THREE.Vector3(0, WALL_HEIGHT / 2, -rl / 2),
      0,
    );
    addWall(
      new THREE.PlaneGeometry(rw, WALL_HEIGHT),
      new THREE.Vector3(0, WALL_HEIGHT / 2, rl / 2),
      Math.PI,
    );
    addWall(
      new THREE.PlaneGeometry(rl, WALL_HEIGHT),
      new THREE.Vector3(-rw / 2, WALL_HEIGHT / 2, 0),
      Math.PI / 2,
    );
    addWall(
      new THREE.PlaneGeometry(rl, WALL_HEIGHT),
      new THREE.Vector3(rw / 2, WALL_HEIGHT / 2, 0),
      -Math.PI / 2,
    );

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(rw, rl),
      new THREE.MeshStandardMaterial({
        color: room.ceilingColor ?? "#f8f8f8",
        roughness: 0.6,
      }),
    );
    ceilingMaterialRef.current = ceiling.material as THREE.MeshStandardMaterial;
    ceiling.position.y = WALL_HEIGHT;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const hemi = new THREE.HemisphereLight(0xfff5e5, 0x2a2018, 0.35);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff4e6, 1.5);
    sun.position.set(rw * 0.5, WALL_HEIGHT * 1.5, rl * 0.8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);
    scene.add(new THREE.DirectionalLight(0xffffff, 0.3).translateX(-rw));
    const pointLight = new THREE.PointLight(0xffe8c7, 1.2, 60, 1.6);
    pointLight.position.set(-rw * 0.2, WALL_HEIGHT * 0.9, -rl * 0.1);
    scene.add(pointLight);

    const spotlight = new THREE.SpotLight(0xfff1db, 2, 0, Math.PI / 5, 0.35, 1);
    spotlight.position.set(rw * 0.25, WALL_HEIGHT * 1.4, rl * 0.2);
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.set(1024, 1024);
    spotlight.shadow.bias = -0.0005;
    spotlightRef.current = spotlight;
    scene.add(spotlight);
    scene.add(spotlight.target);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(rw, rl),
      new THREE.ShadowMaterial({ opacity: 0.35 }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.01;
    shadowPlane.receiveShadow = true;
    shadowPlaneRef.current = shadowPlane;
    scene.add(shadowPlane);

    sceneRef.current = scene;
    cameraRef.current = camera;
    setSceneToken((prev) => prev + 1);

    // Simple orbit via mouse
    let isDragging = false;
    let prevX = 0,
      prevY = 0;
    let theta = Math.PI / 4,
      phi = Math.PI / 4;
    const baseRadius = maxDim * 1.5;
    let radius = baseRadius;
    const minRadius = Math.max(4, maxDim * 0.45);
    const maxRadius = Math.max(minRadius + 2, maxDim * 3.2);

    const updateCamera = () => {
      camera.position.x = radius * Math.sin(theta) * Math.cos(phi);
      camera.position.y = radius * Math.sin(phi);
      camera.position.z = radius * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(0, WALL_HEIGHT * 0.3, 0);
    };

    const syncZoomLevel = () => {
      const percent = Math.round((baseRadius / radius) * 100);
      setZoomLevel(Math.max(25, Math.min(250, percent)));
    };

    const applyZoomFactor = (factor: number) => {
      radius = Math.min(maxRadius, Math.max(minRadius, radius * factor));
      updateCamera();
      syncZoomLevel();
    };

    zoomControllerRef.current = {
      zoomIn: () => applyZoomFactor(0.92),
      zoomOut: () => applyZoomFactor(1.08),
      reset: () => {
        radius = baseRadius;
        updateCamera();
        syncZoomLevel();
      },
    };

    updateCamera();
    syncZoomLevel();

    const onDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onUp = () => {
      isDragging = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      theta += (e.clientX - prevX) * 0.005;
      phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.1, phi + (prevY - e.clientY) * 0.005),
      );
      prevX = e.clientX;
      prevY = e.clientY;
      updateCamera();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyZoomFactor(e.deltaY > 0 ? 1.08 : 0.92);
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersected = raycaster.intersectObjects(
        Object.values(furnitureModelsRef.current),
        true,
      );

      const firstHit = intersected[0];
      if (!firstHit) {
        setSelectedFurnitureId(null);
        return;
      }

      let current: THREE.Object3D | null = firstHit.object;
      while (current) {
        const furnitureId = current.userData?.furnitureId as string | undefined;
        if (furnitureId) {
          setSelectedFurnitureId(furnitureId);
          return;
        }
        current = current.parent;
      }

      setSelectedFurnitureId(null);
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("wheel", onWheel, {
      passive: false,
    });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMouseMove);

    const drawWireframe = () => {
      const ctx = wireframeContextRef.current;
      const canvas = wireframeCanvasRef.current;
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const margin = 32;
      const drawW = canvas.width - margin * 2;
      const drawH = canvas.height - margin * 2;

      const roomRect = {
        x: margin,
        y: margin,
        w: drawW,
        h: drawH,
      };

      drawRasterLine(
        ctx,
        roomRect.x,
        roomRect.y,
        roomRect.x + roomRect.w,
        roomRect.y,
        wireframeColor,
      );
      drawRasterLine(
        ctx,
        roomRect.x + roomRect.w,
        roomRect.y,
        roomRect.x + roomRect.w,
        roomRect.y + roomRect.h,
        wireframeColor,
      );
      drawRasterLine(
        ctx,
        roomRect.x + roomRect.w,
        roomRect.y + roomRect.h,
        roomRect.x,
        roomRect.y + roomRect.h,
        wireframeColor,
      );
      drawRasterLine(
        ctx,
        roomRect.x,
        roomRect.y + roomRect.h,
        roomRect.x,
        roomRect.y,
        wireframeColor,
      );

      const gridCount = 6;
      for (let i = 1; i < gridCount; i += 1) {
        const x = Math.round(roomRect.x + (roomRect.w / gridCount) * i);
        const y = Math.round(roomRect.y + (roomRect.h / gridCount) * i);
        drawRasterLine(
          ctx,
          x,
          roomRect.y,
          x,
          roomRect.y + roomRect.h,
          wireframeGridColor,
        );
        drawRasterLine(
          ctx,
          roomRect.x,
          y,
          roomRect.x + roomRect.w,
          y,
          wireframeGridColor,
        );
      }
    };

    drawWireframe();

    // Animation
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
      if (process.env.NODE_ENV !== "production") {
        const now = performance.now();
        fpsRef.current.frames += 1;
        const delta = now - fpsRef.current.last;
        if (delta >= 500) {
          const nextFps = Math.round((fpsRef.current.frames * 1000) / delta);
          fpsRef.current.frames = 0;
          fpsRef.current.last = now;
          setFps(nextFps);
        }
      }
    };
    animate();

    // Resize
    const onResize = () => {
      const w2 = container.clientWidth;
      const h2 = container.clientHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
      if (wireframeCanvasRef.current) {
        wireframeCanvasRef.current.width = w2;
        wireframeCanvasRef.current.height = h2;
      }
      drawWireframe();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("wheel", onWheel);
      zoomControllerRef.current = null;
      floorTextureRef.current?.dispose();
      floorTextureRef.current = null;
      aoTextureRef.current?.dispose();
      aoTextureRef.current = null;
      floorMaterialRef.current = null;
      wallMaterialRef.current = null;
      ceilingMaterialRef.current = null;
      envTexture.dispose();
      pmrem.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      furnitureModelsRef.current = {};
      loadingIdsRef.current.clear();
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [
    room.dimensions.width,
    room.dimensions.length,
    wireframeColor,
    wireframeGridColor,
  ]);

  useEffect(() => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    if (!scene || !renderer) return;

    const gltfLoader = gltfLoaderRef.current ?? new GLTFLoader();
    gltfLoaderRef.current = gltfLoader;
    let isStale = false;
    const activeLoads = new Set<string>();

    const disposeObject = (object: THREE.Object3D) => {
      object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
    };

    const removeModel = (id: string) => {
      const existing = furnitureModelsRef.current[id];
      if (!existing) return;
      scene.remove(existing);
      disposeObject(existing);
      delete furnitureModelsRef.current[id];
      loadingIdsRef.current.delete(id);
    };

    const addFallbackMesh = (item: Furniture3DItem) => {
      const itemHeight = Math.min(item.width, item.length) * 0.4;
      const geo = new THREE.BoxGeometry(item.width, itemHeight, item.length);
      if (geo.attributes.uv) {
        geo.setAttribute("uv2", geo.attributes.uv);
      }
      const mat = buildMaterial(
        shadingMode,
        furnitureColorsRef.current[item.id] || item.color,
      );
      const mesh = new THREE.Mesh(geo, mat);
      const transform =
        furnitureTransformsRef.current[item.id] ?? getDefaultTransform(item);
      const wrapper = new THREE.Group();

      wrapper.position.set(transform.x, transform.y, transform.z);
      wrapper.scale.setScalar(transform.scale);
      wrapper.rotation.y = -THREE.MathUtils.degToRad(transform.rotation);

      wrapper.userData.furnitureId = item.id;
      wrapper.userData.modelPath = "";
      mesh.userData.furnitureId = item.id;

      mesh.position.y = itemHeight / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      wrapper.add(mesh);
      scene.add(wrapper);
      furnitureModelsRef.current[item.id] = wrapper;
    };

    const addLoadedModel = (
      item: Furniture3DItem,
      loadedScene: THREE.Object3D,
      modelPath: string,
    ) => {
      const model = loadedScene;
      const transform =
        furnitureTransformsRef.current[item.id] ?? getDefaultTransform(item);

      model.rotation.y = 0;
      model.updateMatrixWorld(true);

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const color = furnitureColorsRef.current[item.id] || item.color;
          const nextMaterial = buildMaterial(shadingMode, color);
          if ((mesh.geometry as THREE.BufferGeometry).attributes.uv) {
            (mesh.geometry as THREE.BufferGeometry).setAttribute(
              "uv2",
              (mesh.geometry as THREE.BufferGeometry).attributes.uv,
            );
          }
          mesh.material = nextMaterial;

          mesh.userData.furnitureId = item.id;
        }
      });

      const bbox = new THREE.Box3().setFromObject(model);
      const size = bbox.getSize(new THREE.Vector3());
      const maxSafe = 0.001;
      const safeX = Math.max(size.x, maxSafe);
      const safeZ = Math.max(size.z, maxSafe);
      const modelScale = Math.min(item.width / safeX, item.length / safeZ);
      model.scale.setScalar(modelScale);
      model.updateMatrixWorld(true);

      const scaledBbox = new THREE.Box3().setFromObject(model);
      const center = scaledBbox.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -scaledBbox.min.y, -center.z);
      model.updateMatrixWorld(true);

      const wrapper = new THREE.Group();
      wrapper.position.set(transform.x, transform.y, transform.z);
      wrapper.scale.setScalar(transform.scale);
      wrapper.rotation.y = -THREE.MathUtils.degToRad(transform.rotation);
      wrapper.userData.furnitureId = item.id;
      wrapper.userData.modelPath = modelPath;

      wrapper.add(model);

      scene.add(wrapper);
      furnitureModelsRef.current[item.id] = wrapper;
    };

    const nextIds = new Set(furniture.map((item) => item.id));
    Object.keys(furnitureModelsRef.current).forEach((id) => {
      if (!nextIds.has(id)) {
        removeModel(id);
      }
    });

    const itemsToLoad: Array<{
      item: Furniture3DItem;
      modelPath?: string;
    }> = [];

    furniture.forEach((item) => {
      const modelPath = resolveModelPath(item);
      const existing = furnitureModelsRef.current[item.id];
      const existingPath = existing?.userData?.modelPath as string | undefined;
      if (existing && existingPath === (modelPath ?? "")) {
        return;
      }
      if (existing) {
        removeModel(item.id);
      }
      if (loadingIdsRef.current.has(item.id)) {
        return;
      }
      itemsToLoad.push({ item, modelPath });
    });

    pendingLoadsRef.current = itemsToLoad.length;
    setIsLoading(itemsToLoad.length > 0);

    const finishLoad = () => {
      pendingLoadsRef.current -= 1;
      if (pendingLoadsRef.current <= 0) {
        setIsLoading(false);
      }
    };

    if (itemsToLoad.length === 0) {
      setIsLoading(false);
    }

    itemsToLoad.forEach(({ item, modelPath }) => {
      if (!modelPath) {
        addFallbackMesh(item);
        finishLoad();
        return;
      }

      const cached = modelCacheRef.current.get(modelPath);
      if (cached) {
        addLoadedModel(item, cloneSkeleton(cached), modelPath);
        finishLoad();
        return;
      }

      loadingIdsRef.current.add(item.id);
      activeLoads.add(item.id);
      gltfLoader.load(
        modelPath,
        (gltf) => {
          if (isStale) {
            loadingIdsRef.current.delete(item.id);
            return;
          }
          modelCacheRef.current.set(modelPath, gltf.scene);
          addLoadedModel(item, cloneSkeleton(gltf.scene), modelPath);
          loadingIdsRef.current.delete(item.id);
          finishLoad();
        },
        undefined,
        () => {
          if (isStale) {
            loadingIdsRef.current.delete(item.id);
            return;
          }
          addFallbackMesh(item);
          loadingIdsRef.current.delete(item.id);
          finishLoad();
        },
      );
    });

    return () => {
      isStale = true;
      activeLoads.forEach((id) => loadingIdsRef.current.delete(id));
    };
  }, [
    buildMaterial,
    furniture,
    getDefaultTransform,
    room.dimensions.length,
    room.dimensions.width,
    sceneToken,
    shadingMode,
  ]);

  useEffect(() => {
    const wallMaterial = wallMaterialRef.current;
    if (!wallMaterial) return;

    wallMaterial.color.set(room.wallColor);
    wallMaterial.needsUpdate = true;
  }, [room.wallColor]);

  useEffect(() => {
    const ceilingMaterial = ceilingMaterialRef.current;
    if (!ceilingMaterial) return;
    ceilingMaterial.color.set(room.ceilingColor ?? "#f8f8f8");
    ceilingMaterial.needsUpdate = true;
  }, [room.ceilingColor]);

  const selectedFurniture =
    furniture.find((item) => item.id === selectedFurnitureId) ?? null;
  const selectedTransform = selectedFurnitureId
    ? furnitureTransforms[selectedFurnitureId]
    : null;

  useEffect(() => {
    const highlight = new THREE.Color("#f4b46a");
    Object.values(furnitureModelsRef.current).forEach((group) => {
      group.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const mesh = child as THREE.Mesh;
        const id = mesh.userData?.furnitureId as string | undefined;
        const isSelected = id && id === selectedFurnitureId;
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        materials.forEach((material) => {
          const mat = material as THREE.MeshStandardMaterial;
          if ("emissive" in mat) {
            mat.emissive.set(isSelected ? highlight : new THREE.Color(0x000000));
            mat.emissiveIntensity = isSelected ? 0.5 : 0;
            mat.needsUpdate = true;
          }
        });
      });
    });
  }, [selectedFurnitureId]);

  const updateSelectedTransform = (
    key: keyof FurnitureTransform,
    value: number,
  ) => {
    if (!selectedFurnitureId) return;

    setFurnitureTransforms((prev) => {
      const current = prev[selectedFurnitureId];
      if (!current) return prev;

      const next = {
        ...prev,
        [selectedFurnitureId]: {
          ...current,
          [key]: value,
        },
      };

      furnitureTransformsRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    const floorMaterial = floorMaterialRef.current;
    const renderer = rendererRef.current;
    if (!floorMaterial || !renderer) return;

    const rw = room.dimensions.width;
    const rl = room.dimensions.length;

    const nextTexture = new THREE.TextureLoader().load(
      FLOOR_TEXTURES[room.floorType],
    );
    nextTexture.wrapS = THREE.RepeatWrapping;
    nextTexture.wrapT = THREE.RepeatWrapping;
    nextTexture.repeat.set(Math.max(1, rw / 4), Math.max(1, rl / 4));
    nextTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const previousTexture = floorTextureRef.current;
    floorMaterial.map = nextTexture;
    floorMaterial.color.set(room.floorColor);
    floorMaterial.roughness =
      room.floorType === "carpet" ? 0.9 : room.floorType === "tile" ? 0.3 : 0.5;
    floorMaterial.metalness = room.floorType === "tile" ? 0.2 : 0;
    floorMaterial.aoMapIntensity = 0.6;
    floorMaterial.needsUpdate = true;

    floorTextureRef.current = nextTexture;
    previousTexture?.dispose();
  }, [
    room.floorType,
    room.floorColor,
    room.dimensions.width,
    room.dimensions.length,
  ]);

  useEffect(() => {
    Object.values(furnitureModelsRef.current).forEach((group) => {
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const id = mesh.userData?.furnitureId as string | undefined;
          const currentFurniture = furnitureRef.current;
          const color = id
            ? furnitureColorsRef.current[id] ||
              currentFurniture.find((f) => f.id === id)?.color ||
              "#999999"
            : "#999999";
          mesh.material = buildMaterial(shadingMode, color);
        }
      });
    });
  }, [buildMaterial, sceneToken, shadingMode]);

  useEffect(() => {
    const spotlight = spotlightRef.current;
    if (!spotlight) return;

    if (furniture.length === 0) {
      spotlight.target.position.set(0, 0, 0);
      spotlight.intensity = 1.6;
      return;
    }

    const avg = furniture.reduce(
      (acc, item) => {
        acc.x += item.x;
        acc.y += item.y;
        return acc;
      },
      { x: 0, y: 0 },
    );
    const centerX = avg.x / furniture.length - room.dimensions.width / 2;
    const centerZ = avg.y / furniture.length - room.dimensions.length / 2;
    spotlight.target.position.set(centerX, 0, centerZ);
    spotlight.intensity = 1.8;
  }, [furniture, room.dimensions.length, room.dimensions.width]);

  useEffect(() => {
    const spotlight = spotlightRef.current;
    if (!spotlight) return;
    const colorInfluence = Object.values(furnitureColors).length
      ? 0xffe6c7
      : 0xfff1db;
    spotlight.color = new THREE.Color(colorInfluence);
  }, [furnitureColors]);

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xl flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-40">
        <Link
          href="/design"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-body">Back to 2D</span>
        </Link>
        <div className="h-5 w-px bg-border" />
        <h1 className="font-display text-lg font-semibold text-foreground">
          3D Room View
        </h1>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="h-8 px-2 rounded-md border border-border bg-background text-xs font-body text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Undo2 className="w-4 h-4" /> Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="h-8 px-2 rounded-md border border-border bg-background text-xs font-body text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Redo2 className="w-4 h-4" /> Redo
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* 3D Canvas */}
        <div
          ref={mountRef}
          className="flex-1 min-h-0 relative"
          tabIndex={0}
          role="application"
          aria-label="3D room view canvas"
        >
          <canvas
            ref={wireframeCanvasRef}
            className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
              isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
          {isLoading && (
            <div className="absolute bottom-4 left-4 text-[11px] font-body text-warm-dark-foreground bg-warm-dark-foreground/10 backdrop-blur-sm border border-warm-dark-foreground/20 rounded-full px-3 py-1.5">
              Rasterizing room wireframe…
            </div>
          )}
          {process.env.NODE_ENV !== "production" && (
            <div className="absolute top-3 left-3 text-[11px] font-body text-foreground bg-background/80 border border-border rounded-full px-2 py-1">
              {fps} FPS
            </div>
          )}
        </div>

        {/* Side panel */}
        <aside className="w-64 h-full min-h-0 border-l border-border bg-card/50 p-4 overflow-y-auto space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-2.5 py-2 text-[11px] text-accent font-body">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Loading 3D models...
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-body">
              Shading Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "flat", label: "Flat" },
                  { id: "gouraud", label: "Gouraud" },
                  { id: "phong", label: "Phong" },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setShadingMode(mode.id)}
                  className={`h-8 rounded-md border text-[11px] font-body transition-all ${
                    shadingMode === mode.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-body">
              Zoom
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleZoomControl("out")}
                className="h-8 w-8 rounded-md border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted"
                title="Zoom out"
                aria-label="Zoom out"
              >
                −
              </button>
              <button
                onClick={() => handleZoomControl("in")}
                className="h-8 w-8 rounded-md border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted"
                title="Zoom in"
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                onClick={() => handleZoomControl("reset")}
                className="h-8 px-2 rounded-md border border-border bg-background text-[11px] font-body text-foreground hover:bg-muted"
                aria-label="Reset zoom"
              >
                Reset
              </button>
              <span className="text-[11px] text-muted-foreground font-body ml-auto">
                {zoomLevel}%
              </span>
            </div>
          </div>
          <h3 className="font-display text-sm font-semibold text-foreground">
            Furniture Position
          </h3>
          {selectedFurniture && selectedTransform ? (
            <div className="space-y-2.5 rounded-md border border-border bg-background/60 p-3">
              <p className="text-xs font-body font-medium text-foreground">
                {selectedFurniture.name}
              </p>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-body flex justify-between">
                  <span>X</span>
                  <span>{selectedTransform.x.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min={-room.dimensions.width / 2}
                  max={room.dimensions.width / 2}
                  step={0.1}
                  value={selectedTransform.x}
                  onChange={(e) =>
                    updateSelectedTransform("x", Number(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-body flex justify-between">
                  <span>Y</span>
                  <span>{selectedTransform.y.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min={-1}
                  max={10}
                  step={0.1}
                  value={selectedTransform.y}
                  onChange={(e) =>
                    updateSelectedTransform("y", Number(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-body flex justify-between">
                  <span>Z</span>
                  <span>{selectedTransform.z.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min={-room.dimensions.length / 2}
                  max={room.dimensions.length / 2}
                  step={0.1}
                  value={selectedTransform.z}
                  onChange={(e) =>
                    updateSelectedTransform("z", Number(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-body flex justify-between">
                  <span>Scale</span>
                  <span>{selectedTransform.scale.toFixed(2)}x</span>
                </label>
                <input
                  type="range"
                  min={0.3}
                  max={3}
                  step={0.01}
                  value={selectedTransform.scale}
                  onChange={(e) =>
                    updateSelectedTransform("scale", Number(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-body flex justify-between">
                  <span>Rotation</span>
                  <span>{Math.round(selectedTransform.rotation)}°</span>
                </label>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={selectedTransform.rotation}
                  onChange={(e) =>
                    updateSelectedTransform("rotation", Number(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-body">
              Click a furniture model to edit X, Y, Z and scale.
            </p>
          )}

          <div className="h-px bg-border" />

          <h3 className="font-display text-sm font-semibold text-foreground">
            Floor Settings
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-body">
              Floor Type
            </label>
            <select
              value={room.floorType}
              onChange={(e) =>
                handleFloorTypeChange(e.target.value as FloorType)
              }
              className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm font-body text-foreground"
            >
              <option value="tile">Tile</option>
              <option value="carpet">Carpet</option>
              <option value="wood">Wood</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-body">
              Floor Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={room.floorColor}
                aria-label="Floor color"
                onChange={(e) => handleFloorColorChange(e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <span className="text-[11px] text-muted-foreground font-body uppercase tracking-wide">
                {room.floorColor}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FLOOR_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleFloorColorChange(preset.value)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    room.floorColor.toLowerCase() === preset.value.toLowerCase()
                      ? "border-accent scale-110"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-body">
              Wall Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={room.wallColor}
                aria-label="Wall color"
                onChange={(e) => handleWallColorChange(e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <span className="text-[11px] text-muted-foreground font-body uppercase tracking-wide">
                {room.wallColor}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {WALL_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleWallColorChange(preset.value)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    room.wallColor.toLowerCase() === preset.value.toLowerCase()
                      ? "border-accent scale-110"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.label}
                />
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          <h3 className="font-display text-sm font-semibold text-foreground">
            Furniture Colors
          </h3>
          {furniture.length === 0 ? (
            <p className="text-xs text-muted-foreground font-body">
              No furniture in this design.
            </p>
          ) : (
            <div className="space-y-3">
              {furniture.map((item) => (
                <div
                  key={item.id}
                  role="group"
                  aria-label={`${item.name} model`}
                  className={`flex items-center gap-2 rounded-md p-1 ${
                    selectedFurnitureId === item.id
                      ? "bg-accent/10 border border-accent/40"
                      : "border border-transparent"
                  }`}
                >
                  <input
                    type="color"
                    value={furnitureColors[item.id] || item.color}
                    aria-label={`${item.name} color`}
                    onChange={(e) => handleColorChange(item.id, e.target.value)}
                    className="w-7 h-7 rounded border border-border cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-body font-medium text-foreground">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-body">
                      {item.width}×{item.length}ft
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground font-body mt-4">
            Drag to orbit • Scroll to zoom • Models load where available
          </p>
        </aside>
      </div>
    </div>
  );
};

export default ThreeDView;
