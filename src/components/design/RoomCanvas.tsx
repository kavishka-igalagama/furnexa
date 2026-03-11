import { memo, useRef, useEffect, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Line,
  Group,
  Transformer,
} from "react-konva";
import type { RoomSpec } from "./RoomForm";
import type { FurnitureItem } from "./FurniturePanel";
import Konva from "konva";
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

interface PlacedFurniture extends FurnitureItem {
  x: number;
  y: number;
  rotation: number; // degrees
}

interface RoomCanvasProps {
  room: RoomSpec;
  furniture: PlacedFurniture[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (
    id: string,
    width: number,
    height: number,
    x: number,
    y: number,
  ) => void;
  onDelete: (id: string) => void;
  onRotate: (id: string, rotation: number) => void;
  onColorChange: (id: string, color: string) => void;
}

const SCALE = 10; // pixels per foot

const RoomCanvas = ({
  room,
  furniture,
  selectedId,
  onSelect,
  onMove,
  onResize,
  onDelete,
  onRotate,
  onColorChange,
}: RoomCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
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

  const handleDragEnd = (
    e: Konva.KonvaEventObject<DragEvent>,
    item: PlacedFurniture,
  ) => {
    const node = e.target;
    const centerX = node.x();
    const centerY = node.y();
    const newX = centerX / (SCALE * viewScale) - item.width / 2;
    const newY = centerY / (SCALE * viewScale) - item.height / 2;
    onMove(item.id, Math.max(0, newX), Math.max(0, newY));
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

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (!selectedId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const stage = transformer.getStage();
    if (!stage) return;

    const selectedNode = stage.findOne(`#furniture-${selectedId}`);
    if (!selectedNode) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    transformer.nodes([selectedNode]);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, furniture]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl border border-border overflow-hidden bg-muted/30"
      tabIndex={0}
      role="application"
      aria-label="2D room design canvas"
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
              const displayFw = item.width * SCALE * viewScale;
              const displayFh = item.height * SCALE * viewScale;
              const isSelected = selectedId === item.id;
              const isLShapeSofa = item.type === "l-shape-sofa";
              const centerX = (item.x + item.width / 2) * SCALE * viewScale;
              const centerY = (item.y + item.height / 2) * SCALE * viewScale;
              const markerWidth = Math.max(8, Math.min(displayFw * 0.35, 20));
              const markerDepth = Math.max(4, Math.min(displayFh * 0.18, 10));
              const markerStartX = (displayFw - markerWidth) / 2;
              const markerMidX = markerStartX + markerWidth / 2;
              const markerY = Math.max(2, displayFh - markerDepth - 4);
              const sofaArmThickness = Math.max(
                8,
                Math.min(Math.max(displayFw, displayFh) * 0.35, displayFh - 6),
              );
              const sofaArmWidth = Math.min(sofaArmThickness, displayFw - 6);
              const sofaArmDepth = Math.min(sofaArmThickness, displayFh - 6);

              return (
                <Group
                  key={item.id}
                  id={`furniture-${item.id}`}
                  x={centerX}
                  y={centerY}
                  offsetX={displayFw / 2}
                  offsetY={displayFh / 2}
                  rotation={item.rotation || 0}
                  draggable
                  onDragEnd={(e) => handleDragEnd(e, item)}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    onSelect(item.id);
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    onSelect(item.id);
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    const rawScale = Math.min(scaleX, scaleY);
                    const minScale = Math.max(
                      0.5 / item.width,
                      0.5 / item.height,
                    );
                    const maxScale = Math.min(
                      room.width / item.width,
                      room.height / item.height,
                    );
                    const nextScale = Math.min(
                      maxScale,
                      Math.max(minScale, rawScale),
                    );

                    const nextWidth = Number(
                      (item.width * nextScale).toFixed(2),
                    );
                    const nextHeight = Number(
                      (item.height * nextScale).toFixed(2),
                    );

                    const centerFeetX = item.x + item.width / 2;
                    const centerFeetY = item.y + item.height / 2;

                    const nextX = Math.min(
                      Math.max(0, centerFeetX - nextWidth / 2),
                      Math.max(0, room.width - nextWidth),
                    );
                    const nextY = Math.min(
                      Math.max(0, centerFeetY - nextHeight / 2),
                      Math.max(0, room.height - nextHeight),
                    );

                    node.scaleX(1);
                    node.scaleY(1);
                    onResize(item.id, nextWidth, nextHeight, nextX, nextY);
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
                  {isLShapeSofa ? (
                    <Line
                      points={[
                        0,
                        0,
                        displayFw,
                        0,
                        displayFw,
                        sofaArmDepth,
                        sofaArmWidth,
                        sofaArmDepth,
                        sofaArmWidth,
                        displayFh,
                        0,
                        displayFh,
                      ]}
                      closed
                      fill={item.color}
                      stroke="rgba(0,0,0,0.18)"
                      strokeWidth={1}
                      cornerRadius={3}
                      shadowColor="rgba(0,0,0,0.15)"
                      shadowBlur={isSelected ? 8 : 3}
                      shadowOffsetY={2}
                    />
                  ) : (
                    <Rect
                      width={displayFw}
                      height={displayFh}
                      fill={item.color}
                      cornerRadius={3}
                      shadowColor="rgba(0,0,0,0.15)"
                      shadowBlur={isSelected ? 8 : 3}
                      shadowOffsetY={2}
                    />
                  )}
                  <Line
                    points={[
                      markerStartX,
                      markerY,
                      markerStartX + markerWidth,
                      markerY,
                      markerMidX,
                      markerY + markerDepth,
                    ]}
                    closed
                    fill="rgba(255,255,255,0.95)"
                    stroke="rgba(0,0,0,0.35)"
                    strokeWidth={0.8}
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
                    stroke="rgba(0,0,0,0.45)"
                    strokeWidth={0.6}
                    fontFamily="DM Sans, sans-serif"
                    fontStyle="bold"
                  />
                </Group>
              );
            })}

            {selectedId && (
              <Transformer
                ref={transformerRef}
                rotateEnabled={false}
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ]}
                keepRatio
                boundBoxFunc={(oldBox, newBox) => {
                  const minSize = 0.5 * SCALE * viewScale;
                  if (newBox.width < minSize || newBox.height < minSize) {
                    return oldBox;
                  }
                  return newBox;
                }}
                anchorFill="hsl(32, 80%, 50%)"
                anchorStroke="white"
                anchorStrokeWidth={1}
                borderStroke="hsl(32, 80%, 50%)"
                borderStrokeWidth={1.5}
                borderDash={[4, 3]}
                anchorSize={8}
              />
            )}
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
                  aria-label={`${item.label} color`}
                  onChange={(e) => onColorChange(item.id, e.target.value)}
                  className="w-6 h-6 rounded border border-border cursor-pointer"
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    onRotate(item.id, ((item.rotation || 0) + 15) % 360)
                  }
                  className="px-2 py-1 text-[10px] rounded bg-secondary text-secondary-foreground hover:bg-accent/10 transition-colors font-body"
                >
                  +15°
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="px-2 py-1 text-[10px] rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-body">
                      Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the furniture item from the room.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(item.id)}>
                        Delete Item
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-muted-foreground">
                  Angle
                </label>
                <input
                  type="range"
                  min={0}
                  max={345}
                  step={15}
                  value={item.rotation || 0}
                  aria-label={`${item.label} rotation`}
                  onChange={(e) =>
                    onRotate(item.id, Number(e.target.value) % 360)
                  }
                  className="w-28"
                />
                <span className="text-[10px] text-foreground font-body w-8">
                  {(item.rotation || 0).toFixed(0)}°
                </span>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default memo(RoomCanvas);
