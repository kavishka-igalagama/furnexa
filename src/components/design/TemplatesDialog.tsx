import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { roomTemplates, type RoomTemplate } from "./RoomTemplates";

interface TemplatesDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: RoomTemplate) => void;
}

const TemplatesDialog = ({ open, onClose, onSelect }: TemplatesDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Room Templates</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {roomTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onSelect(template);
                onClose();
              }}
              className="group p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all text-left space-y-2"
            >
              <div className="text-2xl">{template.icon}</div>
              <p className="text-sm font-body font-semibold text-foreground">
                {template.name}
              </p>
              <p className="text-[11px] text-muted-foreground font-body">
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
      </DialogContent>
    </Dialog>
  );
};

export default TemplatesDialog;
