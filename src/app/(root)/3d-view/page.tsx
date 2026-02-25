"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ArrowLeft } from "lucide-react";

interface Room3DState {
  dimensions: { width: number; length: number };
  wallColor: string;
  floorColor: string;
  floorType: FloorType;
}

type FloorType = "tile" | "carpet" | "wood";

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

const getInitialViewState = () => {
  if (typeof window === "undefined") {
    return DEFAULT_VIEW_STATE;
  }

  const raw = sessionStorage.getItem("furnexa:3d-view");
  if (!raw) {
    return DEFAULT_VIEW_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as {
      room?: Room3DState;
      furniture?: Furniture3DItem[];
    };

    if (parsed.room && Array.isArray(parsed.furniture)) {
      return {
        room: {
          ...parsed.room,
          floorType: isFloorType(parsed.room.floorType)
            ? parsed.room.floorType
            : "tile",
        },
        furniture: parsed.furniture,
      };
    }
  } catch {
    // ignore invalid stored payload and use defaults
  }

  return DEFAULT_VIEW_STATE;
};

const ThreeDViewPage = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const floorMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const wallMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const floorTextureRef = useRef<THREE.Texture | null>(null);
  const zoomControllerRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    reset: () => void;
  } | null>(null);
  const [viewState, setViewState] = useState(getInitialViewState);
  const [zoomLevel, setZoomLevel] = useState(100);
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
  const roomStyleRef = useRef({
    floorType: room.floorType,
    floorColor: room.floorColor,
    wallColor: room.wallColor,
  });

  useEffect(() => {
    furnitureColorsRef.current = furnitureColors;
  }, [furnitureColors]);

  useEffect(() => {
    roomStyleRef.current = {
      floorType: room.floorType,
      floorColor: room.floorColor,
      wallColor: room.wallColor,
    };
  }, [room.floorType, room.floorColor, room.wallColor]);

  const furnitureModelsRef = useRef<Record<string, THREE.Object3D>>({});

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
    const model = furnitureModelsRef.current[id];
    if (model) {
      model.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (
            mesh.material &&
            (mesh.material as THREE.MeshStandardMaterial).color
          ) {
            (mesh.material as THREE.MeshStandardMaterial).color.set(color);
          }
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
  };

  const handleFloorColorChange = (floorColor: string) => {
    setViewState((prev) => ({
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
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

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

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
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
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(rw, rl), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    wallMaterialRef.current = wallMat;
    const addWall = (
      geo: THREE.PlaneGeometry,
      pos: THREE.Vector3,
      rotY: number,
    ) => {
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
      new THREE.MeshStandardMaterial({ color: "#f8f8f8", roughness: 0.6 }),
    );
    ceiling.position.y = WALL_HEIGHT;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sun = new THREE.DirectionalLight(0xfff4e6, 1.5);
    sun.position.set(rw * 0.5, WALL_HEIGHT * 1.5, rl * 0.8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);
    scene.add(new THREE.DirectionalLight(0xffffff, 0.3).translateX(-rw));

    const gltfLoader = new GLTFLoader();
    let disposed = false;

    const addFallbackMesh = (item: Furniture3DItem) => {
      const itemHeight = Math.min(item.width, item.length) * 0.4;
      const geo = new THREE.BoxGeometry(item.width, itemHeight, item.length);
      const mat = new THREE.MeshStandardMaterial({
        color: furnitureColorsRef.current[item.id] || item.color,
        roughness: 0.3,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const transform =
        furnitureTransformsRef.current[item.id] ?? getDefaultTransform(item);
      const wrapper = new THREE.Group();

      wrapper.position.set(transform.x, transform.y, transform.z);
      wrapper.scale.setScalar(transform.scale);
      wrapper.rotation.y = -THREE.MathUtils.degToRad(transform.rotation);

      wrapper.userData.furnitureId = item.id;
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
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => {
              const standardMat = material as THREE.MeshStandardMaterial;
              if (standardMat.color) {
                standardMat.color.set(color);
              }
            });
          } else {
            const standardMat = mesh.material as THREE.MeshStandardMaterial;
            if (standardMat?.color) {
              standardMat.color.set(color);
            }
          }

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

      wrapper.add(model);

      scene.add(wrapper);
      furnitureModelsRef.current[item.id] = wrapper;
    };

    furniture.forEach((item) => {
      const modelPath = resolveModelPath(item);
      if (!modelPath) {
        addFallbackMesh(item);
        return;
      }

      gltfLoader.load(
        modelPath,
        (gltf) => {
          if (disposed) return;
          addLoadedModel(item, gltf.scene);
        },
        undefined,
        () => {
          if (disposed) return;
          addFallbackMesh(item);
        },
      );
    });

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

    // Animation
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w2 = container.clientWidth;
      const h2 = container.clientHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("wheel", onWheel);
      zoomControllerRef.current = null;
      floorTextureRef.current?.dispose();
      floorTextureRef.current = null;
      floorMaterialRef.current = null;
      wallMaterialRef.current = null;
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
    };
  }, [room.dimensions.width, room.dimensions.length, furniture, getDefaultTransform]);

  useEffect(() => {
    const wallMaterial = wallMaterialRef.current;
    if (!wallMaterial) return;

    wallMaterial.color.set(room.wallColor);
    wallMaterial.needsUpdate = true;
  }, [room.wallColor]);

  const selectedFurniture =
    furniture.find((item) => item.id === selectedFurnitureId) ?? null;
  const selectedTransform = selectedFurnitureId
    ? furnitureTransforms[selectedFurnitureId]
    : null;

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
    floorMaterial.needsUpdate = true;

    floorTextureRef.current = nextTexture;
    previousTexture?.dispose();
  }, [
    room.floorType,
    room.floorColor,
    room.dimensions.width,
    room.dimensions.length,
  ]);

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
      </header>

      <div className="flex flex-1 min-h-0">
        {/* 3D Canvas */}
        <div ref={mountRef} className="flex-1 min-h-0" />

        {/* Side panel */}
        <aside className="w-64 h-full min-h-0 border-l border-border bg-card/50 p-4 overflow-y-auto space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-body">
              Zoom
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleZoomControl("out")}
                className="h-8 w-8 rounded-md border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted"
                title="Zoom out"
              >
                −
              </button>
              <button
                onClick={() => handleZoomControl("in")}
                className="h-8 w-8 rounded-md border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted"
                title="Zoom in"
              >
                +
              </button>
              <button
                onClick={() => handleZoomControl("reset")}
                className="h-8 px-2 rounded-md border border-border bg-background text-[11px] font-body text-foreground hover:bg-muted"
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
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={furnitureColors[item.id] || item.color}
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

export default ThreeDViewPage;
