"use client";
import React, { memo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import PromptInput from "@/components/prompt-input";
import Header from "./header";
import { useCreateProject, useGetProjects, useDeleteProject } from "@/features/use-project";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Spinner } from "@/components/ui/spinner";
import { ProjectType } from "@/types/project";
import { useRouter } from "next/navigation";
import InteractiveBubbles from "@/components/bg/interactive-bubbles";
import { FolderOpenDotIcon, Trash2Icon, AlertCircleIcon, ArrowRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type DesignStyle = "minimal" | "neo-brutal" | "luxury" | "gen-z" | "saas";

export type LayoutComplexity = 0 | 1 | 2;
const COMPLEXITY_LABELS: Record<LayoutComplexity, string> = {
  0: "Simple",
  1: "Balanced",
  2: "Complex",
};

function buildEnhancedPrompt(
  prompt: string,
  style: DesignStyle,
  complexity: LayoutComplexity,
  aiEnhance: boolean
): string {
  const styleDescriptions: Record<DesignStyle, string> = {
    minimal: "Clean minimal design: generous whitespace, muted palette, refined typography, restrained use of color, no decorative elements, subtle borders.",
    "neo-brutal": "Neo-brutalist design: bold thick borders, high-contrast color blocks, hard shadows (no blur), strong geometric shapes, raw but intentional composition.",
    luxury: "Luxury design: muted gold or deep jewel tones, elegant serif headings, refined spacing, subtle gradients, premium photography-style imagery.",
    "gen-z": "Gen-Z design: vibrant accent colors, playful but structured layout, bold rounded typography, energetic feel, expressive card designs.",
    saas: "SaaS dashboard design: data-dense structured layout, disciplined grid, professional color system, clear information hierarchy, enterprise-grade components.",
  };

  const complexityDescriptions: Record<LayoutComplexity, string> = {
    0: "Keep the layout simple: fewer UI sections, focused content, minimal components, maximum breathing room.",
    1: "Balanced layout density: mix of content blocks and whitespace, moderate component usage.",
    2: "Complex layout: rich multi-section design, data-dense cards, layered information hierarchy, multiple chart types, advanced component usage.",
  };

  const additions = [
    `\nDesign Style: ${styleDescriptions[style]}`,
    `Layout Complexity: ${complexityDescriptions[complexity]}`,
  ];

  if (aiEnhance) {
    additions.push(
      "Enhance this prompt with richer UI detail: add specific screen titles, realistic data values, proper navigation structure, and professional component hierarchy. Make it investor-demo ready."
    );
  }

  return prompt + additions.join(" ");
}

// ─── Main Component ──────────────────────────────────────────────────
const LandingSection = () => {
  const { user } = useKindeBrowserClient();
  const [promptText, setPromptText] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [aiEnhance, setAiEnhance] = useState(true);
  const [designStyle, setDesignStyle] = useState<DesignStyle>("saas");
  const [complexity, setComplexity] = useState<LayoutComplexity>(1);
  const userId = user?.id;

  const { data: projects, isLoading, isError } = useGetProjects(userId);
  const { mutate, isPending } = useCreateProject();

  const suggestions = [
    {
      label: "Finance Tracker",
      icon: "💸",
      value: `Finance app statistics screen. Current balance at top with dollar amount, bar chart showing spending over months (Oct-Mar) with month selector pills below, transaction list with app icons, amounts, and categories. Bottom navigation bar. Mobile app, single screen.`,
    },
    {
      label: "Fitness Activity",
      icon: "🔥",
      value: `Fitness tracker summary screen. Large central circular progress ring showing steps and calories with neon glow. Line graph showing heart rate over time. Bottom section with grid of health metrics (Sleep, Water, SpO2). Mobile app, single screen.`,
    },
    {
      label: "Food Delivery",
      icon: "🍔",
      value: `Food delivery home feed. Top search bar with location pin. Horizontal scrolling hero carousel of daily deals. Vertical list of restaurants with large delicious food thumbnails, delivery time badges, and rating stars. Floating Action Button for cart. Mobile app, single screen.`,
    },
    {
      label: "Travel Booking",
      icon: "✈️",
      value: `Travel destination detail screen. Full-screen immersive photography of a tropical beach. Bottom sheet overlay with rounded top corners containing hotel title, star rating, price per night, and a large Book Now button. Horizontal scroll of amenity icons. Mobile app, single screen.`,
    },
    {
      label: "E-Commerce",
      icon: "👟",
      value: `Sneaker product page. Large high-quality product image on a light gray background. Color selector swatches, size selector grid, and a sticky Add to Cart button at the bottom. Title and price in bold, oversized typography. Mobile app, single screen.`,
    },
    {
      label: "Meditation",
      icon: "🧘",
      value: `Meditation player screen. Central focus is a soft, abstract breathing bubble animation. Play/Pause controls and a time slider below. Background is a soothing solid pastel sage green. Mobile app, single screen.`,
    },
  ];

  const handleSuggestionClick = (val: string) => {
    setPromptText(val);
  };

  const handleSubmit = () => {
    if (!promptText && images.length === 0) return;
    const finalPrompt = buildEnhancedPrompt(promptText, designStyle, complexity, aiEnhance);
    mutate({ prompt: finalPrompt, images });
  };

  return (
    <div className="w-full min-h-screen relative">
      <InteractiveBubbles />
      <div className="flex flex-col relative z-10">
        <Header />

        <div className="relative pt-24 pb-6 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto flex flex-col items-center justify-center gap-7">

            <div className="space-y-3 text-center">
              <h1 className="font-semibold text-[2.1rem] sm:text-5xl tracking-tight leading-tight">
                Design mobile apps{" "}
                <span className="text-primary">in minutes</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Describe your idea. Creovo generates production-quality mobile UI mockups instantly using Creovo.
              </p>
            </div>

            <div className="w-full flex flex-col gap-4">
                <PromptInput
                  className="ring-0! ring-border focus-within:ring-primary transition-all duration-200 border border-primary"
                  promptText={promptText}
                  setPromptText={setPromptText}
                  images={images}
                  setImages={setImages}
                  isLoading={isPending}
                  onSubmit={handleSubmit}
                  aiEnhance={aiEnhance}
                  onToggleAiEnhance={() => setAiEnhance((v) => !v)}
                />
              <div className="flex flex-wrap justify-center gap-1.5 px-1">
                <Suggestions>
                  {suggestions.map((s) => (
                    <Suggestion
                      key={s.label}
                      suggestion={s.label}
                      className="text-xs! h-7! px-3 pt-0.5! gap-1"
                      onClick={() => handleSuggestionClick(s.value)}
                    >
                      <span className="text-sm leading-none"><ArrowRight/></span>
                      <span>{s.label}</span>
                    </Suggestion>
                  ))}
                </Suggestions>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full py-10 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            {userId && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg tracking-tight">Recent Projects</h2>
                  {projects && projects.length > 0 && (
                    <span className="text-xs text-muted-foreground font-medium tabular-nums">
                      {projects.length} project{projects.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner className="size-7 text-primary" />
                  </div>
                ) : projects && projects.length === 0 ? (
                  <EmptyProjectsState />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {projects?.map((project: ProjectType) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {isError && (
              <p className="text-sm text-destructive mt-4">
                Failed to load projects. Please refresh.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyProjectsState = () => (
  <div className="flex flex-col items-center justify-center py-14 px-6 rounded-2xl border border-dashed border-border bg-muted/20 text-center">
    <h3 className="font-semibold text-base mb-1">No projects yet</h3>
    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
      Describe your app idea above and Creovo will generate mobile UI screens for you.
    </p>
  </div>
);

const ProjectCard = memo(({ project }: { project: ProjectType }) => {
  const router = useRouter();
  const deleteMutation = useDeleteProject();
  const createdAtDate = new Date(project.createdAt);
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });
  const thumbnail = project.thumbnail || null;

  const onRoute = () => {
    router.push(`/project/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const confirmDelete = () => {
    deleteMutation.mutate(project.id);
  };

  return (
    <div
      role="button"
      className="w-full flex flex-col border border-border rounded-xl cursor-pointer overflow-hidden bg-card group transition-all duration-200 hover:shadow-md hover:border-primary/20 relative"
      onClick={onRoute}
    >
      <div className="h-36 bg-muted relative overflow-hidden flex items-center justify-center">
        {thumbnail ? (
          <img
            src={thumbnail}
            className="w-full h-full object-cover object-left scale-110 transition-transform duration-300 group-hover:scale-105"
            alt={project.name}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <FolderOpenDotIcon className="size-5" />
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="absolute top-2 right-2 p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              title="Delete project"
            >
              {deleteMutation.isPending ? (
                <Spinner className="size-3" />
              ) : (
                <Trash2Icon className="size-3.5" />
              )}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl border-destructive/20 shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
                <AlertCircleIcon className="size-5 text-destructive" />
                Delete Project?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                This will permanently delete <span className="font-bold text-foreground">"{project.name}"</span>. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-xl border-none bg-muted/50 hover:bg-muted font-medium">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-semibold transition-all shadow-lg shadow-destructive/20"
              >
                Delete Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="p-3.5 flex flex-col gap-0.5">
        <h3 className="font-semibold text-sm truncate w-full text-card-foreground">
          {project.name}
        </h3>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </div>
  );
});

ProjectCard.displayName = "ProjectCard";

export default LandingSection;
