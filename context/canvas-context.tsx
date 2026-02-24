import { useInngestSubscription } from "@inngest/realtime/hooks";
import { fetchRealtimeSubscriptionToken } from "@/app/action/realtime";
import { THEME_LIST, ThemeType } from "@/lib/themes";
import { FrameType, ConnectionType, CanvasImageType } from "@/types/project";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type LoadingStatusType =
  | "idle"
  | "running"
  | "analyzing"
  | "generating"
  | "critiquing"
  | "refactoring"
  | "fixing"
  | "completed";

interface CanvasContextType {
  theme?: ThemeType;
  setTheme: (id: string) => void;
  themes: ThemeType[];

  frames: FrameType[];
  setFrames: React.Dispatch<React.SetStateAction<FrameType[]>>;
  updateFrame: (id: string, data: Partial<FrameType>) => void;
  addFrame: (frame: FrameType) => void;

  selectedFrameId: string | null;
  selectedFrame: FrameType | null;
  setSelectedFrameId: (id: string | null) => void;

  loadingStatus: LoadingStatusType | null;
  setLoadingStatus: (status: LoadingStatusType | null) => void;


  framePositions: Record<string, { x: number; y: number }>;
  updateFramePosition: (id: string, x: number, y: number) => void;

  critiqueResults: Record<string, { critique: string[]; actionableFixes: string }>;
  setCritiqueResult: (frameId: string, result: { critique: string[]; actionableFixes: string } | null) => void;

  designSystemLocked: boolean;
  setDesignSystemLocked: (locked: boolean) => void;

  canvasImages: CanvasImageType[];
  addCanvasImage: (image: CanvasImageType) => void;
  updateCanvasImage: (id: string, data: Partial<CanvasImageType>) => void;
  removeCanvasImage: (id: string) => void;
  selectedImageId: string | null;
  setSelectedImageId: (id: string | null) => void;
  copyItem: (type: 'frame' | 'image', data: any) => void;
  pasteItem: (x: number, y: number) => void;
  copiedItem: { type: 'frame' | 'image', data: any } | null;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider = ({
  children,
  initialFrames,
  initialThemeId,
  initialDesignSystemLocked = false,
  hasInitialData,
  projectId,
}: {
  children: ReactNode;
  initialFrames: FrameType[];
  initialThemeId?: string;
  initialDesignSystemLocked?: boolean;
  hasInitialData: boolean;
  projectId: string | null;
}) => {
  const [themeId, setThemeId] = useState<string>(
    initialThemeId || THEME_LIST[0].id
  );

  const [frames, setFrames] = useState<FrameType[]>(initialFrames);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [designSystemLocked, setDesignSystemLocked] = useState<boolean>(initialDesignSystemLocked);

  const [framePositions, setFramePositions] = useState<Record<string, { x: number; y: number }>>({});

  const updateFramePosition = useCallback((id: string, x: number, y: number) => {
    setFramePositions(prev => ({ ...prev, [id]: { x, y } }));
  }, []);

  const [loadingStatus, setLoadingStatus] = useState<LoadingStatusType | null>(
    null
  );

  const [critiqueResults, setCritiqueResults] = useState<Record<string, { critique: string[]; actionableFixes: string }>>({});

  const setCritiqueResult = useCallback((frameId: string, result: { critique: string[]; actionableFixes: string } | null) => {
    setCritiqueResults(prev => {
      const next = { ...prev };
      if (result) next[frameId] = result;
      else delete next[frameId];
      return next;
    });
  }, []);

  // Canvas Images State
  const [canvasImages, setCanvasImages] = useState<CanvasImageType[]>([]);

  const addCanvasImage = useCallback((image: CanvasImageType) => {
    setCanvasImages(prev => [...prev, image]);
  }, []);

  const updateCanvasImage = useCallback((id: string, data: Partial<CanvasImageType>) => {
    setCanvasImages(prev => prev.map(img => img.id === id ? { ...img, ...data } : img));
  }, []);

  const removeCanvasImage = useCallback((id: string) => {
    setCanvasImages(prev => prev.filter(img => img.id !== id));
  }, []);

  // Copy/Paste State
  const [copiedItem, setCopiedItem] = useState<{ type: 'frame' | 'image', data: any } | null>(null);

  const copyItem = useCallback((type: 'frame' | 'image', data: any) => {
    setCopiedItem({ type, data });
  }, []);

  const pasteItem = useCallback((x: number, y: number) => {
    if (!copiedItem) return;

    if (copiedItem.type === 'frame') {
      const newFrame = {
        ...copiedItem.data,
        id: crypto.randomUUID(),
        initialPosition: { x, y }
      };
      setFrames(prev => [...prev, newFrame]);
    } else if (copiedItem.type === 'image') {
      const newImage = {
        ...copiedItem.data,
        id: crypto.randomUUID(),
        x,
        y
      };
      setCanvasImages(prev => [...prev, newImage]);
    }
  }, [copiedItem]);

  const [prevProjectId, setPrevProjectId] = useState(projectId);
  if (projectId !== prevProjectId) {
    setPrevProjectId(projectId);
    setLoadingStatus(hasInitialData ? "idle" : "running");
    setFrames(initialFrames);
    setFramePositions({});
    setThemeId(initialThemeId || THEME_LIST[0].id);
    setDesignSystemLocked(initialDesignSystemLocked);
    setSelectedFrameId(null);
    setSelectedImageId(null);
    setCritiqueResults({});
    setCanvasImages([]); // Reset images on project change
  }

  const theme = THEME_LIST.find((t) => t.id === themeId);
  const selectedFrame =
    selectedFrameId && frames.length !== 0
      ? frames.find((f) => f.id === selectedFrameId) || null
      : null;

  //Update the LoadingState Inngest Realtime event
  const { freshData } = useInngestSubscription({
    refreshToken: fetchRealtimeSubscriptionToken,
  });

  useEffect(() => {
    if (!freshData || freshData.length === 0) return;

    freshData.forEach((message: any) => {
      const { data, topic } = message;

      if (data.projectId !== projectId) return;

      switch (topic as string) {
        case "generation.start":
          const status = data.status;
          setLoadingStatus(status);
          break;
        case "analysis.start":
          setLoadingStatus("analyzing");
          break;
        case "critique.start":
          setLoadingStatus("critiquing");
          break;
        case "critique.complete":
          setLoadingStatus("idle");
          if (data.frameId && data.critique) {
            setCritiqueResult(data.frameId, {
              critique: data.critique,
              actionableFixes: data.actionableFixes
            });
          }
          break;
        case "analysis.complete":
          setLoadingStatus("generating");
          if (data.theme) setThemeId(data.theme);

          if (data.screens && data.screens.length > 0) {
            const skeletonFrames: FrameType[] = data.screens.map((s: any) => ({
              id: s.id,
              title: s.name,
              htmlContent: "",
              isLoading: true,
            }));
            setFrames((prev) => [...prev, ...skeletonFrames]);
          }
          break;
        case "frame.created":
          if (data.frame) {
            setFrames((prev) => {
              const newFrames = [...prev];
              const idx = newFrames.findIndex((f) => f.id === data.screenId);
              if (idx !== -1) newFrames[idx] = data.frame;
              else newFrames.push(data.frame);
              return newFrames;
            });
          }
          break;
        case "generation.complete":
          setLoadingStatus("completed");
          setTimeout(() => {
            setLoadingStatus("idle");
          }, 100);
          break;
        default:
          break;
      }
    });
  }, [projectId, freshData, setCritiqueResult]);

  const addFrame = useCallback((frame: FrameType) => {
    setFrames((prev) => [...prev, frame]);
  }, []);

  const updateFrame = useCallback((id: string, data: Partial<FrameType>) => {
    setFrames((prev) => {
      return prev.map((frame) =>
        frame.id === id ? { ...frame, ...data } : frame
      );
    });
  }, []);


  return (
    <CanvasContext.Provider
      value={{
        theme,
        setTheme: setThemeId,
        themes: THEME_LIST,
        frames,
        setFrames,
        selectedFrameId,
        selectedFrame,
        setSelectedFrameId,
        updateFrame,
        addFrame,
        loadingStatus,
        setLoadingStatus,
        framePositions,
        updateFramePosition,
        critiqueResults,
        setCritiqueResult,
        designSystemLocked,
        setDesignSystemLocked,
        canvasImages,
        addCanvasImage,
        updateCanvasImage,
        removeCanvasImage,
        selectedImageId,
        setSelectedImageId,
        copyItem,
        pasteItem,
        copiedItem,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("useCanvas must be used inside CanvasProvider");
  return ctx;
};
