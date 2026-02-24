import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { LoadingStatusType, useCanvas, generateObjectId } from "@/context/canvas-context";
import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";
import CanvasFloatingToolbar from "./canvas-floating-toolbar";
import { TOOL_MODE_ENUM, ToolModeType } from "@/constant/canvas";
import CanvasControls from "./canvas-controls";
import DeviceFrame from "./device-frame";
import HtmlDialog from "./html-dialog";
import { CanvasContextMenu } from "./canvas-context-menu";
import { toast } from "sonner";
import PropertiesPanel from "./properties-panel";
import { Rnd } from "react-rnd";
import { Trash2 } from "lucide-react";
import { useDeleteFrame } from "@/features/use-frame";

const Canvas = ({
  projectId,
  isPending,
  projectName,
}: {
  projectId: string;
  isPending: boolean;
  projectName: string | null;
}) => {
  const {
    theme,
    frames,
    updateFrame,
    addFrame,
    deleteFrame,
    updateFramePosition,
    selectedFrameId,
    selectedFrame,
    setSelectedFrameId,
    loadingStatus,
    setLoadingStatus,
    canvasImages,
    addCanvasImage,
    updateCanvasImage,
    removeCanvasImage,
    selectedImageId,
    setSelectedImageId,
    undo,
    redo,
    copyItem,
    pasteItem,
    duplicateItem,
    bringToFront,
    sendToBack,
    copiedItem
  } = useCanvas();

  const [toolMode, setToolMode] = useState<ToolModeType>(TOOL_MODE_ENUM.SELECT);
  const [zoomPercent, setZoomPercent] = useState<number>(53);
  const [currentScale, setCurrentScale] = useState<number>(0.53);
  const [openHtmlDialog, setOpenHtmlDialog] = useState(false);
  const [isScreenshotting, setIsScreenshotting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [activeEditFrameId, setActiveEditFrameId] = useState<string | null>(null);

  const canvasRootRef = useRef<HTMLDivElement>(null);

  const [transformState, setTransformState] = useState({ scale: 0.53, positionX: 40, positionY: 5 });

  const deleteMutation = useDeleteFrame(projectId);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      // Undo/Redo
      if (isMod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (isShift) redo();
        else undo();
      }
      if (isMod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
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
      }

      // Copy/Paste/Duplicate
      if (isMod && e.key.toLowerCase() === "c") {
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
      }

      if (isMod && e.key.toLowerCase() === "v") {
        if (copiedItem) {
          pasteItem();
          toast.success("Item pasted");
        }
      }

      if (isMod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selectedFrameId) duplicateItem(selectedFrameId, 'frame');
        else if (selectedImageId) duplicateItem(selectedImageId, 'image');
      }

      // Layering
      if (e.key === "]") {
        if (selectedFrameId) bringToFront(selectedFrameId, 'frame');
        else if (selectedImageId) bringToFront(selectedImageId, 'image');
      }
      if (e.key === "[") {
        if (selectedFrameId) sendToBack(selectedFrameId, 'frame');
        else if (selectedImageId) sendToBack(selectedImageId, 'image');
      }

      // New Items
      if (isMod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        const newFrame = {
          id: generateObjectId(),
          title: "New Frame",
          htmlContent: '<div class="p-4">New Frame Content</div>',
          initialPosition: { x: 400, y: 400 }
        };
        addFrame(newFrame, true);
        setSelectedFrameId(newFrame.id);
        toast.success("New frame added");
      }

      if (isMod && e.key.toLowerCase() === "i") {
        e.preventDefault();
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo, redo, deleteFrame, removeCanvasImage, 
    selectedFrameId, selectedImageId, 
    copyItem, pasteItem, duplicateItem, 
    bringToFront, sendToBack, 
    frames, canvasImages, copiedItem,
    addFrame, addCanvasImage, setSelectedFrameId, setSelectedImageId
  ]);

  // Handle messages from frames (existing logic)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "ELEMENT_SELECTED") {
        setSelectedElement(event.data.properties);
        setActiveEditFrameId(event.data.frameId);
      }
      if (event.data.type === "ELEMENT_DESELECTED") {
        setSelectedElement(null);
        setActiveEditFrameId(null);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleUpdateElement = (updates: { classes?: string[]; text?: string }) => {
    if (!activeEditFrameId) return;
    
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
       iframe.contentWindow?.postMessage({
         type: 'UPDATE_ELEMENT',
         ...updates
       }, '*');
    });
  };

  const handleDeleteElement = () => {
    if (!activeEditFrameId) return;
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
       iframe.contentWindow?.postMessage({
         type: 'DELETE_ELEMENT'
       }, '*');
    });
  };

  const saveThumbnailToProject = useCallback(
    async (projectId: string | null) => {
      try {
        if (!projectId) return null;
        const result = getCanvasHtmlContent();
        if (!result?.html) return null;
        setSelectedFrameId(null);
        setSelectedImageId(null);
        setIsSaving(true);
        const response = await axios.post("/api/screenshot", {
          html: result.html,
          width: result.element.scrollWidth,
          height: 700,
          projectId,
        });
        if (response.data) {
          console.log("Thumbnail saved", response.data);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsSaving(false);
      }
    },
    [setSelectedFrameId, setSelectedImageId]
  );

  useEffect(() => {
    if (!projectId) return;
    if (loadingStatus === "completed") {
      saveThumbnailToProject(projectId);
    }
  }, [loadingStatus, projectId, saveThumbnailToProject]);

  const onOpenHtmlDialog = () => {
    setOpenHtmlDialog(true);
  };

  function getCanvasHtmlContent() {
    const el = canvasRootRef.current;
    if (!el) {
      toast.error("Canvas element not found");
      return null;
    }
    let styles = "";
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) styles += rule.cssText;
      } catch {}
    }

    return {
      element: el,
      html: `
         <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>body{margin:0}*{box-sizing:border-box}${styles}</style>
          </head>
          <body>${el.outerHTML}</body>
          </html>
      `,
    };
  }

  const handleCanvasScreenshot = useCallback(async () => {
    try {
      const result = getCanvasHtmlContent();
      if (!result?.html) {
        toast.error("Failed to get canvas content");
        return null;
      }
      console.log("Starting canvas screenshot...");
      setSelectedFrameId(null);
      setIsScreenshotting(true);

      const response = await axios.post(
        "/api/screenshot",
        {
          html: result.html,
          width: result.element.scrollWidth,
          height: 700,
        },
        {
          responseType: "blob",
          timeout: 60000, // 60s timeout
          validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
        }
      );
      
      console.log("Screenshot response received", response.status);
      const title = projectName || "Canvas";
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.png`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Screenshot downloaded successfully");
    } catch (error: any) {
      console.error("Canvas screenshot failed:", error);
      
      // If the error response is a blob, we need to read it to see the error message
      if (error.response?.data instanceof Blob && error.response.data.type === "application/json") {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            toast.error(`Screenshot failed: ${errorData.details || errorData.error}`);
          } catch {
            toast.error("Failed to capture screenshot");
          }
        };
        reader.readAsText(error.response.data);
      } else {
        toast.error(error.message || "Failed to screenshot canvas");
      }
    } finally {
      setIsScreenshotting(false);
    }
  }, [projectName, setSelectedFrameId]);

  const currentStatus = isSaving
    ? "finalizing"
    : isPending && (loadingStatus === null || loadingStatus === "idle")
    ? "fetching"
    : loadingStatus !== "idle" && loadingStatus !== "completed"
    ? loadingStatus
    : null;

  return (
    <>
      <div className="relative w-full h-full overflow-hidden flex flex-col md:flex-row text-foreground">
        <CanvasFloatingToolbar
          projectId={projectId}
          projectName={projectName}
          isScreenshotting={isScreenshotting}
          onScreenshot={handleCanvasScreenshot}
        />

        {currentStatus && <CanvasLoader status={currentStatus} />}

        <div className="flex-1 relative overflow-hidden">
          <TransformWrapper
            initialScale={0.53}
            initialPositionX={40}
            initialPositionY={5}
            minScale={0.1}
            maxScale={3}
            wheel={{ step: 0.1 }}
            pinch={{ step: 0.1 }}
            doubleClick={{ disabled: true }}
            centerZoomedOut={false}
            centerOnInit={false}
            smooth={true}
            limitToBounds={false}
            panning={{
              disabled: toolMode !== TOOL_MODE_ENUM.HAND,
            }}
            onTransformed={(ref) => {
              setZoomPercent(Math.round(ref.state.scale * 100));
              setCurrentScale(ref.state.scale);
              setTransformState({
                scale: ref.state.scale,
                positionX: ref.state.positionX,
                positionY: ref.state.positionY
              });
            }}
          >
            {({ zoomIn, zoomOut }) => (
              <CanvasContextMenu>
                <div className="w-full h-full">
                <div
                  ref={canvasRootRef}
                  className={cn(
                    `absolute inset-0 w-full h-full 
                    bg-[#eee] dark:bg-[#000] p-3
                    bg-[radial-gradient(circle,_rgba(0,0,0,0.15)_1px,_transparent_1px)]
                    dark:bg-[radial-gradient(circle,_rgba(255,255,255,0.15)_1px,_transparent_1px)]
                    `,
                    toolMode === TOOL_MODE_ENUM.HAND
                      ? "cursor-grab active:cursor-grabbing"
                      : "cursor-default"
                  )}
                  style={{
                    backgroundSize: "20px 20px",
                  }}
                  onClick={() => setSelectedFrameId(null)}
                >
                  <TransformComponent
                    wrapperStyle={{
                      width: "100%",
                      height: "100%",
                      overflow: "unset",
                    }}
                    contentStyle={{
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <div className="relative min-w-max min-h-max p-[100px]">
                      {frames?.map((frame, index: number) => {
                        return (
                          <DeviceFrame
                            key={frame.id}
                            frameId={frame.id}
                            projectId={projectId}
                            title={frame.title}
                            html={frame.htmlContent}
                            isLoading={frame.isLoading}
                            scale={currentScale}
                            initialPosition={{
                              x: 100 + (index * 480),
                              y: 100,
                            }}
                            toolMode={toolMode}
                            theme_style={theme?.style}
                            onOpenHtmlDialog={onOpenHtmlDialog}
                          />
                        );
                      })}

                      {canvasImages?.map((image) => (
                        <Rnd
                          key={image.id}
                          size={{ width: image.width, height: image.height }}
                          position={{ x: image.x, y: image.y }}
                          onDragStop={(e, d) => {
                            updateCanvasImage(image.id, { x: d.x, y: d.y });
                          }}
                          onResizeStop={(e, direction, ref, delta, position) => {
                            updateCanvasImage(image.id, {
                              width: parseInt(ref.style.width),
                              height: parseInt(ref.style.height),
                              ...position,
                            });
                          }}
                          scale={currentScale}
                          disableDragging={toolMode === TOOL_MODE_ENUM.HAND}
                          className="group/image z-20"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setSelectedFrameId(null);
                          }}
                        >
                          <div className="relative w-full h-full">
                            <img
                              src={image.url}
                              alt="canvas-item"
                              className="w-full h-full object-contain pointer-events-none rounded-lg shadow-lg border-2 border-transparent group-hover/image:border-primary/50 transition-all"
                            />
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                e.preventDefault();
                                removeCanvasImage(image.id);
                              }}
                              className="absolute -top-3 -right-3 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity shadow-lg cursor-pointer z-30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                              title="Delete Image"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </Rnd>
                      ))}
                    </div>
                  </TransformComponent>
                </div>

                <CanvasControls
                  zoomIn={zoomIn}
                  zoomOut={zoomOut}
                  zoomPercent={zoomPercent}
                  toolMode={toolMode}
                  setToolMode={setToolMode}
                />
                </div>
              </CanvasContextMenu>
            )}
          </TransformWrapper>
        </div>

        {selectedElement && (
           <PropertiesPanel 
             selectedElement={selectedElement}
             onUpdate={handleUpdateElement}
             onDelete={handleDeleteElement}
             onClose={() => setSelectedElement(null)}
           />
        )}
      </div>

      <HtmlDialog
        html={selectedFrame?.htmlContent || ""}
        title={selectedFrame?.title}
        theme_style={theme?.style}
        open={openHtmlDialog}
        onOpenChange={setOpenHtmlDialog}
      />
    </>
  );
};

function CanvasLoader({
  status,
}: {
  status?: LoadingStatusType | "fetching" | "finalizing";
}) {
  return (
    <div
      className={cn(
        `absolute top-4 left-1/2 -translate-x-1/2 min-w-40
      max-w-full px-4 pt-1.5 pb-2
      rounded-br-xl rounded-bl-xl shadow-md
      flex items-center space-x-2 z-20
    `,
        status === "fetching" && "bg-gray-500 text-white",
        status === "running" && "bg-amber-500 text-white",
        status === "analyzing" && "bg-blue-500 text-white",
        status === "critiquing" && "bg-indigo-500 text-white",
        status === "fixing" && "bg-emerald-500 text-white",
        status === "generating" && "bg-purple-500 text-white",
        status === "finalizing" && "bg-purple-500 text-white"
      )}
    >
      <Spinner className="w-4 h-4 stroke-3!" />
      <span className="text-sm font-semibold capitalize">
        {status === "fetching" ? "Loading Project" : status}
      </span>
    </div>
  );
}

export default Canvas;
