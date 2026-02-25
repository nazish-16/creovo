"use client";

import { CameraIcon, ChevronDown, Palette, Save, Wand2, Lock, LockOpen, ImageIcon } from "lucide-react";
import { useCanvas, generateObjectId } from "@/context/canvas-context";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import PromptInput from "../prompt-input";
import { useRef, useState } from "react";
import { parseThemeColors } from "@/lib/themes";
import ThemeSelector from "./theme-selector";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import {
  useGenerateDesignById,
  useUpdateProject,
} from "@/features/use-project-id";
import { Spinner } from "../ui/spinner";
import CodeExportDialog from "./code-export-dialog";
import { toast } from "sonner";

const CanvasFloatingToolbar = ({
  projectId,
  projectName,
  isScreenshotting,
  onScreenshot,
}: {
  projectId: string;
  projectName: string | null;
  isScreenshotting: boolean;
  onScreenshot: () => void;
}) => {
  const { 
    themes, 
    theme: currentTheme, 
    setTheme, 
    frames, 
    designSystemLocked, 
    setDesignSystemLocked,
    setLoadingStatus,
    addCanvasImage
  } = useCanvas();
  const [promptText, setPromptText] = useState<string>("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { mutate, isPending } = useGenerateDesignById(projectId);

  const update = useUpdateProject(projectId);

  const handleAIGenerate = () => {
    if (!promptText) return;
    mutate(promptText);
  };

  const handleUpdate = () => {
    if (!currentTheme) return;
    update.mutate({ themeId: currentTheme.id }, {
      onSuccess: () => {
        setLoadingStatus("completed");
        setTimeout(() => {
          setLoadingStatus("idle");
        }, 500);
      }
    });
  };

  const handleToggleLock = () => {
    const newLocked = !designSystemLocked;
    setDesignSystemLocked(newLocked);
    update.mutate({ designSystemLocked: newLocked });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      addCanvasImage({
        id: generateObjectId(),
        url,
        x: 150, // Default position
        y: 150,
        width: 300,
        height: 200,
      });
      toast.success("Image added to canvas");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div
      className="
   fixed top-[72px] md:top-15 left-1/2 -translate-x-1/2 z-50 transition-all duration-300
  "
    >
      <div
        className="w-full max-w-2xl bg-background
     dark:bg-gray-950 rounded-full shadow-xl border
    "
      >
        <div className="flex flex-row items-center gap-1 md:gap-2 px-2 md:px-3 min-w-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon-sm"
                className="size-8 md:size-9 px-0 md:px-4 bg-primary
                  text-white rounded-2xl cursor-pointer shrink-0"
              >
                <Wand2 className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-2!
             rounded-xl! shadow-lg border mt-1
            "
            >
              <PromptInput
                promptText={promptText}
                setPromptText={setPromptText}
                className="min-h-[150px] ring-0!
                rounded-xl! shadow-none border-muted
                "
                hideSubmitBtn={true}
              />
              <Button
                disabled={isPending}
                className="mt-2 w-full
                  bg-primary
                  text-white rounded-2xl
                  shadow-lg shadow-purple-200/50 cursor-pointer
                "
                onClick={handleAIGenerate}
              >
                {isPending ? <Spinner /> : <>Generate Design</>}
              </Button>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger>
              <div className="flex items-center gap-1.5 md:gap-2 px-1 md:px-3 py-2 shrink-0">
                <Palette className="size-4" />
                <div className="flex gap-1 md:gap-1.5">
                  {themes?.slice(0, 3)?.map((theme, index) => {
                    const color = parseThemeColors(theme.style);
                    return (
                      <div
                        role="button"
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme(theme.id);
                        }}
                        className={cn(
                          `w-5 h-5 md:w-6.5 md:h-6.5 rounded-full cursor-pointer
                           `,
                          currentTheme?.id === theme.id &&
                            "ring-1 ring-offset-1"
                        )}
                        style={{
                          background: `linear-gradient(135deg, ${color.primary}, ${color.accent})`,
                        }}
                      />
                    );
                  })}
                  <div className="hidden md:flex">
                     {themes?.slice(3, 4)?.map((theme, index) => {
                        const color = parseThemeColors(theme.style);
                        return (
                          <div
                            role="button"
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTheme(theme.id);
                            }}
                            className={cn(
                              `w-6.5 h-6.5 rounded-full cursor-pointer
                               `,
                              currentTheme?.id === theme.id &&
                                "ring-1 ring-offset-1"
                            )}
                            style={{
                              background: `linear-gradient(135deg, ${color.primary}, ${color.accent})`,
                            }}
                          />
                        );
                      })}
                  </div>
                </div>
                <div
                  className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-sm
                "
                >
                  <span className="md:hidden">+{themes?.length - 3}</span>
                  <span className="hidden md:inline">+{themes?.length - 4}</span>
                  <ChevronDown className="size-3 md:size-4" />
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="px-0 rounded-xl
            shadow border
            "
            >
              <ThemeSelector />
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-4!" />

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleToggleLock}
            className={cn(
              "size-8 md:size-9 rounded-full cursor-pointer transition-all duration-300",
              designSystemLocked ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "text-muted-foreground hover:bg-muted"
            )}
            title={designSystemLocked ? "Design System Locked" : "Lock Design System"}
          >
            {designSystemLocked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
          </Button>

          <Separator orientation="vertical" className="h-4!" />

          {/* Image Upload Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => imageInputRef.current?.click()}
            className="size-8 md:size-9 rounded-full cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            title="Upload Image to Canvas"
          >
            <ImageIcon className="size-4" />
          </Button>
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <Separator orientation="vertical" className="h-4!" />

          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <CodeExportDialog
              frames={frames}
              theme_style={currentTheme?.style}
              projectName={projectName || "Project"}
            />
            <Button
              variant="outline"
              size="icon-sm"
              className="size-8 md:size-9 rounded-full cursor-pointer"
              disabled={isScreenshotting}
              onClick={onScreenshot}
            >
              {isScreenshotting ? (
                <Spinner />
              ) : (
                <CameraIcon className="size-4 md:size-4.5" />
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-8 md:h-9 px-3 md:px-4 rounded-full cursor-pointer bg-primary hover:bg-primary/90"
              onClick={handleUpdate}
            >
              {update.isPending ? (
                <Spinner />
              ) : (
                <>
                  <Save className="size-3.5 md:size-4" />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasFloatingToolbar;
