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

export const generateObjectId = () => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return timestamp + random;
};

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
  setTheme: (id: string, pushToHistory?: boolean) => void;
  themes: ThemeType[];

  frames: FrameType[];
  setFrames: (frames: FrameType[] | ((prev: FrameType[]) => FrameType[]), pushToHistory?: boolean) => void;
  updateFrame: (id: string, data: Partial<FrameType>, pushToHistory?: boolean) => void;
  addFrame: (frame: FrameType, pushToHistory?: boolean) => void;
  deleteFrame: (id: string) => void;

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
  addCanvasImage: (image: CanvasImageType, pushToHistory?: boolean) => void;
  updateCanvasImage: (id: string, data: Partial<CanvasImageType>, pushToHistory?: boolean) => void;
  removeCanvasImage: (id: string) => void;
  selectedImageId: string | null;
  setSelectedImageId: (id: string | null) => void;

  // Actions
  copyItem: (type: 'frame' | 'image', data: any) => void;
  pasteItem: (x?: number, y?: number) => void;
  duplicateItem: (id: string, type: 'frame' | 'image') => void;
  bringToFront: (id: string, type: 'frame' | 'image') => void;
  sendToBack: (id: string, type: 'frame' | 'image') => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

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
  const [themeId, setThemeIdState] = useState<string>(
    initialThemeId || THEME_LIST[0].id
  );

  const [frames, setFramesState] = useState<FrameType[]>(initialFrames || []);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [designSystemLocked, setDesignSystemLocked] = useState<boolean>(initialDesignSystemLocked);
  const [canvasImages, setCanvasImagesState] = useState<CanvasImageType[]>([]);

  // History state
  const [history, setHistory] = useState<{ frames: FrameType[], images: CanvasImageType[], themeId: string }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Helper to capture current state for history
  const captureState = useCallback(() => ({
    frames: JSON.parse(JSON.stringify(frames)),
    images: JSON.parse(JSON.stringify(canvasImages)),
    themeId
  }), [frames, canvasImages, themeId]);

  const pushToHistory = useCallback(() => {
    const newState = {
      frames: JSON.parse(JSON.stringify(frames)),
      images: JSON.parse(JSON.stringify(canvasImages)),
      themeId
    };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      if (newHistory.length > 50) {
        return newHistory.slice(1);
      }
      return newHistory;
    });
    setHistoryIndex(prev => {
      if (prev >= 49) return 49;
      return prev + 1;
    });
  }, [frames, canvasImages, themeId, historyIndex]);

  // Wrap setters to allow pushing to history
  const setFrames = useCallback((val: FrameType[] | ((prev: FrameType[]) => FrameType[]), push: boolean = false) => {
    if (push) pushToHistory();
    setFramesState(val);
  }, [pushToHistory]);

  const setCanvasImages = useCallback((val: CanvasImageType[] | ((prev: CanvasImageType[]) => CanvasImageType[]), push: boolean = false) => {
    if (push) pushToHistory();
    setCanvasImagesState(val);
  }, [pushToHistory]);

  const setTheme = useCallback((id: string, push: boolean = false) => {
    if (push) pushToHistory();
    setThemeIdState(id);
  }, [pushToHistory]);

  // Initialize history
  useEffect(() => {
    if (history.length === 0 && frames.length > 0) {
      setHistory([{
        frames: JSON.parse(JSON.stringify(frames)),
        images: [],
        themeId: initialThemeId || THEME_LIST[0].id
      }]);
      setHistoryIndex(0);
    }
  }, [initialFrames, initialThemeId]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setFramesState(JSON.parse(JSON.stringify(prevState.frames)));
      setCanvasImagesState(JSON.parse(JSON.stringify(prevState.images)));
      setThemeIdState(prevState.themeId);
      setHistoryIndex(prev => prev - 1);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setFramesState(JSON.parse(JSON.stringify(nextState.frames)));
      setCanvasImagesState(JSON.parse(JSON.stringify(nextState.images)));
      setThemeIdState(nextState.themeId);
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, history]);

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

  const addCanvasImage = useCallback((image: CanvasImageType, push: boolean = false) => {
    setCanvasImages(prev => [...prev, image], push);
  }, [setCanvasImages]);

  const updateCanvasImage = useCallback((id: string, data: Partial<CanvasImageType>, push: boolean = false) => {
    setCanvasImages(prev => prev.map(img => img.id === id ? { ...img, ...data } : img), push);
  }, [setCanvasImages]);

  const removeCanvasImage = useCallback((id: string) => {
    pushToHistory();
    setCanvasImagesState(prev => prev.filter(img => img.id !== id));
    if (selectedImageId === id) setSelectedImageId(null);
  }, [selectedImageId, pushToHistory]);

  const deleteFrame = useCallback((id: string) => {
    pushToHistory();
    setFramesState(prev => prev.filter(f => f.id !== id));
    if (selectedFrameId === id) setSelectedFrameId(null);
  }, [selectedFrameId, pushToHistory]);

  // Copy/Paste State
  const [copiedItem, setCopiedItem] = useState<{ type: 'frame' | 'image', data: any } | null>(null);

  const copyItem = useCallback((type: 'frame' | 'image', data: any) => {
    setCopiedItem({ type, data: JSON.parse(JSON.stringify(data)) });
  }, []);

  const pasteItem = useCallback((x?: number, y?: number) => {
    if (!copiedItem) return;

    pushToHistory();
    const pasteX = x ?? 400;
    const pasteY = y ?? 400;

    if (copiedItem.type === 'frame') {
      const newFrame = {
        ...copiedItem.data,
        id: generateObjectId(),
        initialPosition: { x: pasteX, y: pasteY }
      };
      setFramesState(prev => [...prev, newFrame]);
      setSelectedFrameId(newFrame.id);
    } else if (copiedItem.type === 'image') {
      const newImage = {
        ...copiedItem.data,
        id: generateObjectId(),
        x: pasteX,
        y: pasteY
      };
      setCanvasImagesState(prev => [...prev, newImage]);
      setSelectedImageId(newImage.id);
    }
  }, [copiedItem, pushToHistory]);

  const duplicateItem = useCallback((id: string, type: 'frame' | 'image') => {
    pushToHistory();
    if (type === 'frame') {
      const item = frames.find(f => f.id === id);
      if (item) {
        const newItem = { 
          ...item, 
          id: generateObjectId(),
          initialPosition: { 
            x: (framePositions[id]?.x ?? 0) + 20, 
            y: (framePositions[id]?.y ?? 0) + 20 
          }
        };
        setFramesState(prev => [...prev, newItem]);
        setSelectedFrameId(newItem.id);
      }
    } else {
      const item = canvasImages.find(i => i.id === id);
      if (item) {
        const newItem = { ...item, id: generateObjectId(), x: item.x + 20, y: item.y + 20 };
        setCanvasImagesState(prev => [...prev, newItem]);
        setSelectedImageId(newItem.id);
      }
    }
  }, [frames, canvasImages, framePositions, pushToHistory]);

  const bringToFront = useCallback((id: string, type: 'frame' | 'image') => {
    pushToHistory();
    if (type === 'frame') {
      setFramesState(prev => {
        const item = prev.find(f => f.id === id);
        if (!item) return prev;
        return [...prev.filter(f => f.id !== id), item];
      });
    } else {
      setCanvasImagesState(prev => {
        const item = prev.find(i => i.id === id);
        if (!item) return prev;
        return [...prev.filter(i => i.id !== id), item];
      });
    }
  }, [pushToHistory]);

  const sendToBack = useCallback((id: string, type: 'frame' | 'image') => {
    pushToHistory();
    if (type === 'frame') {
      setFramesState(prev => {
        const item = prev.find(f => f.id === id);
        if (!item) return prev;
        return [item, ...prev.filter(f => f.id !== id)];
      });
    } else {
      setCanvasImagesState(prev => {
        const item = prev.find(i => i.id === id);
        if (!item) return prev;
        return [item, ...prev.filter(i => i.id !== id)];
      });
    }
  }, [pushToHistory]);

  const [prevProjectId, setPrevProjectId] = useState(projectId);
  if (projectId !== prevProjectId) {
    setPrevProjectId(projectId);
    setLoadingStatus(hasInitialData ? "idle" : "running");
    setFramesState(initialFrames || []);
    setFramePositions({});
    setThemeIdState(initialThemeId || THEME_LIST[0].id);
    setDesignSystemLocked(initialDesignSystemLocked);
    setSelectedFrameId(null);
    setSelectedImageId(null);
    setCritiqueResults({});
    setCanvasImagesState([]); // Reset images on project change
    setHistory([]);
    setHistoryIndex(-1);
  }

  const theme = THEME_LIST.find((t) => t.id === themeId);
  const selectedFrame =
    selectedFrameId && (frames?.length ?? 0) !== 0
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
          if (data.theme) setTheme(data.theme);

          if (data.screens && data.screens.length > 0) {
            const skeletonFrames: FrameType[] = data.screens.map((s: any) => ({
              id: s.id,
              title: s.name,
              htmlContent: "",
              isLoading: true,
            }));
            setFramesState((prev) => [...prev, ...skeletonFrames]);
          }
          break;
        case "frame.created":
          if (data.frame) {
            setFramesState((prev) => {
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

  const addFrame = useCallback((frame: FrameType, push: boolean = false) => {
    setFrames(prev => [...prev, frame], push);
  }, [setFrames]);

  const updateFrame = useCallback((id: string, data: Partial<FrameType>, push: boolean = false) => {
    setFrames(prev => prev.map((frame) =>
        frame.id === id ? { ...frame, ...data } : frame
      ), push);
  }, [setFrames]);


  return (
    <CanvasContext.Provider
      value={{
        theme,
        setTheme,
        themes: THEME_LIST,
        frames,
        setFrames,
        selectedFrameId,
        selectedFrame,
        setSelectedFrameId,
        updateFrame,
        addFrame,
        deleteFrame,
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
        duplicateItem,
        bringToFront,
        sendToBack,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
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
