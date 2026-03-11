"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { RoomSpec } from "@/components/design/RoomForm";
import type { FurnitureItem } from "@/components/design/FurniturePanel";

export type Theme = {
  id: string;
  label: string;
  wallColor: string;
  floorColor: string;
  floorType: RoomSpec["floorType"];
  furnitureColor: string;
  ceilingColor?: string;
};

export type GlobalColors = {
  walls?: string;
  floor?: string;
  ceiling?: string;
  furniture?: string;
};

export type PlacedFurniture = FurnitureItem & {
  x: number;
  y: number;
  rotation: number;
};

export type DesignState = {
  room: RoomSpec;
  furniture: PlacedFurniture[];
  activeTheme: Theme | null;
  globalColors: GlobalColors;
};

type Action = {
  type: string;
  prev: DesignState;
  next: DesignState;
  timestamp: number;
};

type DesignContextValue = {
  state: DesignState;
  designId: string | null;
  setDesignId: (id: string | null) => void;
  setState: (state: DesignState) => void;
  applyAction: (type: string, next: DesignState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

const defaultRoom: RoomSpec = {
  width: 12,
  height: 12,
  wallColor: "#F5F0EB",
  floorColor: "#D4A76A",
  floorType: "tile",
  ceilingColor: "#F8F8F8",
};

const defaultState: DesignState = {
  room: defaultRoom,
  furniture: [],
  activeTheme: null,
  globalColors: {},
};

const DesignContext = createContext<DesignContextValue | null>(null);

export const DesignProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<DesignState>(defaultState);
  const [designId, setDesignId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Action[]>([]);
  const [redoStack, setRedoStack] = useState<Action[]>([]);

  const applyAction = useCallback(
    (type: string, next: DesignState) => {
      setUndoStack((prev) => [
        ...prev.slice(-49),
        { type, prev: state, next, timestamp: Date.now() },
      ]);
      setRedoStack([]);
      setState(next);
    },
    [state],
  );

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const action = prev[prev.length - 1];
      setRedoStack((redoPrev) => [
        ...redoPrev.slice(-49),
        action,
      ]);
      setState(action.prev);
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const action = prev[prev.length - 1];
      setUndoStack((undoPrev) => [
        ...undoPrev.slice(-49),
        action,
      ]);
      setState(action.next);
      return prev.slice(0, -1);
    });
  }, []);

  const value = useMemo<DesignContextValue>(
    () => ({
      state,
      designId,
      setDesignId,
      setState,
      applyAction,
      undo,
      redo,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
    }),
    [state, designId, setDesignId, applyAction, undo, redo, undoStack, redoStack],
  );

  return (
    <DesignContext.Provider value={value}>{children}</DesignContext.Provider>
  );
};

export const useDesignContext = () => {
  const ctx = useContext(DesignContext);
  if (!ctx) {
    throw new Error("useDesignContext must be used within a DesignProvider");
  }
  return ctx;
};
