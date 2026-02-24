"use client";

import * as React from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import Link from "next/link";
import { useTheme } from "next-themes";
import { LogOutIcon, MoonIcon, SunIcon } from "lucide-react";

import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const { user } = useKindeBrowserClient();
  const { theme, setTheme } = useTheme();

  // prevents SSR/CSR mismatch for theme icon
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";

  return (
    <div className="sticky top-0 right-0 left-0 z-30 p-1 md:p-0">
      <header className="h-16 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 md:gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Toggle theme"
              className={cn(
                "relative h-9 w-9 rounded-full",
                "border-border/60 bg-background/70 hover:bg-accent/60",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {/* Keep icons stable, avoid flicker */}
              {mounted ? (
                <>
                  <SunIcon
                    className={cn(
                      "absolute h-4.5 w-4.5 transition-all duration-200",
                      isDark
                        ? "scale-100 rotate-0 opacity-100"
                        : "scale-0 -rotate-90 opacity-0"
                    )}
                  />
                  <MoonIcon
                    className={cn(
                      "absolute h-4.5 w-4.5 transition-all duration-200",
                      isDark
                        ? "scale-0 rotate-90 opacity-0"
                        : "scale-100 rotate-0 opacity-100"
                    )}
                  />
                </>
              ) : (
                <span className="sr-only">Toggle theme</span>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "rounded-full",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    )}
                    aria-label="Open account menu"
                  >
                    <Avatar className="h-9 w-9 shrink-0 rounded-full border border-border/60">
                      <AvatarImage
                        src={user?.picture || ""}
                        alt={user?.given_name || "User avatar"}
                      />
                      <AvatarFallback className="rounded-full">
                        {(user?.given_name?.charAt(0) || "").toUpperCase()}
                        {(user?.family_name?.charAt(0) || "").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="space-y-1">
                    <div className="text-sm font-medium leading-none">
                      {user?.given_name} {user?.family_name}
                    </div>
                    {user?.email && (
                      <div className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </div>
                    )}
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <LogoutLink className="flex w-full items-center gap-2">
                      <LogOutIcon className="size-4" />
                      Logout
                    </LogoutLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <LoginLink>
                <Button className="h-9">Sign in</Button>
              </LoginLink>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;