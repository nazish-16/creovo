import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string | number;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  trend,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {change && (
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-semibold mt-1",
                trend === "up" ? "text-emerald-500" : trend === "down" ? "text-rose-500" : "text-muted-foreground"
              )}>
                {trend === "up" && <ArrowUpRight className="size-3" />}
                {trend === "down" && <ArrowDownRight className="size-3" />}
                {change}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
