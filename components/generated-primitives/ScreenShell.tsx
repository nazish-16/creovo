import React from "react";
import { cn } from "@/lib/utils";

interface ScreenShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  bottomNav?: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

export function ScreenShell({
  children,
  header,
  bottomNav,
  className,
  scrollable = true,
}: ScreenShellProps) {
  return (
    <div className={cn(
      "flex flex-col w-full h-full bg-background text-foreground overflow-hidden relative",
      className
    )}>
      {/* Status Bar / Notch Spacer */}
      <div className="h-[env(safe-area-inset-top,20px)] w-full shrink-0 bg-background" />

      {header && (
        <div className="sticky top-0 z-40 w-full shrink-0 bg-background/80 backdrop-blur-md border-b border-border">
          {header}
        </div>
      )}

      <main className={cn(
        "flex-1 w-full relative",
        scrollable ? "overflow-y-auto custom-scrollbar" : "overflow-hidden",
        bottomNav ? "pb-24" : "pb-10"
      )}>
        {children}
      </main>

      {bottomNav && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom,20px)] pt-2">
          {bottomNav}
        </div>
      )}
    </div>
  );
}
