"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useCanvas, generateObjectId } from "@/context/canvas-context";
import { 
  Copy, 
  Trash2, 
  Undo2, 
  Redo2, 
  Plus, 
  Image as ImageIcon,
  ClipboardPaste,
  Layers,
  ArrowUp,
  ArrowDown,
  CopyPlus
} from "lucide-react";
import { ReactNode, useCallback } from "react";
import { toast } from "sonner";
import { useDeleteFrame } from "@/features/use-frame";
import { useParams } from "next/navigation";

interface CanvasContextMenuProps {
  children: ReactNode;
}

export const CanvasContextMenu = ({ children }: CanvasContextMenuProps) => {
  const params = useParams();
  const projectId = params.projectId as string;
  const deleteMutation = useDeleteFrame(projectId);

  const { 
    selectedFrameId, 
    selectedImageId,
    frames, 
    canvasImages, 
    deleteFrame,
    removeCanvasImage, 
    setSelectedFrameId,
    setSelectedImageId,
    copyItem,
    pasteItem,
    duplicateItem,
    bringToFront,
    sendToBack,
    undo,
    redo,
    canUndo,
    canRedo,
    copiedItem,
    addFrame,
    addCanvasImage
  } = useCanvas();

  const handleCopy = useCallback(() => {
    if (selectedFrameId) {
      const frame = frames.find(f => f.id === selectedFrameId);
      if (frame) {
        copyItem('frame', frame);
        toast.success("Frame copied");
      }
    } else if (selectedImageId) {
      const image = canvasImages.find(i => i.id === selectedImageId);
      if (image) {
        copyItem('image', image);
        toast.success("Image copied");
      }
    }
  }, [selectedFrameId, selectedImageId, frames, canvasImages, copyItem]);

  const handlePaste = useCallback(() => {
    pasteItem(); 
    toast.success(`${copiedItem?.type === 'frame' ? 'Frame' : 'Image'} pasted`);
  }, [pasteItem, copiedItem]);

  const handleDelete = useCallback(() => {
    if (selectedFrameId) {
      deleteMutation.mutate(selectedFrameId, {
        onSuccess: () => {
          deleteFrame(selectedFrameId);
        }
      });
    } else if (selectedImageId) {
      removeCanvasImage(selectedImageId);
      toast.success("Image deleted");
    }
  }, [selectedFrameId, selectedImageId, deleteFrame, removeCanvasImage, deleteMutation]);

  const handleDuplicate = useCallback(() => {
    if (selectedFrameId) {
      duplicateItem(selectedFrameId, 'frame');
      toast.success("Frame duplicated");
    } else if (selectedImageId) {
      duplicateItem(selectedImageId, 'image');
      toast.success("Image duplicated");
    }
  }, [selectedFrameId, selectedImageId, duplicateItem]);

  const handleBringToFront = useCallback(() => {
    if (selectedFrameId) bringToFront(selectedFrameId, 'frame');
    else if (selectedImageId) bringToFront(selectedImageId, 'image');
  }, [selectedFrameId, selectedImageId, bringToFront]);

  const handleSendToBack = useCallback(() => {
    if (selectedFrameId) sendToBack(selectedFrameId, 'frame');
    else if (selectedImageId) sendToBack(selectedImageId, 'image');
  }, [selectedFrameId, selectedImageId, sendToBack]);

  const handleNewFrame = useCallback(() => {
    const newFrame = {
      id: generateObjectId(),
      title: "New Frame",
      htmlContent: '<div class="p-4">New Frame Content</div>',
      initialPosition: { x: 400, y: 400 }
    };
    addFrame(newFrame, true);
    setSelectedFrameId(newFrame.id);
    toast.success("New frame added");
  }, [addFrame, setSelectedFrameId]);

  const handleInsertImage = useCallback(() => {
    const newImage = {
      id: generateObjectId(),
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
      x: 450,
      y: 450,
      width: 300,
      height: 200
    };
    addCanvasImage(newImage, true);
    setSelectedImageId(newImage.id);
    toast.success("Image inserted");
  }, [addCanvasImage, setSelectedImageId]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 p-2 rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
        <ContextMenuItem 
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center gap-2 rounded-lg cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400"
        >
          <Undo2 className="size-4" />
          <span>Undo</span>
          <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={redo}
          disabled={!canRedo}
          className="flex items-center gap-2 rounded-lg cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400"
        >
          <Redo2 className="size-4" />
          <span>Redo</span>
          <ContextMenuShortcut>⇧⌘Z</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuSeparator className="bg-zinc-200/50 dark:bg-zinc-800/50 my-1.5" />
        
        <ContextMenuItem 
          onClick={handleCopy}
          disabled={!selectedFrameId && !selectedImageId}
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

        <ContextMenuItem 
          onClick={handleDuplicate}
          disabled={!selectedFrameId && !selectedImageId}
          className="flex items-center gap-2 rounded-lg cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400"
        >
          <CopyPlus className="size-4" />
          <span>Duplicate</span>
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-zinc-200/50 dark:bg-zinc-800/50 my-1.5" />

        <ContextMenuItem 
          onClick={handleBringToFront}
          disabled={!selectedFrameId && !selectedImageId}
          className="flex items-center gap-2 rounded-lg cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400"
        >
          <ArrowUp className="size-4" />
          <span>Bring to Front</span>
          <ContextMenuShortcut>]</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem 
          onClick={handleSendToBack}
          disabled={!selectedFrameId && !selectedImageId}
          className="flex items-center gap-2 rounded-lg cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400"
        >
          <ArrowDown className="size-4" />
          <span>Send to Back</span>
          <ContextMenuShortcut>[</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-zinc-200/50 dark:bg-zinc-800/50 my-1.5" />

        <ContextMenuItem 
          onClick={handleDelete}
          disabled={!selectedFrameId && !selectedImageId}
          className="flex items-center gap-2 rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <Trash2 className="size-4" />
          <span>Delete</span>
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-zinc-200/50 dark:bg-zinc-800/50 my-1.5" />

        <ContextMenuItem 
          onClick={handleNewFrame}
          className="flex items-center gap-2 rounded-lg cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400"
        >
          <Plus className="size-4" />
          <span>New Frame</span>
          <ContextMenuShortcut>⌘N</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem 
          onClick={handleInsertImage}
          className="flex items-center gap-2 rounded-lg cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400"
        >
          <ImageIcon className="size-4" />
          <span>Insert Image</span>
          <ContextMenuShortcut>⌘I</ContextMenuShortcut>
        </ContextMenuItem>

      </ContextMenuContent>
    </ContextMenu>
  );
};
