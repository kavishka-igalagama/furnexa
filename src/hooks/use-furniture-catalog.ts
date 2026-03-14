import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildCatalogFromManaged,
  defaultManagedFurnitureItems,
  type ManagedFurnitureItem,
} from "@/lib/furniture-catalog-shared";

type FurnitureCatalogResponse = {
  items?: ManagedFurnitureItem[];
};

export const useFurnitureCatalog = () => {
  const [items, setItems] = useState<ManagedFurnitureItem[]>(
    defaultManagedFurnitureItems,
  );
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/furniture-catalog", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load furniture catalog");
      }

      const data = (await res.json()) as FurnitureCatalogResponse;
      if (Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch {
      setItems(defaultManagedFurnitureItems);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const catalog = useMemo(() => buildCatalogFromManaged(items), [items]);

  return {
    catalog,
    items,
    isLoading,
    refresh,
  };
};

export type { ManagedFurnitureItem } from "@/lib/furniture-catalog-shared";
