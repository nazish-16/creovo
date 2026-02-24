"use client";

import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "./ui/input-group";
import {
  CornerDownLeftIcon,
  Paperclip,
  X,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { Spinner } from "./ui/spinner";
import { useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface PropsType {
  promptText: string;
  setPromptText: React.Dispatch<React.SetStateAction<string>>;
  isLoading?: boolean;
  className?: string;
  hideSubmitBtn?: boolean;
  onSubmit?: () => void;
  aiEnhance?: boolean;
  onToggleAiEnhance?: () => void;
  images?: string[];
  setImages?: (images: string[]) => void;
}

const PromptInput = ({
  promptText,
  setPromptText,
  isLoading,
  className,
  hideSubmitBtn = false,
  onSubmit,
  aiEnhance,
  onToggleAiEnhance,
  images = [],
  setImages,
}: PropsType) => {
  const hasEnhanceToggle = onToggleAiEnhance !== undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !setImages) return;

    const next = [...images];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) return;
        next.push(event.target.result as string);
        setImages([...next]);
      };
      reader.readAsDataURL(file);
    });

    // allow re-uploading the same file
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    if (!setImages) return;
    const next = [...images];
    next.splice(index, 1);
    setImages(next);
  };

  return (
    <div className="bg-transparent w-full max-w-4xl mx-auto">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3 p-2 animate-in fade-in slide-in-from-bottom-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group size-20 rounded-2xl overflow-hidden border-2 border-border/50 bg-background shadow-sm hover:border-primary/50 transition-all duration-200"
            >
              <img src={img} alt="attached" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/90 text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
                title="Remove"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <InputGroup
        className={cn(
          "min-h-[160px] max-h-[350px] overflow-hidden rounded-[24px] bg-background flex flex-col border border-border/60 shadow-lg focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/40 transition-all duration-300",
          className
        )}
      >
        <div className="relative flex-1 flex flex-col min-h-0">
          <InputGroupTextarea
            className={cn(
              "text-base! py-6! px-6! placeholder:text-muted-foreground/40 flex-1 min-h-0 border-none focus-visible:ring-0 resize-none align-top leading-relaxed text-left!",
              "!h-full !items-start !justify-start !text-left"
            )}
            placeholder="I want to design an app that..."
            value={promptText}
            onChange={(e) => {
              setPromptText(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSubmit?.();
              }
            }}
          />
        </div>

        <InputGroupAddon
          align="block-end"
          className="flex items-center justify-between px-4 pb-4 pt-2 bg-muted/5 border-t border-border/30"
        >
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 border border-transparent hover:border-border/50"
                  title="More options"
                >
                  <Plus className="size-4" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-56 p-2 rounded-2xl border-border shadow-2xl animate-in zoom-in-95 duration-200">
                <DropdownMenuItem
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-3 py-3 cursor-pointer rounded-xl focus:bg-primary/5 focus:text-primary"
                >
                  <Paperclip className="size-4" />
                  <span className="font-medium">Add photos & files</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-3 py-3 cursor-pointer rounded-xl">
                  <MoreHorizontal className="size-4" />
                  <span className="font-medium">More</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          {!hideSubmitBtn && (
            <InputGroupButton
              variant="default"
              className="gap-2 rounded-2xl px-6 h-11 text-sm font-bold shadow-md transition-all active:scale-95 bg-primary hover:bg-primary/95 hover:shadow-primary/20"
              size="sm"
              disabled={(!promptText?.trim() && images.length === 0) || isLoading}
              onClick={() => onSubmit?.()}
              title="Generate (Ctrl+Enter)"
            >
              {isLoading ? (
                <Spinner className="size-4" />
              ) : (
                <>
                  Design
                  <CornerDownLeftIcon className="size-4 opacity-70" />
                </>
              )}
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
};

export default PromptInput;
