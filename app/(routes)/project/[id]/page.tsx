"use client";

import { useGetProjectById } from "@/features/use-project-id";
import { useParams } from "next/navigation";
import Header from "./_common/header";
import Canvas from "@/components/canvas";
import { CanvasProvider } from "@/context/canvas-context";

const Page = () => {
  const params = useParams();
  const id = params.id as string;

  const { data: project, isPending } = useGetProjectById(id);
  
  const frames = project?.frames || [];
  const hasInitialData = frames.length > 0;

  if (!isPending && !project) {
    return <div>Project not found</div>;
  }

  return (
    <CanvasProvider
      initialFrames={frames}
      initialThemeId={project?.theme}
      initialDesignSystemLocked={project?.designSystemLocked}
      hasInitialData={hasInitialData}
      projectId={project?.id || null}
    >
      <div
        className="relative h-screen w-full
    flex flex-col
   "
      >
        <Header projectName={project?.name} />

        <div className="flex flex-1 overflow-hidden">
          <div className="relative flex-1">
            <Canvas
              projectId={project?.id}
              projectName={project?.name}
              isPending={isPending}
            />
          </div>
        </div>
      </div>
    </CanvasProvider>
  );
};

export default Page;
