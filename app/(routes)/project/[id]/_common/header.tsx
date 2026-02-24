import React from "react";
import { useTheme } from "next-themes";
import { useRouter, useParams } from "next/navigation";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, MoonIcon, SunIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeleteProject } from "@/features/use-project-id";
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
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";

const Header = ({ projectName }: { projectName?: string }) => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const deleteProject = useDeleteProject(id);

  const handleDelete = () => {
    deleteProject.mutate();
  };

  return (
    <div className="sticky top-0 z-50">
      <header className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <Logo />
            <span className="text-border/80 select-none hidden sm:inline">·</span>
            <Button
              size="icon-sm"
              variant="ghost"
              className="rounded-full shrink-0"
              onClick={() => router.push("/")}
              title="Back to dashboard"
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            {projectName && (
              <p className="max-w-[160px] sm:max-w-[260px] truncate text-sm font-medium text-foreground/80">
                {projectName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  disabled={deleteProject.isPending}
                >
                  {deleteProject.isPending ? (
                    <Spinner className="size-4" />
                  ) : (
                    <Trash2Icon className="size-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-destructive/20 shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">Delete Project?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    This action cannot be undone. This will permanently delete your
                    project <span className="font-bold text-foreground">"{projectName}"</span> and all its generated screens.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="rounded-xl border-none bg-muted/50 hover:bg-muted font-medium">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-semibold transition-all shadow-lg shadow-destructive/20"
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Separator orientation="vertical" className="h-4 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 rounded-full"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              title="Toggle theme"
            >
              <SunIcon
                className={cn(
                  "absolute size-4 transition-transform duration-200",
                  isDark ? "scale-100 opacity-100" : "scale-0 opacity-0"
                )}
              />
              <MoonIcon
                className={cn(
                  "absolute size-4 transition-transform duration-200",
                  isDark ? "scale-0 opacity-0" : "scale-100 opacity-100"
                )}
              />
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
