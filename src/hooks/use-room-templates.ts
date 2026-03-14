import { useCallback, useEffect, useState } from "react";
import { defaultRoomTemplates } from "@/lib/room-templates-shared";
import type { RoomTemplate } from "@/data/templates";

type RoomTemplatesResponse = {
  templates?: RoomTemplate[];
};

export const useRoomTemplates = () => {
  const [templates, setTemplates] = useState<RoomTemplate[]>(defaultRoomTemplates);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/room-templates", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load templates");
      }

      const data = (await res.json()) as RoomTemplatesResponse;
      if (Array.isArray(data.templates)) {
        setTemplates(data.templates);
      }
    } catch {
      setTemplates(defaultRoomTemplates);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    templates,
    isLoading,
    refresh,
  };
};
