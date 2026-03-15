"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { RoomTemplate } from "@/data/templates";

interface TemplatesDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: RoomTemplate) => void;
  templates: RoomTemplate[];
  isLoading?: boolean;
}

const TemplatesDialog = ({
  open,
  onClose,
  onSelect,
  templates,
  isLoading = false,
}: TemplatesDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Room Templates</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground font-body">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading templates...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelect(template);
                  onClose();
                }}
                className="group p-3 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all text-left space-y-2"
              >
                <div className="rounded-md overflow-hidden border border-border/60">
                  <img
                    src={template.thumbnail}
                    alt={`${template.name} template preview`}
                    className="w-full h-20 object-cover"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xl">{template.icon}</div>
                  <p className="text-sm font-body font-semibold text-foreground">
                    {template.name}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground font-body">
                  {template.description}
                </p>
                <p className="text-[10px] text-muted-foreground font-body">
                  {template.dimensions.width}ft × {template.dimensions.length}ft
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.defaultFurniture.map((f, i) => (
                    <span
                      key={i}
                      className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground font-body"
                    >
                      {f.name}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TemplatesDialog;
