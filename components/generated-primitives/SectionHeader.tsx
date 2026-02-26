import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SectionHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {actionLabel && (
        <Button variant="ghost" size="sm" onClick={onAction} className="text-xs font-semibold text-primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
