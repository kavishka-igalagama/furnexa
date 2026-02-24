import { Button } from "@/components/ui/button";
import {
  furnitureCatalog,
  type CatalogItem,
  type FurnitureSubtype,
} from "./FurnitureCatalog";
import {
  Armchair,
  RectangleHorizontal,
  Sofa,
  BedDouble,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

export interface FurnitureItem {
  id: string;
  type: string;
  label: string;
  width: number;
  height: number;
  color: string;
  modelPath?: string;
  modelId?: string;
}

const iconMap: Record<string, React.ElementType> = {
  chair: Armchair,
  table: RectangleHorizontal,
  sofa: Sofa,
  bed: BedDouble,
  storage: BookOpen,
};

interface FurniturePanelProps {
  onAdd: (item: Omit<FurnitureItem, "id">) => void;
}

const FurniturePanel = ({ onAdd }: FurniturePanelProps) => {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggle = (id: string) =>
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const addItem = (item: CatalogItem | FurnitureSubtype) => {
    const sub = item as FurnitureSubtype;
    onAdd({
      type: sub.id || (item as CatalogItem).id,
      label: sub.name || (item as CatalogItem).name,
      width: sub.width || (item as CatalogItem).width || 5,
      height: sub.length || (item as CatalogItem).length || 5,
      color: sub.color || (item as CatalogItem).color || "#888",
      modelPath:
        sub.models?.[0]?.path || (item as CatalogItem).models?.[0]?.path,
      modelId: sub.models?.[0]?.id || (item as CatalogItem).models?.[0]?.id,
    });
  };

  return (
    <div className="space-y-2">
      <h3 className="font-display text-sm font-semibold text-foreground mb-3">
        Furniture Catalog
      </h3>
      <div className="space-y-1">
        {furnitureCatalog.map((item) => {
          const Icon = iconMap[item.id] || RectangleHorizontal;
          const isExpanded = expandedIds.includes(item.id);
          const hasSubtypes = !!item.subtypes;

          return (
            <div key={item.id}>
              <button
                onClick={() => (hasSubtypes ? toggle(item.id) : addItem(item))}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-all text-left"
              >
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-body font-medium text-foreground flex-1">
                  {item.name}
                </span>
                {hasSubtypes ? (
                  isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  )
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    {item.width}×{item.length}ft
                  </span>
                )}
              </button>

              {hasSubtypes && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.subtypes!.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => addItem(sub)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border/50 hover:border-accent/40 hover:bg-accent/5 transition-all text-left"
                    >
                      <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span className="text-xs font-body text-foreground flex-1">
                        {sub.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {sub.width}×{sub.length}ft
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FurniturePanel;
