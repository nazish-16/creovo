"use client";

import { cn } from "@/lib/utils";
import {
  CodeIcon,
  DownloadIcon,
  GripVertical,
  MoreHorizontalIcon,
  Trash2Icon,
  ReplaceIcon,
  Wand2,
  Send,
  Wand2Icon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
  Edit3Icon,
  MousePointer2Icon,
  CloudIcon,
  SaveIcon,
  SearchCheckIcon,
  LayersIcon,
  ImageIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { InputGroup, InputGroupAddon } from "../ui/input-group";
import { Input } from "../ui/input";
import { ButtonGroup } from "../ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { DEVICE_PRESETS, DevicePresetType } from "@/constant/devices";

type PropsType = {
  title: string;
  isSelected?: boolean;
  disabled?: boolean;
  isDownloading: boolean;
  scale?: number;
  isRegenerating?: boolean;
  isDeleting?: boolean;
  onOpenHtmlDialog: () => void;
  onDownloadPng?: () => void;
  onRegenerate?: (prompt: string) => void;
  onDeleteFrame?: () => void;
  devicePreset: DevicePresetType;
  onDevicePresetChange: (preset: DevicePresetType) => void;
  isEditMode: boolean;
  onEditModeToggle: () => void;
  onSave?: () => void; // Added onSave prop
  isSaving?: boolean; // Added isSaving prop
  onAnalyze?: () => void;
  onRefactor?: () => void;
  isAnalyzing?: boolean;
  isRefactoring?: boolean;
  onImageUpload?: (url: string) => void;
};
const DeviceFrameToolbar = ({
  title,
  isSelected,
  disabled,
  scale = 1.7,
  isDownloading,
  isRegenerating = false,
  isDeleting = false,
  onOpenHtmlDialog,
  onDownloadPng,
  onRegenerate,
  onDeleteFrame,
  devicePreset,
  onDevicePresetChange,
  isEditMode,
  onEditModeToggle,
  onSave, // Destructured onSave
  isSaving = false, // Destructured isSaving with default
  onAnalyze,
  onRefactor,
  isAnalyzing = false,
  isRefactoring = false,
  onImageUpload,
}: PropsType) => {
  const [promptValue, setPromptValue] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRegenerate = () => {
    if (promptValue.trim()) {
      onRegenerate?.(promptValue);
      setPromptValue("");
      setIsPopoverOpen(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onImageUpload?.(url);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  return (
    <div
      className={cn(
        `absolute -mt-1 flex items-center justify-between gap-1 rounded-full z-50 transition-all duration-300
        `,
        isSelected
          ? `left-1/2 -translate-x-1/2 border bg-card/95
            dark:bg-muted backdrop-blur-md pl-2 pr-1 py-1 shadow-xl
            min-w-[420px] h-[34px]
          `
          : "left-1/2 -translate-x-1/2 min-w-[90px] max-w-[150px] h-[24px] bg-background/20 hover:bg-background/40 backdrop-blur-[2px] border border-white/10 px-2 group-hover:bg-background/60 transition-colors"
      )}
      style={{
        top: isSelected ? "-50px" : "-38px",
        transformOrigin: "center bottom",
        transform: isSelected ? "scale(1.4)" : "scale(1.2)",
      }}
    >
      <div
        role="button"
        className="flex flex-1 cursor-grab items-center
        justify-start gap-1.5 active:cursor-grabbing h-full px-2
        "
      >
        {isSelected && <GripVertical className="size-4 text-muted-foreground" />}
        <div
          className={cn(
            `min-w-20 font-semibold text-sm
           mx-px truncate
          `,
            isSelected && "max-w-[120px]"
          )}
        >
          {title}
        </div>
      </div>

      {isSelected && (
        <>
          <Separator orientation="vertical" className="h-6 bg-border mx-1" />

          <ButtonGroup className="gap-1 items-center px-2">
            {/* Analyze Design */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={onAnalyze}
                    disabled={isAnalyzing || disabled}
                  >
                    {isAnalyzing ? (
                      <Spinner className="size-4" />
                    ) : (
                      <SearchCheckIcon className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Analyze UX Critique</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Refactor UX */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-lg text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    onClick={onRefactor}
                    disabled={isRefactoring || disabled}
                  >
                    {isRefactoring ? (
                      <Spinner className="size-4" />
                    ) : (
                      <LayersIcon className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>AI UX Refactor</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6 bg-border mx-1" />
            {/* Edit Mode Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isEditMode ? "default" : "ghost"}
                    size="icon-sm"
                    className={cn(
                      "rounded-lg transition-all duration-200",
                      isEditMode && "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                    )}
                    onClick={onEditModeToggle}
                  >
                    {isEditMode ? (
                      <MousePointer2Icon className="size-4" />
                    ) : (
                      <Edit3Icon className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isEditMode ? "Exit Edit Mode" : "Interactive Edit Mode"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {isEditMode && onSave && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                        onClick={onSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <span className="size-4 border-2 border-green-600 border-t-transparent animate-spin rounded-full" />
                        ) : (
                          <SaveIcon className="size-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Save Changes</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Add Image Button in Interactive Mode */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        onClick={handleImageClick}
                        disabled={disabled}
                      >
                        <ImageIcon className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert Image</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </>
            )}

            <Separator orientation="vertical" className="h-6 bg-border mx-1" />

            {/* Device Selector */}
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="rounded-lg">
                        {DEVICE_PRESETS[devicePreset].type === 'tablet' ? (
                          <TabletIcon className="size-4" />
                        ) : (
                          <SmartphoneIcon className="size-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Switch Device</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="center" className="w-56 p-1 rounded-xl">
                {(Object.entries(DEVICE_PRESETS) as [DevicePresetType, any][]).map(([key, preset]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => onDevicePresetChange(key)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg",
                      devicePreset === key && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {preset.type === 'tablet' ? (
                        <TabletIcon className="size-4" />
                      ) : (
                        <SmartphoneIcon className="size-4" />
                      )}
                      <span className="text-sm">{preset.name}</span>
                    </div>
                    <span className="text-[10px] opacity-50">{preset.width}x{preset.height}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6 bg-border mx-1" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={disabled}
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-lg"
                    onClick={onOpenHtmlDialog}
                  >
                    <CodeIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View HTML</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={disabled || isDownloading}
                    size="icon-sm"
                    className="rounded-lg"
                    variant="ghost"
                    onClick={onDownloadPng}
                  >
                    {isDownloading ? <Spinner /> : <DownloadIcon className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download PNG</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        disabled={disabled}
                        size="icon-sm"
                        className="rounded-lg"
                        variant="ghost"
                      >
                        {isRegenerating ? (
                          <Spinner className="size-4" />
                        ) : (
                          <Wand2 className="size-4" />
                        )}
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>AI Regenerate</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <PopoverContent align="end" className="w-80 p-2 rounded-xl shadow-2xl">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Wand2Icon className="size-4 text-blue-500" />
                    <span className="text-sm font-semibold">AI Edit Directive</span>
                  </div>
                  <InputGroup className="bg-muted/50 rounded-lg overflow-hidden border">
                    <Input
                      placeholder="Describe changes (e.g., 'Make the header dark')..."
                      value={promptValue}
                      onChange={(e) => setPromptValue(e.target.value)}
                      className="border-0 focus-visible:ring-0 bg-transparent"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRegenerate();
                        }
                      }}
                    />
                    <InputGroupAddon align="inline-end" className="pr-1">
                      <Button
                        size="icon-sm"
                        className="size-7 rounded-md"
                        disabled={!promptValue.trim() || isRegenerating}
                        onClick={handleRegenerate}
                      >
                        {isRegenerating ? (
                          <Spinner className="size-3!" />
                        ) : (
                          <Send className="size-3" />
                        )}
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="rounded-lg">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>More options</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end" className="w-40 p-1 rounded-xl">
                <DropdownMenuItem
                  disabled={disabled || isDeleting}
                  onClick={onDeleteFrame}
                  className="cursor-pointer text-destructive focus:text-destructive rounded-lg"
                >
                  {isDeleting ? (
                    <Spinner />
                  ) : (
                    <>
                      <Trash2Icon className="size-4 mr-2" />
                      Delete Frame
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </>
      )}
    </div>
  );
};

export default DeviceFrameToolbar;
