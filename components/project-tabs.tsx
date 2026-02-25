"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useGetProjects } from "@/features/use-project";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { cn } from "@/lib/utils";
import { ProjectType } from "@/types/project";
import { PlusIcon, LayoutIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const ProjectTabs = ({ projectName }: { projectName?: string }) => {
  const router = useRouter();
  const params = useParams();
  const currentProjectId = params.id as string;
  const { user } = useKindeBrowserClient();

  const { data: projectsData, isLoading } = useGetProjects(user?.id);

  if (isLoading || !projectsData) return null;

  const projects = [...projectsData];
  const currentProjectInList = projects.find(p => p.id === currentProjectId);
  
  if (!currentProjectInList && currentProjectId && projectName) {
    projects.unshift({
        id: currentProjectId,
        name: projectName,
    } as ProjectType);
  }

  if (projects.length === 0) return null;

  return (
    <div className="flex-1 flex items-center min-w-0 px-2 overflow-hidden select-none mr-2">
      <ScrollArea className="w-full">
        <div className="flex items-center gap-1.5 h-10 py-1">
          {projects.map((project: ProjectType, index: number) => {
            const isActive = project.id === currentProjectId;
            return (
              <React.Fragment key={project.id}>
                <div
                  onClick={() => router.push(`/project/${project.id}`)}
                  className={cn(
                    "group relative flex items-center gap-2 h-8 px-3 cursor-pointer transition-all duration-300 border shrink-0 max-w-[180px]",
                    isActive 
                      ? "bg-accent text-accent-foreground border-accent-foreground/10 font-semibold shadow-sm" 
                      : "bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground border-transparent"
                  )}
                >
                  <LayoutIcon className={cn("size-3.5 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground")} />
                  <span className="text-xs truncate font-medium">
                    {project.name}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 ml-1 border border-dashed border-border/60"
            onClick={() => router.push("/")}
            title="Create New Project"
          >
            <PlusIcon className="size-3.5" />
          </Button>
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </div>
  );
};

export default ProjectTabs;
