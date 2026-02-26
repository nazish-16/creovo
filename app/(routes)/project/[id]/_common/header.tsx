import React from "react";
import { useTheme } from "next-themes";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, DownloadIcon, MoonIcon, SunIcon, Trash2Icon } from "lucide-react";
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

import ProjectTabs from "@/components/project-tabs";
import { useCanvas } from "@/context/canvas-context";
import { getHTMLWrapper } from "@/lib/frame-wrapper";

const Header = ({ projectName }: { projectName?: string }) => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const { frames, theme: canvasTheme } = useCanvas();
  const [isExporting, setIsExporting] = React.useState(false);

  const deleteProject = useDeleteProject(id);

  const handleDelete = () => {
    deleteProject.mutate();
  };

  const handleExportPDF = async () => {
    if (frames.length === 0) {
      toast.error("No designs to export");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Generating PDF...", {
      description: "Capturing designs (this may take a few moments)..."
    });

    try {
      const { jsPDF } = await import("jspdf");
      
      // A4 Landscape dimensions in PT
      const pdfWidth = 841.89; 
      const pdfHeight = 595.28;
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const margin = 40;
      const gap = 20;
      const designsPerPage = 4; // Show up to 4 small designs in a row per page
      const frameWidth = 420;
      const frameHeight = 800;

      const availableWidth = pdfWidth - (margin * 2) - (gap * (designsPerPage - 1));
      const targetWidth = availableWidth / designsPerPage;
      const scaleFactor = targetWidth / frameWidth;
      const targetHeight = frameHeight * scaleFactor;

      for (let i = 0; i < frames.length; i++) {
        if (i > 0 && i % designsPerPage === 0) {
          pdf.addPage();
        }

        const frame = frames[i];
        const pageIndex = i % designsPerPage;
        
        // Match the wrapper used in DeviceFrame
        const fullHtml = getHTMLWrapper(
          frame.htmlContent, 
          frame.title, 
          canvasTheme?.style, 
          frame.id, 
          false
        );
        
        toast.loading(`Capturing design ${i + 1} of ${frames.length}...`, { id: toastId });

        const response = await axios.post(
          "/api/screenshot",
          {
            html: fullHtml,
            width: frameWidth,
            height: frameHeight,
          },
          {
            responseType: "blob",
          }
        );

        const imgData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(response.data);
        });

        // Add background for each slot if it's a new page
        if (pageIndex === 0) {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pdfWidth, pdfHeight, "F");
        }

        // Calculate position for current design in the row
        const x = margin + (pageIndex * (targetWidth + gap));
        const y = (pdfHeight - targetHeight) / 2 + 20; // Centered vertically with some offset for title

        // Add the screenshot
        pdf.addImage(imgData, "PNG", x, y, targetWidth, targetHeight);
        
        // Add Frame Title above each screen
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        pdf.text(
          frame.title || `Design ${i + 1}`, 
          x + (targetWidth / 2), 
          y - 15, 
          { align: "center", maxWidth: targetWidth }
        );
        
        // Add Project info & Page footer (only once per page)
        if (pageIndex === 0 || i === frames.length - 1) {
          const currentPage = Math.floor(i / designsPerPage) + 1;
          const totalPages = Math.ceil(frames.length / designsPerPage);
          
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(150, 150, 150);
          pdf.text(
            `${projectName || "Creovo Project"} • Page ${currentPage} of ${totalPages}`, 
            pdfWidth / 2, 
            pdfHeight - 20, 
            { align: "center" }
          );
        }
      }

      pdf.save(`${projectName?.replace(/\s+/g, "-").toLowerCase() || "creovo"}-overview.pdf`);
      toast.success("PDF exported successfully!", { id: toastId });
    } catch (error) {
      console.error("PDF Export failed:", error);
      toast.error("Failed to export designs to PDF. Please try again.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full">
      <header className="h-12 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-4 gap-2">
          <div className="flex items-center gap-2 shrink-0">
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
          </div>

          <ProjectTabs projectName={projectName} />

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
              onClick={handleExportPDF}
              disabled={isExporting}
              title="Export all designs to PDF"
            >
              {isExporting ? (
                <Spinner className="size-4" />
              ) : (
                <DownloadIcon className="size-4" />
              )}
            </Button>

            <Separator orientation="vertical" className="h-4 mx-1" />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  disabled={deleteProject.isPending}
                  title="Delete project"
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

