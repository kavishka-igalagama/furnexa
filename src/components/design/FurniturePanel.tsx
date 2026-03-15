import { type CatalogItem, type FurnitureSubtype } from "./FurnitureCatalog";
import { useFurnitureCatalog } from "@/hooks/use-furniture-catalog";
import {
  Armchair,
  RectangleHorizontal,
  Sofa,
  BedDouble,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { memo, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

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
  const { catalog } = useFurnitureCatalog();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => {
    const values = new Set<string>();
    catalog.forEach((item) => {
      item.subtypes?.forEach((sub) => values.add(sub.category));
    });
    return ["All", ...Array.from(values).sort()];
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return catalog
      .map((item) => {
        if (!item.subtypes) return item;
        const subtypes = item.subtypes.filter((sub) => {
          const matchesCategory =
            category === "All" || sub.category === category;
          const matchesQuery =
            normalized.length === 0 ||
            sub.name.toLowerCase().includes(normalized) ||
            item.name.toLowerCase().includes(normalized);
          return matchesCategory && matchesQuery;
        });
        return { ...item, subtypes };
      })
      .filter((item) => (item.subtypes ? item.subtypes.length > 0 : true));
  }, [category, catalog, query]);

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
      <div className="space-y-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search furniture..."
          className="h-9 text-sm"
          aria-label="Search furniture"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm font-body"
          aria-label="Filter furniture by category"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        {filteredCatalog.map((item) => {
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
                      <span className="text-[9px] text-muted-foreground font-body uppercase">
                        {sub.category}
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
        {filteredCatalog.length === 0 && (
          <p className="text-xs text-muted-foreground font-body px-2 py-3">
            No furniture matches your search.
          </p>
        )}
      </div>
    </div>
  );
};

export default memo(FurniturePanel);
