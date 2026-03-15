"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { useRoomTemplates } from "@/hooks/use-room-templates";
import type { RoomTemplate } from "@/data/templates";

type DraftTemplate = {
  recordId?: string;
  id: string;
  name: string;
  description: string;
  icon: string;
  thumbnail: string;
  width: number;
  length: number;
  furnitureJson: string;
  suggestedWallColor: string;
  suggestedFloorColor: string;
  suggestedFloorType: "tile" | "carpet" | "wood";
};

const emptyDraft: DraftTemplate = {
  id: "",
  name: "",
  description: "",
  icon: "RM",
  thumbnail: "",
  width: 12,
  length: 12,
  furnitureJson: "[]",
  suggestedWallColor: "#F5F0EB",
  suggestedFloorColor: "#D4A76A",
  suggestedFloorType: "tile",
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildDraftFromTemplate = (template: RoomTemplate): DraftTemplate => ({
  recordId: template.recordId,
  id: template.id,
  name: template.name,
  description: template.description,
  icon: template.icon,
  thumbnail: template.thumbnail,
  width: template.dimensions.width,
  length: template.dimensions.length,
  furnitureJson: JSON.stringify(template.defaultFurniture, null, 2),
  suggestedWallColor: template.suggestedWallColor,
  suggestedFloorColor: template.suggestedFloorColor,
  suggestedFloorType: template.suggestedFloorType as DraftTemplate["suggestedFloorType"],
});

const parseDraft = (draft: DraftTemplate) => {
  if (!draft.id.trim()) throw new Error("Template id is required.");
  if (!draft.name.trim()) throw new Error("Template name is required.");
  if (!draft.description.trim()) throw new Error("Description is required.");
  if (!(draft.width > 0) || !(draft.length > 0)) {
    throw new Error("Room dimensions must be greater than 0.");
  }

  const defaultFurniture = JSON.parse(draft.furnitureJson);
  if (!Array.isArray(defaultFurniture)) {
    throw new Error("Default furniture JSON must be an array.");
  }

  return {
    id: draft.id.trim(),
    name: draft.name.trim(),
    description: draft.description.trim(),
    icon: draft.icon.trim() || "RM",
    thumbnail: draft.thumbnail.trim(),
    dimensions: {
      width: draft.width,
      length: draft.length,
    },
    defaultFurniture,
    suggestedWallColor: draft.suggestedWallColor,
    suggestedFloorColor: draft.suggestedFloorColor,
    suggestedFloorType: draft.suggestedFloorType,
  };
};

const TemplateAdminPanel = () => {
  const { templates, refresh, isLoading } = useRoomTemplates();
  const [draft, setDraft] = useState<DraftTemplate>(emptyDraft);
  const [editing, setEditing] = useState<DraftTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleDraftChange = (patch: Partial<DraftTemplate>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleAdd = async () => {
    setIsSaving(true);
    try {
      const payload = parseDraft(draft);
      const res = await fetch("/api/room-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to create template");
      }
      await refresh();
      setDraft(emptyDraft);
      toast.success("Template created");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create template",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing?.recordId) {
      toast.error("Missing database id for this template");
      return;
    }

    setIsSaving(true);
    try {
      const payload = parseDraft(editing);
      const res = await fetch(`/api/room-templates/${editing.recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to update template");
      }
      await refresh();
      setEditing(null);
      toast.success("Template updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update template",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (recordId?: string) => {
    if (!recordId) {
      toast.error("Missing database id for this template");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/room-templates/${recordId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to delete template");
      }
      await refresh();
      toast.success("Template deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete template",
      );
    } finally {
      setIsSaving(false);
    }
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
              Template Management
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
              href="/admin/furniture"
              className="rounded-md border border-border px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              Furniture
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-10 space-y-8">
        {isLoading && (
          <div className="rounded-xl border border-border/60 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
            Loading room templates...
          </div>
        )}

        <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-soft space-y-6">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-accent" />
            <h2 className="text-lg font-display font-semibold text-foreground">
              Add Room Template
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="template-id">Template ID</Label>
              <Input
                id="template-id"
                value={draft.id}
                onChange={(e) =>
                  handleDraftChange({ id: slugify(e.target.value) })
                }
                placeholder="e.g. guest-bedroom"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                value={draft.name}
                onChange={(e) =>
                  handleDraftChange({
                    name: e.target.value,
                    id: draft.id || slugify(e.target.value),
                  })
                }
                placeholder="e.g. Guest Bedroom"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="template-icon">Icon / Label</Label>
              <Input
                id="template-icon"
                value={draft.icon}
                onChange={(e) => handleDraftChange({ icon: e.target.value })}
                placeholder="e.g. BR"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="template-description">Description</Label>
              <Input
                id="template-description"
                value={draft.description}
                onChange={(e) =>
                  handleDraftChange({ description: e.target.value })
                }
                placeholder="Describe the template intent"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="template-thumb">Thumbnail URL</Label>
              <Input
                id="template-thumb"
                value={draft.thumbnail}
                onChange={(e) =>
                  handleDraftChange({ thumbnail: e.target.value })
                }
                placeholder="Leave blank to auto-generate"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="template-width">Width (ft)</Label>
              <Input
                id="template-width"
                type="number"
                min="1"
                step="0.5"
                value={draft.width}
                onChange={(e) =>
                  handleDraftChange({ width: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="template-length">Length (ft)</Label>
              <Input
                id="template-length"
                type="number"
                min="1"
                step="0.5"
                value={draft.length}
                onChange={(e) =>
                  handleDraftChange({ length: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="template-floor-type">Floor Type</Label>
              <select
                id="template-floor-type"
                value={draft.suggestedFloorType}
                onChange={(e) =>
                  handleDraftChange({
                    suggestedFloorType: e.target.value as DraftTemplate["suggestedFloorType"],
                  })
                }
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="tile">Tile</option>
                <option value="carpet">Carpet</option>
                <option value="wood">Wood</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="template-wall-color">Wall Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="template-wall-color"
                  type="color"
                  value={draft.suggestedWallColor}
                  onChange={(e) =>
                    handleDraftChange({ suggestedWallColor: e.target.value })
                  }
                  className="h-10 w-12 rounded border border-border"
                />
                <Input
                  value={draft.suggestedWallColor}
                  onChange={(e) =>
                    handleDraftChange({ suggestedWallColor: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="template-floor-color">Floor Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="template-floor-color"
                  type="color"
                  value={draft.suggestedFloorColor}
                  onChange={(e) =>
                    handleDraftChange({ suggestedFloorColor: e.target.value })
                  }
                  className="h-10 w-12 rounded border border-border"
                />
                <Input
                  value={draft.suggestedFloorColor}
                  onChange={(e) =>
                    handleDraftChange({ suggestedFloorColor: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1 md:col-span-2 lg:col-span-3">
              <Label htmlFor="template-furniture-json">Default Furniture JSON</Label>
              <textarea
                id="template-furniture-json"
                value={draft.furnitureJson}
                onChange={(e) =>
                  handleDraftChange({ furnitureJson: e.target.value })
                }
                className="min-h-52 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
                placeholder='[{"type":"office-desk","name":"Office Desk","x":1,"y":1,"width":5,"length":2.5,"color":"#2F4F4F"}]'
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => void handleAdd()} disabled={isSaving}>
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
            <span className="text-xs text-muted-foreground">
              Furniture JSON uses the same shape consumed by the designer.
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">
              Room Templates
            </h2>
            <p className="text-xs text-muted-foreground">
              {templates.length} total templates
            </p>
          </div>

          <div className="divide-y divide-border/60">
            {templates.map((template) => (
              <div key={template.recordId ?? template.id} className="py-4 flex flex-col gap-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-background px-2 text-sm font-semibold">
                        {template.icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {template.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {template.id} • {template.dimensions.width}×{template.dimensions.length} ft • {template.suggestedFloorType}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {template.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {template.defaultFurniture.length} furniture items
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(buildDraftFromTemplate(template))}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete template?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the template from the designer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => void handleDelete(template.recordId)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No templates available.
              </p>
            )}
          </div>
        </section>
      </main>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template metadata, colors, and default furniture JSON.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Template ID</Label>
                <Input
                  value={editing.id}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, id: slugify(e.target.value) } : prev,
                    )
                  }
                />
              </div>
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
              <div className="space-y-1 md:col-span-2">
                <Label>Description</Label>
                <Input
                  value={editing.description}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Icon / Label</Label>
                <Input
                  value={editing.icon}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, icon: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Thumbnail URL</Label>
                <Input
                  value={editing.thumbnail}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, thumbnail: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Width (ft)</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.5"
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
                  min="1"
                  step="0.5"
                  value={editing.length}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, length: Number(e.target.value) } : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Floor Type</Label>
                <select
                  value={editing.suggestedFloorType}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            suggestedFloorType: e.target.value as DraftTemplate["suggestedFloorType"],
                          }
                        : prev,
                    )
                  }
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="tile">Tile</option>
                  <option value="carpet">Carpet</option>
                  <option value="wood">Wood</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Wall Color</Label>
                <Input
                  value={editing.suggestedWallColor}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? { ...prev, suggestedWallColor: e.target.value }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Floor Color</Label>
                <Input
                  value={editing.suggestedFloorColor}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? { ...prev, suggestedFloorColor: e.target.value }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Default Furniture JSON</Label>
                <textarea
                  value={editing.furnitureJson}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, furnitureJson: e.target.value } : prev,
                    )
                  }
                  className="min-h-56 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
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

export default TemplateAdminPanel;
