import React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SettingsRowProps {
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  value?: string;
  type?: "toggle" | "navigation" | "value";
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onClick?: () => void;
  className?: string;
}

export function SettingsRow({
  label,
  subLabel,
  icon,
  value,
  type = "navigation",
  checked,
  onCheckedChange,
  onClick,
  className,
}: SettingsRowProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 bg-card rounded-2xl mb-2 hover:bg-muted/30 transition-all cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
        <div>
          <h4 className="text-[15px] font-semibold">{label}</h4>
          {subLabel && <p className="text-xs text-muted-foreground">{subLabel}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {type === "value" && value && (
          <span className="text-sm font-medium text-muted-foreground">{value}</span>
        )}
        {type === "toggle" && (
          <Switch 
            checked={checked} 
            onCheckedChange={onCheckedChange}
            onClick={(e) => e.stopPropagation()} 
          />
        )}
        {type === "navigation" && (
          <ChevronRight className="size-5 text-muted-foreground/50" />
        )}
      </div>
    </div>
  );
}
