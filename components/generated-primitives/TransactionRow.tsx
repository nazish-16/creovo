import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TransactionRowProps {
  title: string;
  subtitle: string;
  amount: string;
  status?: string;
  image?: string;
  icon?: React.ReactNode;
  isPositive?: boolean;
  className?: string;
}

export function TransactionRow({
  title,
  subtitle,
  amount,
  status,
  image,
  icon,
  isPositive,
  className,
}: TransactionRowProps) {
  return (
    <div className={cn("flex items-center justify-between p-3 rounded-2xl hover:bg-muted/50 transition-colors", className)}>
      <div className="flex items-center gap-3">
        {image ? (
          <Avatar className="size-11 rounded-2xl border border-border/50">
            <AvatarImage src={image} />
            <AvatarFallback className="rounded-2xl">{title[0]}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="size-11 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
            {icon || <span>{title[0]}</span>}
          </div>
        )}
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn(
          "text-sm font-bold",
          isPositive ? "text-emerald-500" : "text-foreground"
        )}>
          {isPositive ? "+" : ""}{amount}
        </p>
        {status && <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-bold mt-0.5">{status}</p>}
      </div>
    </div>
  );
}
