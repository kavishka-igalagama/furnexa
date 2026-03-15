"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  useFurnitureCatalog,
  type ManagedFurnitureItem,
} from "@/hooks/use-furniture-catalog";

type DraftItem = Omit<ManagedFurnitureItem, "recordId" | "id"> & {
  recordId?: string;
  id?: string;
};

const emptyDraft: DraftItem = {
  groupId: "chair",
  groupName: "Chair",
  name: "",
  width: 2,
  length: 2,
  color: "#c6c2be",
  category: "Seating",
  modelPath: "",
  modelId: "",
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isValidModelPath = (path: string) => /\.(gltf|glb)$/i.test(path.trim());

const validateDraft = (draft: DraftItem) => {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push("Name is required.");
  if (!draft.groupId.trim()) errors.push("Group ID is required.");
  if (!draft.groupName.trim()) errors.push("Group name is required.");
  if (!draft.category.trim()) errors.push("Category is required.");
  if (!(draft.width > 0)) errors.push("Width must be greater than 0.");
  if (!(draft.length > 0)) errors.push("Length must be greater than 0.");
  if (!draft.modelPath.trim()) errors.push("Model path is required.");
  if (draft.modelPath && !isValidModelPath(draft.modelPath)) {
    errors.push("Model path must end with .gltf or .glb.");
  }
  return errors;
};

const buildDraftFromItem = (item: ManagedFurnitureItem): DraftItem => ({
  recordId: item.recordId,
  id: item.id,
  groupId: item.groupId,
  groupName: item.groupName,
  name: item.name,
  width: item.width,
  length: item.length,
  color: item.color,
  category: item.category,
  modelPath: item.modelPath,
  modelId: item.modelId ?? "",
});

const FurnitureAdminPanel = () => {
  const { items, refresh, isLoading } = useFurnitureCatalog();
  const [draft, setDraft] = useState<DraftItem>(emptyDraft);
  const [isCustomGroup, setIsCustomGroup] = useState(false);
  const [editing, setEditing] = useState<DraftItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const groupOptions = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => map.set(item.groupId, item.groupName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  const modelOptions = useMemo(() => {
    const paths = new Set<string>();
    items.forEach((item) => item.modelPath && paths.add(item.modelPath));
    return Array.from(paths).sort();
  }, [items]);

  const handleDraftChange = (patch: Partial<DraftItem>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleAdd = async () => {
    const errors = validateDraft(draft);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setIsSaving(true);

    const payload = {
      id: draft.id ?? `item-${crypto.randomUUID()}`,
      groupId: draft.groupId,
      groupName: draft.groupName,
      name: draft.name.trim(),
      width: draft.width,
      length: draft.length,
      color: draft.color,
      category: draft.category.trim(),
      modelPath: draft.modelPath.trim(),
      modelId: draft.modelId?.trim() || undefined,
    };

    try {
      const res = await fetch("/api/furniture-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to add furniture item");
      }
      await refresh();
      setDraft(emptyDraft);
      setIsCustomGroup(false);
      toast.success("Furniture item added");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add furniture item",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    if (!editing.recordId) {
      toast.error("Missing database id for this furniture item");
      return;
    }
    const errors = validateDraft(editing);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(
        `/api/furniture-catalog/${editing.recordId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editing.id,
            groupId: editing.groupId,
            groupName: editing.groupName,
            name: editing.name.trim(),
            width: editing.width,
            length: editing.length,
            color: editing.color,
            category: editing.category.trim(),
            modelPath: editing.modelPath.trim(),
            modelId: editing.modelId?.trim() || undefined,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to update furniture item");
      }
      await refresh();
      setEditing(null);
      toast.success("Furniture item updated");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update furniture item",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (recordId?: string) => {
    if (!recordId) {
      toast.error("Missing database id for this furniture item");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/furniture-catalog/${recordId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to delete furniture item");
      }
      await refresh();
      toast.success("Furniture item deleted");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete furniture item",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleFilePick = (file: File | null, setTarget: (path: string) => void) => {
    if (!file) return;
    if (!/\.(gltf|glb)$/i.test(file.name)) {
      toast.error("Please choose a .gltf or .glb file");
      return;
    }
    setTarget(`/assets/3d-models/${file.name}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">
              Admin Dashboard
            </p>
            <h1 className="text-xl font-display font-semibold text-foreground">
              Furniture Catalogue Management
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/admin"
              className="rounded-md border border-border px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/templates"
              className="rounded-md border border-border px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              Templates
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-10 space-y-8">
        {isLoading && (
          <div className="rounded-xl border border-border/60 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
            Loading furniture catalogue...
          </div>
        )}
        <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="w-4 h-4 text-accent" />
            <h2 className="text-lg font-display font-semibold text-foreground">
              Add Furniture Item
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={draft.name}
                onChange={(e) => handleDraftChange({ name: e.target.value })}
                placeholder="e.g. Lounge Chair"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-category">Category</Label>
              <Input
                id="add-category"
                value={draft.category}
                onChange={(e) => handleDraftChange({ category: e.target.value })}
                placeholder="e.g. Seating"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-group">Group</Label>
              <select
                id="add-group"
                value={isCustomGroup ? "custom" : draft.groupId}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setIsCustomGroup(true);
                    handleDraftChange({ groupId: "", groupName: "" });
                    return;
                  }
                  const selected = groupOptions.find(
                    (group) => group.id === e.target.value,
                  );
                  if (!selected) return;
                  setIsCustomGroup(false);
                  handleDraftChange({
                    groupId: selected.id,
                    groupName: selected.name,
                  });
                }}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {groupOptions.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
            </div>
            {isCustomGroup && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="add-group-name">Group Name</Label>
                  <Input
                    id="add-group-name"
                    value={draft.groupName}
                    onChange={(e) =>
                      handleDraftChange({
                        groupName: e.target.value,
                        groupId: slugify(e.target.value) || draft.groupId,
                      })
                    }
                    placeholder="e.g. Accent Pieces"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="add-group-id">Group ID</Label>
                  <Input
                    id="add-group-id"
                    value={draft.groupId}
                    onChange={(e) =>
                      handleDraftChange({ groupId: slugify(e.target.value) })
                    }
                    placeholder="accent-pieces"
                  />
                </div>
              </>
            )}
            <div className="space-y-1">
              <Label htmlFor="add-width">Width (ft)</Label>
              <Input
                id="add-width"
                type="number"
                step="0.1"
                min="0.1"
                value={draft.width}
                onChange={(e) =>
                  handleDraftChange({ width: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-length">Length (ft)</Label>
              <Input
                id="add-length"
                type="number"
                step="0.1"
                min="0.1"
                value={draft.length}
                onChange={(e) =>
                  handleDraftChange({ length: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-color">Default Colour</Label>
              <div className="flex items-center gap-2">
                <input
                  id="add-color"
                  type="color"
                  value={draft.color}
                  onChange={(e) => handleDraftChange({ color: e.target.value })}
                  className="h-10 w-12 rounded border border-border"
                />
                <Input
                  value={draft.color}
                  onChange={(e) => handleDraftChange({ color: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="add-model">GLTF Model Path</Label>
              <div className="flex flex-col gap-2">
                <Input
                  id="add-model"
                  value={draft.modelPath}
                  onChange={(e) =>
                    handleDraftChange({ modelPath: e.target.value })
                  }
                  placeholder="/assets/3d-models/sofa/scene.gltf"
                />
                {modelOptions.length > 0 && (
                  <select
                    value={draft.modelPath}
                    onChange={(e) =>
                      handleDraftChange({ modelPath: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  >
                    <option value="">Choose an existing model</option>
                    {modelOptions.map((path) => (
                      <option key={path} value={path}>
                        {path}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="file"
                  accept=".gltf,.glb"
                  onChange={(e) =>
                    handleFilePick(e.target.files?.[0] ?? null, (path) =>
                      handleDraftChange({ modelPath: path }),
                    )
                  }
                  aria-label="Upload model file"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button onClick={() => void handleAdd()} className="gap-2" disabled={isSaving}>
              <Plus className="w-4 h-4" /> Add Item
            </Button>
            <span className="text-xs text-muted-foreground">
              Uploads reference files placed under `public/assets/3d-models`.
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">
              Catalogue Items
            </h2>
            <p className="text-xs text-muted-foreground">
              {items.length} total items
            </p>
          </div>

          <div className="divide-y divide-border/60">
            {items.map((item) => (
              <div key={item.recordId ?? item.id} className="py-4 flex flex-col gap-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.groupName} • {item.category} • {item.width}×
                      {item.length} ft
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.modelPath}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(buildDraftFromItem(item))}
                      className="gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the item from the catalogue. It
                            will no longer appear in the designer UI.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void handleDelete(item.recordId)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Colour</span>
                  <div
                    className="h-4 w-4 rounded border border-border"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.color}
                  </span>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No furniture items available.
              </p>
            )}
          </div>
        </section>
      </main>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Furniture Item</DialogTitle>
            <DialogDescription>
              Update dimensions, category, colour, or model path.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Input
                  value={editing.category}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, category: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Group Name</Label>
                <Input
                  value={editing.groupName}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            groupName: e.target.value,
                            groupId: slugify(e.target.value) || prev.groupId,
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Group ID</Label>
                <Input
                  value={editing.groupId}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, groupId: slugify(e.target.value) } : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Width (ft)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={editing.width}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, width: Number(e.target.value) } : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Length (ft)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={editing.length}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, length: Number(e.target.value) } : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Default Colour</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editing.color}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, color: e.target.value } : prev,
                      )
                    }
                    className="h-10 w-12 rounded border border-border"
                  />
                  <Input
                    value={editing.color}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, color: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>GLTF Model Path</Label>
                <Input
                  value={editing.modelPath}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, modelPath: e.target.value } : prev,
                    )
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleUpdate()} disabled={isSaving}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FurnitureAdminPanel;
