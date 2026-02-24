/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import axios from "axios";
import { TOOL_MODE_ENUM, ToolModeType } from "@/constant/canvas";
import { useCanvas } from "@/context/canvas-context";
import { getHTMLWrapper } from "@/lib/frame-wrapper";
import { cn } from "@/lib/utils";
import DeviceFrameToolbar from "./device-frame-toolbar";
import { toast } from "sonner";
import DeviceFrameSkeleton from "./device-frame-skeleton";
import { useRegenerateFrame, useDeleteFrame, useUpdateFrame, useAnalyzeDesign, useRefactorUX, useApplyCritiqueFix } from "@/features/use-frame";
import { FrameType } from "@/types/project";

import { DEVICE_PRESETS, DevicePresetType } from "@/constant/devices";
import { CheckCircle2, Sparkles, X } from "lucide-react";
import { Button } from "../ui/button";

type PropsType = {
  html: string;
  title?: string;
  width?: number;
  minHeight?: number | string;
  initialPosition?: { x: number; y: number };
  frameId: string;
  scale?: number;
  toolMode: ToolModeType;
  theme_style?: string;
  isLoading?: boolean;
  projectId: string;
  onOpenHtmlDialog: () => void;
};

const DeviceFrame = ({
  html,
  title = "Untitled",
  width = 420,
  minHeight = 800,
  initialPosition = { x: 0, y: 0 },
  frameId,
  scale = 1,
  toolMode,
  theme_style,
  isLoading = false,
  projectId,
  onOpenHtmlDialog,
}: PropsType) => {
  const { 
    selectedFrameId, 
    setSelectedFrameId, 
    updateFrame, 
    setFrames,
    critiqueResults, 
    setCritiqueResult,
    updateFramePosition
  } = useCanvas();
  const [devicePreset, setDevicePreset] = useState<DevicePresetType>("iphone-15-pro");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);

  const activePreset = DEVICE_PRESETS[devicePreset];
  const [frameSize, setFrameSize] = useState({
    width: activePreset.width,
    height: activePreset.height,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const regenerateMutation = useRegenerateFrame(projectId);
  const deleteMutation = useDeleteFrame(projectId);
  const updateFrameMutation = useUpdateFrame(projectId);
  const analyzeMutation = useAnalyzeDesign(projectId);
  const refactorMutation = useRefactorUX(projectId);
  const applyFixMutation = useApplyCritiqueFix(projectId);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isSelected = selectedFrameId === frameId;
  const fullHtml = getHTMLWrapper(html, title, theme_style, frameId, isEditMode);

  const critique = critiqueResults[frameId];

  // Initialize position on mount
  useEffect(() => {
    updateFramePosition(frameId, initialPosition.x, initialPosition.y);
  }, [frameId, initialPosition.x, initialPosition.y, updateFramePosition]);

  useEffect(() => {
    setFrameSize({
      width: activePreset.width,
      height: activePreset.height,
    });
  }, [activePreset]);

  const lastSavedHtmlRef = useRef<string>(html);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.frameId !== frameId) return;

      if (event.data.type === "FRAME_HEIGHT" && !activePreset.height) {
        setFrameSize((prev) => ({
          ...prev,
          height: event.data.height,
        }));
      }

      if (event.data.type === "ELEMENT_SELECTED") {
        setSelectedElement(event.data.properties);
      }

      if (event.data.type === "HTML_CONTENT_AUTO_SAVE") {
        const newHtml = event.data.html;
        
        // Skip if content hasn't changed from what we last saved
        if (newHtml === lastSavedHtmlRef.current) return;

        // Debounce the save to the database
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        
        autoSaveTimeoutRef.current = setTimeout(() => {
          lastSavedHtmlRef.current = newHtml;
          updateFrameMutation.mutate({
            frameId,
            htmlContent: newHtml,
            isSilent: true,
          }, {
            onSuccess: () => {
              updateFrame(frameId, { htmlContent: newHtml });
            }
          });
        }, 1000); // 1 second debounce
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [frameId, activePreset.height, updateFrameMutation, updateFrame]);

  const handleSaveDesign = useCallback(() => {
    if (!iframeRef.current) return;
    
    iframeRef.current.contentWindow?.postMessage({ type: 'GET_HTML_CONTENT' }, '*');
    
    // Listen for the response once
    const handleHtmlResponse = (event: MessageEvent) => {
      if (event.data.type === 'HTML_CONTENT_RESPONSE' && event.data.frameId === frameId) {
        const newHtml = event.data.html;
        updateFrameMutation.mutate({
          frameId,
          htmlContent: newHtml
        }, {
          onSuccess: () => {
            updateFrame(frameId, { htmlContent: newHtml });
          }
        });
        window.removeEventListener('message', handleHtmlResponse);
      }
    };
    window.addEventListener('message', handleHtmlResponse);
  }, [frameId, updateFrameMutation, updateFrame]);

  const handleDownloadPng = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await axios.post(
        "/api/screenshot",
        {
          html: fullHtml,
          width: frameSize.width,
          height: frameSize.height,
        },
        {
          responseType: "blob",
          validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
        }
      );
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}
      -${Date.now()}.png`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("Screenshot downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to screenshot");
    } finally {
      setIsDownloading(false);
    }
  }, [frameSize.height, frameSize.width, fullHtml, isDownloading, title]);

  const handleRegenerate = useCallback(
    (prompt: string) => {
      regenerateMutation.mutate(
        { frameId, prompt },
        {
          onSuccess: () => {
            updateFrame(frameId, { isLoading: true });
          },
          onError: () => {
            updateFrame(frameId, { isLoading: false });
          },
        }
      );
    },
    [frameId, regenerateMutation, updateFrame]
  );

  const handleDeleteFrame = useCallback(() => {
    deleteMutation.mutate(frameId, {
      onSuccess: () => {
        setFrames((prev: FrameType[]) => prev.filter((f: FrameType) => f.id !== frameId));
        setSelectedFrameId(null);
      },
    });
  }, [frameId, deleteMutation, setFrames, setSelectedFrameId]);

  const handleApplyFix = () => {
    if (!critique) return;
    applyFixMutation.mutate({
      frameId,
      actionableFixes: critique.actionableFixes
    }, {
      onSuccess: () => {
        setCritiqueResult(frameId, null);
        updateFrame(frameId, { isLoading: true });
      }
    });
  };

  const handleImageUpload = (url: string) => {
    if (!iframeRef.current) return;
    iframeRef.current.contentWindow?.postMessage({
      type: "INSERT_IMAGE",
      url,
      frameId,
    }, "*");
  };

  return (
    <Rnd
      default={{
        x: initialPosition.x,
        y: initialPosition.y,
        width: activePreset.width,
        height: frameSize.height,
      }}
      size={{
        width: frameSize.width,
        height: frameSize.height,
      }}
      onDrag={(e, d) => {
        updateFramePosition(frameId, d.x, d.y);
      }}
      onDragStop={(e, d) => {
        updateFramePosition(frameId, d.x, d.y);
      }}
      disableDragging={toolMode === TOOL_MODE_ENUM.HAND}
      enableResizing={false}
      scale={scale}
      onClick={(e: any) => {
        e.stopPropagation();
        if (toolMode === TOOL_MODE_ENUM.SELECT) {
          setSelectedFrameId(frameId);
        }
      }}
      className={cn(
        "relative z-10",
        isSelected &&
          toolMode !== TOOL_MODE_ENUM.HAND &&
          "ring-2 ring-blue-500 ring-offset-4 rounded-[42px]",
        toolMode === TOOL_MODE_ENUM.HAND
          ? "cursor-grab! active:cursor-grabbing!"
          : "cursor-move"
      )}
    >
      <div className="w-full h-full flex flex-col items-center group/frame">
        <DeviceFrameToolbar
          title={title}
          isSelected={isSelected}
          disabled={isLoading || regenerateMutation.isPending || applyFixMutation.isPending}
          scale={scale}
          isDownloading={isDownloading}
          isRegenerating={regenerateMutation.isPending}
          isDeleting={deleteMutation.isPending}
          onOpenHtmlDialog={onOpenHtmlDialog}
          onDownloadPng={handleDownloadPng}
          onRegenerate={handleRegenerate}
          onDeleteFrame={handleDeleteFrame}
          devicePreset={devicePreset}
          onDevicePresetChange={setDevicePreset}
          isEditMode={isEditMode}
          onEditModeToggle={() => setIsEditMode(!isEditMode)}
          onSave={handleSaveDesign}
          isSaving={updateFrameMutation.isPending}
          onAnalyze={() => analyzeMutation.mutate(frameId)}
          onRefactor={() => refactorMutation.mutate(frameId)}
          isAnalyzing={analyzeMutation.isPending}
          isRefactoring={refactorMutation.isPending}
          onImageUpload={handleImageUpload}
        />

        <div
          className={cn(
            "relative w-full h-full bg-black overflow-hidden shadow-2xl transition-all duration-300",
            "border-[8px] border-gray-900"
          )}
          style={{
            borderRadius: `${activePreset.radius}px`,
          }}
        >
          {/* Critique Panel Overlay */}
          {critique && isSelected && (
            <div className="absolute inset-x-0 bottom-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md z-50 animate-in slide-in-from-bottom duration-300 border-t border-border p-5 pb-8 rounded-t-[32px] shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-sm tracking-tight">Design Critique</h3>
                </div>
                <button 
                  onClick={() => setCritiqueResult(frameId, null)}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              </div>
              
              <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto no-scrollbar">
                {critique.critique.map((item: string, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">{item}</p>
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleApplyFix}
                disabled={applyFixMutation.isPending}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                {applyFixMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="size-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                    <span>Applying Fixes...</span>
                  </div>
                ) : (
                  "Apply Recommended Fixes"
                )}
              </Button>
            </div>
          )}
          {activePreset && 'notch' in activePreset && activePreset.notch && (
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 bg-black z-50 flex items-center justify-center pointer-events-none"
              style={{
                width: `${activePreset.notch.width}px`,
                height: `${activePreset.notch.height}px`,
                marginTop: `${activePreset.notch.top}px`,
                borderRadius: `${activePreset.notch.radius}px`,
              }}
            >
              <div className="size-2 rounded-full bg-gray-800/50 ml-auto mr-4" />
            </div>
          )}

          <div className={cn(
            "relative w-full h-full bg-white dark:bg-background no-scrollbar",
            isLoading ? "overflow-hidden" : "overflow-y-auto"
          )}>
            {isEditMode && (
              <div 
                className="absolute inset-0 pointer-events-none z-40 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #3b82f6 1px, transparent 1px),
                    linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
                  `,
                  backgroundSize: '8px 8px'
                }}
              />
            )}
            
            {isLoading ? (
              <DeviceFrameSkeleton
                style={{
                  position: "relative",
                  width: frameSize.width,
                  height: frameSize.height,
                }}
              />
            ) : (
              <iframe
                ref={iframeRef}
                srcDoc={fullHtml}
                title={title}
                sandbox="allow-scripts allow-same-origin"
                className={cn(
                  "w-full h-full border-none block bg-transparent",
                  isEditMode ? "pointer-events-auto" : "pointer-events-none"
                )}
              />
            )}
          </div>
        </div>
      </div>
    </Rnd>
  );
};

export default DeviceFrame;
