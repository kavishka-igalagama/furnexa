"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Undo2, Redo2, Box, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomForm, { type RoomSpec } from "@/components/design/RoomForm";
import FurniturePanel, {
  type FurnitureItem,
} from "@/components/design/FurniturePanel";
import RoomCanvas from "@/components/design/RoomCanvas";
import TemplatesDialog from "@/components/design/TemplatesDialog";
import type { RoomTemplate } from "@/data/templates";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useMutation } from "@/hooks/use-mutation";
import { useRoomTemplates } from "@/hooks/use-room-templates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDesignContext, type Theme } from "@/context/DesignContext";

type DesignPayload = {
  name?: string;
  theme?: {
    id: string;
    label: string;
    wallColor: string;
    floorColor: string;
    floorType: RoomSpec["floorType"];
    furnitureColor: string;
    ceilingColor?: string;
  } | null;
  globalColors?: {
    walls?: string;
    floor?: string;
    ceiling?: string;
    furniture?: string;
  } | null;
  roomSpecs: {
    width: number;
    length: number;
    wallColor: string;
    floorColor: string;
    floorType: RoomSpec["floorType"];
    ceilingColor?: string;
  };
  furnitureItems: Array<{
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
};

type DesignResponse = { design: { id: string } };

const loadStoredThemes = (): Theme[] => {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem("furnexa_custom_themes");
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (theme) =>
        theme?.id && theme?.label && theme?.wallColor && theme?.floorColor,
    );
  } catch {
    return [];
  }
};

const DesignPage = () => {
  const router = useRouter();
  const {
    state,
    designId,
    setDesignId,
    setState,
    applyAction,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDesignContext();
  const { templates, isLoading: templatesLoading } = useRoomTemplates();
  const { room, furniture, activeTheme, globalColors } = state;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [customThemes, setCustomThemes] = useState<Theme[]>(loadStoredThemes);
  const [customThemeName, setCustomThemeName] = useState("");

  const themes: Theme[] = [
    {
      id: "modern",
      label: "Modern",
      wallColor: "#F5F0EB",
      floorColor: "#d4a76a",
      floorType: "tile",
      furnitureColor: "#c6c2be",
      ceilingColor: "#F8F8F8",
    },
    {
      id: "scandinavian",
      label: "Scandinavian",
      wallColor: "#F7F2EC",
      floorColor: "#e8e4e0",
      floorType: "wood",
      furnitureColor: "#d8c9b8",
      ceilingColor: "#FCFBF9",
    },
    {
      id: "industrial",
      label: "Industrial",
      wallColor: "#E2E2E2",
      floorColor: "#8b8f93",
      floorType: "tile",
      furnitureColor: "#6b6f73",
      ceilingColor: "#EFEFEF",
    },
  ];
  const allThemes = [...themes, ...customThemes];

  const commit = useCallback(
    (type: string, updater: (prev: typeof state) => typeof state) => {
      const next = updater(state);
      applyAction(type, next);
    },
    [applyAction, state],
  );

  useEffect(() => {
    window.localStorage.setItem(
      "furnexa_custom_themes",
      JSON.stringify(customThemes),
    );
  }, [customThemes]);

  const saveDesign = useMutation<DesignResponse, DesignPayload>(
    async (payload) => {
      const url = designId ? `/api/designs/${designId}` : "/api/designs";
      const method = designId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const message = await res.json().catch(() => ({}));
        const errorText = message?.error || "Failed to save design";
        throw new Error(errorText);
      }

      return (await res.json()) as DesignResponse;
    },
  );

  const handleAddFurniture = (template: Omit<FurnitureItem, "id">) => {
    const newItem = {
      ...template,
      id: crypto.randomUUID(),
      x: room.width / 2 - template.width / 2,
      y: room.height / 2 - template.height / 2,
      rotation: 0,
    };
    commit("add-furniture", (prev) => ({
      ...prev,
      furniture: [...prev.furniture, newItem],
    }));
    setSelectedId(newItem.id);
    toast.success(`${template.label} added`);
  };

  const handleMove = useCallback(
    (id: string, x: number, y: number) => {
      commit("move-furniture", (prev) => ({
        ...prev,
        furniture: prev.furniture.map((f) =>
          f.id === id ? { ...f, x, y } : f,
        ),
      }));
    },
    [commit],
  );

  const handleResize = useCallback(
    (id: string, width: number, height: number, x: number, y: number) => {
      commit("scale-furniture", (prev) => ({
        ...prev,
        furniture: prev.furniture.map((f) =>
          f.id === id
            ? {
                ...f,
                width,
                height,
                x,
                y,
              }
            : f,
        ),
      }));
    },
    [commit],
  );

  const handleDelete = useCallback(
    (id: string) => {
      commit("delete-furniture", (prev) => ({
        ...prev,
        furniture: prev.furniture.filter((f) => f.id !== id),
      }));
      setSelectedId(null);
      toast.success("Item removed");
    },
    [commit],
  );

  const handleRotate = (id: string, rotation: number) => {
    commit("rotate-furniture", (prev) => ({
      ...prev,
      furniture: prev.furniture.map((f) =>
        f.id === id ? { ...f, rotation } : f,
      ),
    }));
  };

  const handleColorChange = (id: string, color: string) => {
    commit("recolor-furniture", (prev) => ({
      ...prev,
      furniture: prev.furniture.map((f) => (f.id === id ? { ...f, color } : f)),
    }));
  };

  const handleClear = () => {
    if (furniture.length === 0) return;
    commit("clear-furniture", (prev) => ({ ...prev, furniture: [] }));
    setSelectedId(null);
    toast.success("Canvas cleared");
  };

  const handleTemplateSelect = (template: RoomTemplate) => {
    const items = template.defaultFurniture.map((f) => ({
      id: crypto.randomUUID(),
      type: f.type,
      label: f.name,
      width: f.width,
      height: f.length,
      color: f.color,
      x: f.x,
      y: f.y,
      rotation: f.rotation ?? 0,
    }));
    commit("apply-template", (prev) => ({
      ...prev,
      room: {
        width: template.dimensions.width,
        height: template.dimensions.length,
        wallColor: template.suggestedWallColor,
        floorColor: template.suggestedFloorColor,
        floorType: template.suggestedFloorType as RoomSpec["floorType"],
        ceilingColor: prev.room.ceilingColor ?? "#F8F8F8",
      },
      activeTheme: null,
      furniture: items,
    }));
    setSelectedId(null);
    toast.success(`${template.name} template applied`);
  };

  const buildPayload = (): DesignPayload => ({
    theme: activeTheme,
    globalColors,
    roomSpecs: {
      width: room.width,
      length: room.height,
      wallColor: room.wallColor,
      floorColor: room.floorColor,
      floorType: room.floorType,
      ceilingColor: room.ceilingColor,
    },
    furnitureItems: furniture.map((item) => ({
      id: item.id,
      modelId: item.modelId ?? item.type,
      x: item.x,
      y: item.y,
      z: 0,
      rotation: item.rotation || 0,
      scale: 1,
      color: item.color,
      width: item.width,
      length: item.height,
      name: item.label,
      type: item.type,
      modelPath: item.modelPath,
    })),
  });

  const applyTheme = (theme: Theme) => {
    commit("apply-theme", (prev) => ({
      ...prev,
      activeTheme: theme,
      room: {
        ...prev.room,
        wallColor: theme.wallColor,
        floorColor: theme.floorColor,
        floorType: theme.floorType,
        ceilingColor: theme.ceilingColor ?? prev.room.ceilingColor,
      },
      furniture: prev.furniture.map((item) => ({
        ...item,
        color: theme.furnitureColor,
      })),
      globalColors: {
        walls: theme.wallColor,
        floor: theme.floorColor,
        ceiling: theme.ceilingColor,
        furniture: theme.furnitureColor,
      },
    }));
    toast.success(`${theme.label} theme applied`);
  };

  const applyGlobalColor = (
    target: "walls" | "floor" | "ceiling" | "furniture",
    color: string,
  ) => {
    commit("apply-global-color", (prev) => {
      const nextRoom = { ...prev.room };
      let nextFurniture = prev.furniture;
      if (target === "walls") nextRoom.wallColor = color;
      if (target === "floor") nextRoom.floorColor = color;
      if (target === "ceiling") nextRoom.ceilingColor = color;
      if (target === "furniture") {
        nextFurniture = prev.furniture.map((item) => ({ ...item, color }));
      }

      return {
        ...prev,
        room: nextRoom,
        furniture: nextFurniture,
        globalColors: { ...prev.globalColors, [target]: color },
        activeTheme: null,
      };
    });
    const labelMap: Record<typeof target, string> = {
      walls: "Walls",
      floor: "Floor",
      ceiling: "Ceiling",
      furniture: "Furniture",
    };
    toast.success(`${labelMap[target]} color updated`, {
      id: `global-${target}`,
      duration: 1200,
    });
  };

  const handleSaveCustomTheme = () => {
    const name = customThemeName.trim() || "Custom Theme";
    const newTheme = {
      id: `custom-${crypto.randomUUID()}`,
      label: name,
      wallColor: globalColors.walls ?? room.wallColor,
      floorColor: globalColors.floor ?? room.floorColor,
      floorType: room.floorType,
      furnitureColor: globalColors.furniture ?? "#c6c2be",
      ceilingColor: globalColors.ceiling ?? room.ceilingColor ?? "#F8F8F8",
    };
    setCustomThemes((prev) => [newTheme, ...prev].slice(0, 12));
    setCustomThemeName("");
    applyTheme(newTheme);
  };

  const handleSave = async (opts?: { silent?: boolean }) => {
    try {
      const result = await saveDesign.mutateAsync(buildPayload());
      setDesignId(result.design.id);
      if (!opts?.silent) {
        toast.success(designId ? "Design updated" : "Design saved");
      }
      return result.design.id;
    } catch (error) {
      if (!opts?.silent) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save design",
        );
      }
      return null;
    }
  };

  const goTo3D = async () => {
    const id = await handleSave({ silent: true });
    if (id) {
      router.push(`/3d-view?designId=${id}`);
      return;
    }
    setDesignId("local");
    toast.warning("Opened 3D view without saving. Sign in to save designs.");
    router.push("/3d-view?designId=local");
  };

  const handleRoomChange = (nextRoom: RoomSpec) => {
    commit("update-room", (prev) => ({ ...prev, room: nextRoom }));
  };

  const handleDeleteDesign = async () => {
    if (!designId) return;
    const res = await fetch(`/api/designs/${designId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete design");
      return;
    }
    setDesignId(null);
    setState({
      room,
      furniture: [],
      activeTheme: null,
      globalColors: {},
    });
    setSelectedId(null);
    toast.success("Design deleted");
    router.push("/design");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTypingTarget =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable;
      if (isTypingTarget) return;

      const key = event.key.toLowerCase();
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      if (ctrlOrMeta && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (ctrlOrMeta && key === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (!selectedId) return;
      const selected = furniture.find((item) => item.id === selectedId);
      if (!selected) return;

      if (event.key === "Delete") {
        event.preventDefault();
        const confirmed = window.confirm(
          `Delete ${selected.label || "this item"}?`,
        );
        if (confirmed) {
          handleDelete(selected.id);
        }
        return;
      }

      const step = event.shiftKey ? 1 : 0.5;
      let nextX = selected.x;
      let nextY = selected.y;

      if (event.key === "ArrowUp") nextY -= step;
      if (event.key === "ArrowDown") nextY += step;
      if (event.key === "ArrowLeft") nextX -= step;
      if (event.key === "ArrowRight") nextX += step;

      if (nextX !== selected.x || nextY !== selected.y) {
        event.preventDefault();
        const clampedX = Math.min(
          Math.max(0, nextX),
          Math.max(0, room.width - selected.width),
        );
        const clampedY = Math.min(
          Math.max(0, nextY),
          Math.max(0, room.height - selected.height),
        );
        handleMove(selected.id, clampedX, clampedY);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    furniture,
    handleMove,
    handleDelete,
    redo,
    room.height,
    room.width,
    selectedId,
    undo,
  ]);

  return (
    <div className="min-h-screen bg-background lg:flex lg:h-dvh lg:flex-col lg:overflow-hidden">
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-xl lg:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-body">Back</span>
        </Link>
        <div className="h-5 w-px bg-border" />
        <h1 className="font-display text-lg font-semibold text-foreground">
          2D Room Designer
        </h1>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            className="gap-1.5"
          >
            <Undo2 className="w-4 h-4" /> Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={!canRedo}
            className="gap-1.5"
          >
            <Redo2 className="w-4 h-4" /> Redo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleSave()}
            disabled={saveDesign.isPending}
            className="gap-1.5"
          >
            <Save className="w-4 h-4" />{" "}
            {saveDesign.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="gap-1.5"
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={goTo3D}
            disabled={furniture.length === 0}
            className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Box className="w-4 h-4" /> View 3D
          </Button>
          {designId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="gap-1.5">
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this design?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the saved design. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteDesign}>
                    Delete Design
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full space-y-6 border-b border-border bg-card/50 p-5 lg:h-full lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:overscroll-contain xl:w-80"
        >
          <RoomForm
            room={room}
            onChange={handleRoomChange}
            onOpenTemplates={() => setTemplatesOpen(true)}
          />
          <div className="h-px bg-border" />
          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Global Colours
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { id: "walls", label: "Walls", value: room.wallColor },
                  { id: "floor", label: "Floor", value: room.floorColor },
                  {
                    id: "ceiling",
                    label: "Ceiling",
                    value: room.ceilingColor ?? "#F8F8F8",
                  },
                  {
                    id: "furniture",
                    label: "Furniture",
                    value: globalColors.furniture ?? "#c6c2be",
                  },
                ] as const
              ).map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground font-body">
                    {item.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={item.value}
                      aria-label={`${item.label} color`}
                      onChange={(e) =>
                        applyGlobalColor(item.id, e.target.value)
                      }
                      className="w-9 h-9 rounded border border-border cursor-pointer"
                    />
                    <span className="text-[10px] text-muted-foreground font-body uppercase tracking-wide">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Themes
            </h3>
            <div className="text-[11px] text-muted-foreground font-body">
              {activeTheme ? `Active: ${activeTheme.label}` : "No active theme"}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {allThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => applyTheme(theme)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                    activeTheme?.id === theme.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <span className="text-sm font-body font-medium">
                    {theme.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {theme.floorType}
                  </span>
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-2">
              <p className="text-[11px] text-muted-foreground font-body">
                Custom Theme
              </p>
              <input
                value={customThemeName}
                onChange={(e) => setCustomThemeName(e.target.value)}
                placeholder="Theme name"
                className="h-9 rounded border border-border bg-background px-2 text-xs font-body"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="color"
                  value={globalColors.walls ?? room.wallColor}
                  aria-label="Custom wall color"
                  onChange={(e) => applyGlobalColor("walls", e.target.value)}
                  className="w-full h-9 rounded border border-border cursor-pointer"
                />
                <input
                  type="color"
                  value={globalColors.floor ?? room.floorColor}
                  aria-label="Custom floor color"
                  onChange={(e) => applyGlobalColor("floor", e.target.value)}
                  className="w-full h-9 rounded border border-border cursor-pointer"
                />
                <input
                  type="color"
                  value={globalColors.ceiling ?? room.ceilingColor ?? "#F8F8F8"}
                  aria-label="Custom ceiling color"
                  onChange={(e) => applyGlobalColor("ceiling", e.target.value)}
                  className="w-full h-9 rounded border border-border cursor-pointer"
                />
                <input
                  type="color"
                  value={globalColors.furniture ?? "#c6c2be"}
                  aria-label="Custom furniture color"
                  onChange={(e) =>
                    applyGlobalColor("furniture", e.target.value)
                  }
                  className="w-full h-9 rounded border border-border cursor-pointer"
                />
                <button
                  onClick={handleSaveCustomTheme}
                  className="h-9 rounded border border-border text-[11px] font-body hover:border-accent/40"
                >
                  Save Theme
                </button>
              </div>
            </div>
          </div>
          <div className="h-px bg-border" />
          <FurniturePanel onAdd={handleAddFurniture} />
        </motion.aside>

        <main className="flex flex-1 items-start justify-center p-4 lg:min-h-0 lg:overflow-hidden lg:p-8">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full max-w-4xl"
          >
            <RoomCanvas
              room={room}
              furniture={furniture}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={handleMove}
              onResize={handleResize}
              onDelete={handleDelete}
              onRotate={handleRotate}
              onColorChange={handleColorChange}
            />

            {furniture.length === 0 && (
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground font-body">
                  Choose a template or add furniture from the left panel
                </p>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      <TemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelect={handleTemplateSelect}
        templates={templates}
        isLoading={templatesLoading}
      />
    </div>
  );
};

export default DesignPage;
