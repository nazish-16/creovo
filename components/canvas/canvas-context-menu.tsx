"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useCanvas } from "@/context/canvas-context";
import { 
  Copy, 
  Trash2, 
  Undo2, 
  Redo2, 
  Plus, 
  Image as ImageIcon,
  ClipboardPaste
} from "lucide-react";
import { ReactNode, useCallback } from "react";
import { toast } from "sonner";

interface CanvasContextMenuProps {
  children: ReactNode;
}

export const CanvasContextMenu = ({ children }: CanvasContextMenuProps) => {
  const { 
    selectedFrameId, 
    frames, 
    canvasImages, 
    removeCanvasImage, 
    setSelectedFrameId,
    setFrames,
    copyItem,
    pasteItem,
    copiedItem
  } = useCanvas();

  const handleCopy = useCallback(() => {
    if (selectedFrameId) {
      const frame = frames.find(f => f.id === selectedFrameId);
      if (frame) {
        copyItem('frame', frame);
        toast.success("Frame copied");
      }
    }
  }, [selectedFrameId, frames, copyItem]);

  const handlePaste = useCallback((e: React.MouseEvent) => {
    pasteItem(400, 400); 
    toast.success(`${copiedItem?.type === 'frame' ? 'Frame' : 'Image'} pasted`);
  }, [pasteItem, copiedItem]);

  const handleDelete = useCallback(() => {
    if (selectedFrameId) {
      setFrames(prev => prev.filter(f => f.id !== selectedFrameId));
      setSelectedFrameId(null);
      toast.success("Frame deleted");
    }
  }, [selectedFrameId, setFrames, setSelectedFrameId]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 p-2 rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
        <ContextMenuItem className="flex items-center gap-2 rounded-lg cursor-pointer" disabled>
          <Undo2 className="size-4 opacity-50" />
          <span>Undo</span>
          <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem className="flex items-center gap-2 rounded-lg cursor-pointer" disabled>
          <Redo2 className="size-4 opacity-50" />
          <span>Redo</span>
          <ContextMenuShortcut>⇧⌘Z</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuSeparator className="bg-zinc-200/50 dark:bg-zinc-800/50 my-1.5" />
        
        <ContextMenuItem 
          onClick={handleCopy}
          disabled={!selectedFrameId}
          className="flex items-center gap-2 rounded-lg cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400"
        >
          <Copy className="size-4" />
          <span>Copy</span>
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={handlePaste}
          disabled={!copiedItem}
          className="flex items-center gap-2 rounded-lg cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400"
        >
          <ClipboardPaste className="size-4" />
          <span>Paste</span>
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-zinc-200/50 dark:bg-zinc-800/50 my-1.5" />

        <ContextMenuItem 
          onClick={handleDelete}
          disabled={!selectedFrameId}
          className="flex items-center gap-2 rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <Trash2 className="size-4" />
          <span>Delete</span>
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-zinc-200/50 dark:bg-zinc-800/50 my-1.5" />

        <ContextMenuItem className="flex items-center gap-2 rounded-lg cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400">
          <Plus className="size-4" />
          <span>New Frame</span>
          <ContextMenuShortcut>F</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem className="flex items-center gap-2 rounded-lg cursor-pointer opacity-50">
          <ImageIcon className="size-4" />
          <span>Insert Image</span>
          <ContextMenuShortcut>I</ContextMenuShortcut>
        </ContextMenuItem>

      </ContextMenuContent>
    </ContextMenu>
  );
};
