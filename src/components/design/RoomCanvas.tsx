import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Rect, Text, Line, Group } from "react-konva";
import type { RoomSpec } from "./RoomForm";
import type { FurnitureItem } from "./FurniturePanel";
import Konva from "konva";

interface PlacedFurniture extends FurnitureItem {
  x: number;
  y: number;
  rotated: boolean;
}

interface RoomCanvasProps {
  room: RoomSpec;
  furniture: PlacedFurniture[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onRotate: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
}

const SCALE = 10; // pixels per foot

const RoomCanvas = ({
  room,
  furniture,
  selectedId,
  onSelect,
  onMove,
  onDelete,
  onRotate,
  onColorChange,
}: RoomCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 700, height: 500 });
  const [zoom, setZoom] = useState(1);

  const roomW = room.width * SCALE;
  const roomH = room.height * SCALE;
  const padding = 40;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setStageSize({
          width: w,
          height: Math.max(400, Math.min(600, w * 0.7)),
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const clampZoom = useCallback((value: number) => {
    return Math.min(2.5, Math.max(0.5, value));
  }, []);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const nextZoom = clampZoom(zoom * (e.evt.deltaY > 0 ? 0.9 : 1.1));
      setZoom(nextZoom);
    },
    [clampZoom, zoom],
  );

  const handleZoomButton = useCallback(
    (direction: "in" | "out" | "reset") => {
      setZoom((z) => {
        if (direction === "reset") return 1;
        const factor = direction === "in" ? 1.1 : 0.9;
        return clampZoom(z * factor);
      });
    },
    [clampZoom],
  );

  // Compute scale to fit room in stage and apply user zoom
  const fitScale = Math.min(
    (stageSize.width - padding * 2) / roomW,
    (stageSize.height - padding * 2) / roomH,
  );
  const viewScale = fitScale * zoom;
  const displayW = roomW * viewScale;
  const displayH = roomH * viewScale;
  const offsetX = (stageSize.width - displayW) / 2;
  const offsetY = (stageSize.height - displayH) / 2;

  // Grid lines
  const gridLines: { points: number[] }[] = [];
  const gridStep = 5 * SCALE * viewScale; // 5ft grid
  for (let x = 0; x <= displayW; x += gridStep) {
    gridLines.push({ points: [x, 0, x, displayH] });
  }
  for (let y = 0; y <= displayH; y += gridStep) {
    gridLines.push({ points: [0, y, displayW, y] });
  }

  // Floor color based on type
  const getFloorFill = () => {
    return room.floorColor;
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    const node = e.target;
    const newX = node.x() / (SCALE * viewScale);
    const newY = node.y() / (SCALE * viewScale);
    onMove(id, Math.max(0, newX), Math.max(0, newY));
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (
      e.target === e.target.getStage() ||
      e.target.name() === "floor" ||
      e.target.name() === "grid"
    ) {
      onSelect(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl border border-border overflow-hidden bg-muted/30"
    >
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        onWheel={handleWheel}
      >
        <Layer>
          {/* Background */}
          <Rect
            width={stageSize.width}
            height={stageSize.height}
            fill="hsl(30, 12%, 92%)"
          />

          <Group x={offsetX} y={offsetY}>
            {/* Floor */}
            <Rect
              name="floor"
              width={displayW}
              height={displayH}
              fill={getFloorFill()}
              cornerRadius={4}
            />

            {/* Grid */}
            {gridLines.map((line, i) => (
              <Line
                key={i}
                name="grid"
                points={line.points}
                stroke="rgba(0,0,0,0.08)"
                strokeWidth={0.5}
              />
            ))}

            {/* Wall border */}
            <Rect
              width={displayW}
              height={displayH}
              stroke={room.wallColor}
              strokeWidth={6}
              fill="transparent"
              cornerRadius={4}
            />
            <Rect
              width={displayW}
              height={displayH}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth={1}
              fill="transparent"
              cornerRadius={4}
            />

            {/* Furniture */}
            {furniture.map((item) => {
              const fw = item.width * SCALE * viewScale;
              const fh = item.height * SCALE * viewScale;
              const displayFw = item.rotated ? fh : fw;
              const displayFh = item.rotated ? fw : fh;
              const isSelected = selectedId === item.id;

              return (
                <Group
                  key={item.id}
                  x={item.x * SCALE * viewScale}
                  y={item.y * SCALE * viewScale}
                  draggable
                  onDragEnd={(e) => handleDragEnd(e, item.id)}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    onSelect(item.id);
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    onSelect(item.id);
                  }}
                >
                  {/* Selection highlight */}
                  {isSelected && (
                    <Rect
                      x={-3}
                      y={-3}
                      width={displayFw + 6}
                      height={displayFh + 6}
                      stroke="hsl(32, 80%, 50%)"
                      strokeWidth={2}
                      cornerRadius={4}
                      dash={[4, 2]}
                      fill="transparent"
                    />
                  )}
                  <Rect
                    width={displayFw}
                    height={displayFh}
                    fill={item.color}
                    cornerRadius={3}
                    shadowColor="rgba(0,0,0,0.15)"
                    shadowBlur={isSelected ? 8 : 3}
                    shadowOffsetY={2}
                  />
                  <Text
                    text={item.label}
                    width={displayFw}
                    height={displayFh}
                    align="center"
                    verticalAlign="middle"
                    fontSize={Math.min(
                      11,
                      (displayFw / item.label.length) * 1.5,
                    )}
                    fill="white"
                    fontFamily="DM Sans, sans-serif"
                    fontStyle="bold"
                  />
                </Group>
              );
            })}
          </Group>

          {/* Scale indicator */}
          <Group x={stageSize.width - 100} y={stageSize.height - 30}>
            <Rect
              width={85}
              height={22}
              fill="rgba(255,255,255,0.85)"
              cornerRadius={4}
            />
            <Line
              points={[10, 11, 50, 11]}
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={1.5}
            />
            <Text
              text={`${Math.round(40 / viewScale / SCALE)}ft`}
              x={55}
              y={5}
              fontSize={10}
              fill="rgba(0,0,0,0.5)"
              fontFamily="DM Sans"
            />
          </Group>

          {/* Dimensions label */}
          <Group x={10} y={10}>
            <Rect
              width={90}
              height={22}
              fill="rgba(255,255,255,0.85)"
              cornerRadius={4}
            />
            <Text
              text={`${room.width} × ${room.height} ft`}
              x={8}
              y={5}
              fontSize={11}
              fill="rgba(0,0,0,0.5)"
              fontFamily="DM Sans"
            />
          </Group>
        </Layer>
      </Stage>

      {/* Zoom toolbar */}
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-medium p-2 text-xs font-body">
        <button
          onClick={() => handleZoomButton("out")}
          className="h-7 w-7 rounded bg-secondary text-secondary-foreground hover:bg-accent/10 transition-colors"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          onClick={() => handleZoomButton("reset")}
          className="h-7 px-2 rounded border border-border hover:bg-accent/10 transition-colors"
          aria-label="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => handleZoomButton("in")}
          className="h-7 w-7 rounded bg-secondary text-secondary-foreground hover:bg-accent/10 transition-colors"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>

      {/* Selected furniture toolbar */}
      {selectedId &&
        (() => {
          const item = furniture.find((f) => f.id === selectedId);
          if (!item) return null;
          return (
            <div className="absolute top-16 right-3 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 space-y-2 shadow-medium z-10">
              <p className="text-xs font-body font-semibold text-foreground">
                {item.label}
              </p>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-muted-foreground">
                  Color
                </label>
                <input
                  type="color"
                  value={item.color}
                  onChange={(e) => onColorChange(item.id, e.target.value)}
                  className="w-6 h-6 rounded border border-border cursor-pointer"
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onRotate(item.id)}
                  className="px-2 py-1 text-[10px] rounded bg-secondary text-secondary-foreground hover:bg-accent/10 transition-colors font-body"
                >
                  Rotate
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="px-2 py-1 text-[10px] rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-body"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default RoomCanvas;
