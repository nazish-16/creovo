"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetProjects, useUpdateProject } from "@/features/use-project";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { cn } from "@/lib/utils";
import { ProjectType } from "@/types/project";
import { PlusIcon, LayoutIcon, X, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";

interface SortableTabProps {
  project: ProjectType;
  isActive: boolean;
  editingId: string | null;
  editName: string;
  setEditName: (name: string) => void;
  setEditingId: (id: string | null) => void;
  handleEditSubmit: (project: ProjectType) => void;
  handleKeyDown: (e: React.KeyboardEvent, project: ProjectType) => void;
  onClick: () => void;
}

const SortableTab = ({
  project,
  isActive,
  editingId,
  editName,
  setEditName,
  setEditingId,
  handleEditSubmit,
  handleKeyDown,
  onClick,
}: SortableTabProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editingId === project.id && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId, project.id]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // if interacting with input, don't trigger click
        if (editingId === project.id) return;
        onClick();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditName(project.name);
        setEditingId(project.id);
      }}
      title="Double-click to rename"
      className={cn(
        "group relative flex items-center gap-2 h-8 px-3 cursor-pointer transition-colors duration-200 border shrink-0 max-w-[180px]",
        isActive
          ? "bg-accent text-accent-foreground border-accent-foreground/10 font-semibold shadow-sm"
          : "bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground border-transparent",
        isDragging && "shadow-md bg-accent/80 border-accent-foreground/20 scale-105",
        editingId === project.id ? "cursor-text" : "cursor-grab active:cursor-grabbing"
      )}
    >
      {isDragging ? (
        <GripHorizontal
          className={cn(
            "size-3.5 shrink-0 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
        />
      ) : (
        <LayoutIcon
          className={cn(
            "size-3.5 shrink-0 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"
          )}
        />
      )}
      {editingId === project.id ? (
        <input
          ref={inputRef}
          type="text"
          className="text-xs truncate font-medium bg-transparent border-b border-primary/50 outline-none w-20 px-0 h-4"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={() => handleEditSubmit(project)}
          onKeyDown={(e) => handleKeyDown(e, project)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-xs truncate font-medium">
          {project.name}
        </span>
      )}
    </div>
  );
};

const ProjectTabs = ({ projectName }: { projectName?: string }) => {
  const router = useRouter();
  const params = useParams();
  const currentProjectId = params.id as string;
  const { user } = useKindeBrowserClient();

  const { data: projectsData, isLoading } = useGetProjects(user?.id);

  const updateMutation = useUpdateProject();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");

  const [orderedIds, setOrderedIds] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    const saved = localStorage.getItem("creovo_project_tabs_order");
    if (saved) {
      try {
        setOrderedIds(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (isLoading || !projectsData) return null;

  const projects = [...projectsData];
  const currentProjectInList = projects.find(p => p.id === currentProjectId);

  const handleEditSubmit = (project: ProjectType) => {
    if (editName.trim() && editName !== project.name) {
      updateMutation.mutate({ id: project.id, name: editName.trim() });
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, project: ProjectType) => {
    if (e.key === "Enter") {
      handleEditSubmit(project);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  if (!currentProjectInList && currentProjectId && projectName) {
    projects.unshift({
        id: currentProjectId,
        name: projectName,
    } as ProjectType);
  }

  if (projects.length === 0) return null;

  const getOrderedProjects = () => {
    if (orderedIds.length === 0) return projects;
    const copy = [...projects];
    copy.sort((a, b) => {
      const indexA = orderedIds.indexOf(a.id);
      const indexB = orderedIds.indexOf(b.id);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    return copy;
  };

  const displayProjects = getOrderedProjects();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
        const currentOrderedIds = displayProjects.map(p => p.id);
        const oldIndex = currentOrderedIds.indexOf(active.id as string);
        const newIndex = currentOrderedIds.indexOf(over.id as string);

        const newOrder = arrayMove(currentOrderedIds, oldIndex, newIndex);
        setOrderedIds(newOrder);
        localStorage.setItem("creovo_project_tabs_order", JSON.stringify(newOrder));
    }
  };

  return (
    <div className="flex-1 flex items-center min-w-0 px-2 overflow-hidden select-none mr-2">
      <ScrollArea className="w-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-center gap-1.5 h-10 py-1">
            <SortableContext
              items={displayProjects.map(p => p.id)}
              strategy={horizontalListSortingStrategy}
            >
              {displayProjects.map((project: ProjectType) => {
                const isActive = project.id === currentProjectId;
                return (
                  <SortableTab
                    key={project.id}
                    project={project}
                    isActive={isActive}
                    editingId={editingId}
                    editName={editName}
                    setEditName={setEditName}
                    setEditingId={setEditingId}
                    handleEditSubmit={handleEditSubmit}
                    handleKeyDown={handleKeyDown}
                    onClick={() => {
                      if (editingId !== project.id) {
                        router.push(`/project/${project.id}`);
                      }
                    }}
                  />
                );
              })}
            </SortableContext>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 ml-1 border border-dashed border-border/60 z-10 relative"
              onClick={() => router.push("/")}
              title="Create New Project"
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>
        </DndContext>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </div>
  );
};

export default ProjectTabs;
