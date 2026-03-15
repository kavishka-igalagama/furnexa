import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LayoutTemplate } from "lucide-react";

export interface RoomSpec {
  width: number;
  height: number;
  wallColor: string;
  floorColor: string;
  floorType: "tile" | "carpet" | "wood";
  ceilingColor?: string;
}

const wallColors = [
  { label: "White", value: "#F5F0EB" },
  { label: "Cream", value: "#F5E6D3" },
  { label: "Light Gray", value: "#E8E4E0" },
  { label: "Warm Beige", value: "#E8D5C4" },
  { label: "Sage", value: "#C5CCBE" },
  { label: "Soft Blue", value: "#C8D4DE" },
];

const floorColors = [
  { label: "Honey Oak", value: "#d4a76a" },
  { label: "Classic Teak", value: "#b88e5a" },
  { label: "Walnut Brown", value: "#6b4226" },
  { label: "Slate Gray", value: "#b0abad" },
  { label: "Soft Ivory", value: "#e8e4e0" },
  { label: "Sand Beige", value: "#c9b9a6" },
];

interface RoomFormProps {
  room: RoomSpec;
  onChange: (room: RoomSpec) => void;
  onOpenTemplates: () => void;
}

const RoomForm = ({ room, onChange, onOpenTemplates }: RoomFormProps) => {
  const update = (partial: Partial<RoomSpec>) =>
    onChange({ ...room, ...partial });

  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm font-semibold text-foreground">
        Room Details
      </h3>

      <Button
        variant="outline"
        className="w-full gap-2 border-accent/30 hover:border-accent hover:bg-accent/5 transition-all"
        onClick={onOpenTemplates}
      >
        <LayoutTemplate className="w-4 h-4 text-accent" />
        <span className="font-body text-sm">Choose Room Template</span>
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Width (ft)</Label>
          <Input
            type="number"
            value={room.width}
            onChange={(e) => update({ width: Number(e.target.value) || 10 })}
            className="h-9 text-sm"
            min={10}
            max={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Length (ft)</Label>
          <Input
            type="number"
            value={room.height}
            onChange={(e) => update({ height: Number(e.target.value) || 10 })}
            className="h-9 text-sm"
            min={10}
            max={100}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Wall Color</Label>
        <div className="flex gap-2 flex-wrap">
          {wallColors.map((c) => (
            <button
              key={c.value}
              onClick={() => update({ wallColor: c.value })}
              aria-label={`Wall color ${c.label}`}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                room.wallColor === c.value
                  ? "border-accent scale-110 shadow-gold"
                  : "border-border hover:border-muted-foreground"
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Floor Color</Label>
        <div className="flex gap-2 flex-wrap">
          {floorColors.map((c) => (
            <button
              key={c.value}
              onClick={() => update({ floorColor: c.value })}
              aria-label={`Floor color ${c.label}`}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                room.floorColor === c.value
                  ? "border-accent scale-110 shadow-gold"
                  : "border-border hover:border-muted-foreground"
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Floor Type</Label>
        <Select
          value={room.floorType}
          onValueChange={(v) =>
            update({ floorType: v as RoomSpec["floorType"] })
          }
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tile">Tile</SelectItem>
            <SelectItem value="carpet">Carpet</SelectItem>
            <SelectItem value="wood">Wood</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default RoomForm;
