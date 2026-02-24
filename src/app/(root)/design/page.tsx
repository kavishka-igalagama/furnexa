"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Undo2, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomForm, { type RoomSpec } from "@/components/design/RoomForm";
import FurniturePanel, {
  type FurnitureItem,
} from "@/components/design/FurniturePanel";
import RoomCanvas from "@/components/design/RoomCanvas";
import TemplatesDialog from "@/components/design/TemplatesDialog";
import type { RoomTemplate } from "@/components/design/RoomTemplates";
import { toast } from "sonner";
import { motion } from "framer-motion";

const DesignPage = () => {
  const router = useRouter();
  const [room, setRoom] = useState<RoomSpec>({
    width: 12,
    height: 12,
    wallColor: "#F5F0EB",
    floorColor: "#D4A76A",
    floorType: "tile",
  });

  const [furniture, setFurniture] = useState<
    (FurnitureItem & { x: number; y: number; rotated: boolean })[]
  >([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<(typeof furniture)[]>([]);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-19), furniture]);
  }, [furniture]);

  const handleAddFurniture = (template: Omit<FurnitureItem, "id">) => {
    pushHistory();
    const newItem = {
      ...template,
      id: crypto.randomUUID(),
      x: room.width / 2 - template.width / 2,
      y: room.height / 2 - template.height / 2,
      rotated: false,
    };
    setFurniture((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
    toast.success(`${template.label} added`);
  };

  const handleMove = useCallback((id: string, x: number, y: number) => {
    setFurniture((prev) => prev.map((f) => (f.id === id ? { ...f, x, y } : f)));
  }, []);

  const handleDelete = (id: string) => {
    pushHistory();
    setFurniture((prev) => prev.filter((f) => f.id !== id));
    setSelectedId(null);
    toast.success("Item removed");
  };

  const handleRotate = (id: string) => {
    pushHistory();
    setFurniture((prev) =>
      prev.map((f) => (f.id === id ? { ...f, rotated: !f.rotated } : f)),
    );
  };

  const handleColorChange = (id: string, color: string) => {
    pushHistory();
    setFurniture((prev) =>
      prev.map((f) => (f.id === id ? { ...f, color } : f)),
    );
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setFurniture(last);
    setHistory((prev) => prev.slice(0, -1));
    toast("Undo successful");
  };

  const handleClear = () => {
    if (furniture.length === 0) return;
    pushHistory();
    setFurniture([]);
    setSelectedId(null);
    toast.success("Canvas cleared");
  };

  const handleTemplateSelect = (template: RoomTemplate) => {
    pushHistory();
    setRoom({
      width: template.dimensions.width,
      height: template.dimensions.length,
      wallColor: template.suggestedWallColor,
      floorColor: template.suggestedFloorColor,
      floorType: template.suggestedFloorType as RoomSpec["floorType"],
    });
    const items = template.defaultFurniture.map((f) => ({
      id: crypto.randomUUID(),
      type: f.type,
      label: f.name,
      width: f.width,
      height: f.length,
      color: f.color,
      x: f.x,
      y: f.y,
      rotated: false,
    }));
    setFurniture(items);
    setSelectedId(null);
    toast.success(`${template.name} template applied`);
  };

  const goTo3D = () => {
    const payload = {
      room: {
        dimensions: { width: room.width, length: room.height },
        wallColor: room.wallColor,
        floorColor: room.floorColor,
        floorType: room.floorType,
      },
      furniture: furniture.map((item) => ({
        id: item.id,
        type: item.type,
        name: item.label,
        x: item.x,
        y: item.y,
        width: item.width,
        length: item.height,
        color: item.color,
        modelPath: item.modelPath,
      })),
    };

    sessionStorage.setItem("furnexa:3d-view", JSON.stringify(payload));
    router.push("/3d-view");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xl flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-40">
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
            onClick={handleUndo}
            disabled={history.length === 0}
            className="gap-1.5"
          >
            <Undo2 className="w-4 h-4" /> Undo
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
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-border bg-card/50 p-5 space-y-6 lg:min-h-[calc(100vh-3.5rem)] overflow-y-auto"
        >
          <RoomForm
            room={room}
            onChange={setRoom}
            onOpenTemplates={() => setTemplatesOpen(true)}
          />
          <div className="h-px bg-border" />
          <FurniturePanel onAdd={handleAddFurniture} />
        </motion.aside>

        <main className="flex-1 p-4 lg:p-8 flex items-start justify-center overflow-auto">
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
      />
    </div>
  );
};

export default DesignPage;
