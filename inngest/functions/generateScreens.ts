import { generateObject, generateText, stepCountIs } from "ai";
import { inngest } from "../client";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import { FrameType } from "@/types/project";
import { ANALYSIS_PROMPT, GENERATION_SYSTEM_PROMPT } from "@/lib/prompt";
import prisma from "@/lib/prisma";
import { BASE_VARIABLES, THEME_LIST } from "@/lib/themes";
import { unsplashTool } from "../tool";

const AnalysisSchema = z.object({
  theme: z
    .string()
    .describe(
      "The specific visual theme ID (e.g., 'midnight', 'ocean-breeze', 'neo-brutalism').",
    ),
  screens: z
    .array(
      z.object({
        id: z
          .string()
          .describe(
            "Unique identifier for the screen (e.g., 'home-dashboard', 'profile-settings', 'transaction-history'). Use kebab-case.",
          ),
        name: z
          .string()
          .describe(
            "Short, descriptive name of the screen (e.g., 'Home Dashboard', 'Profile', 'Transaction History')",
          ),
        purpose: z
          .string()
          .describe(
            "One clear sentence explaining what this screen accomplishes for the user and its role in the app",
          ),
        visualDescription: z
          .string()
          .describe(
            "A dense, high-fidelity visual directive (like an image generation prompt). Describe the layout, specific data examples (e.g. 'Oct-Mar'), component hierarchy, and physical attributes (e.g. 'Chunky cards', 'Floating header','Floating action button', 'Bottom navigation',Header with user avatar).",
          ),
      }),
    )
    .min(1)
    .max(4),
});

export const generateScreens = inngest.createFunction(
  { id: "generate-ui-screens" },
  { event: "ui/generate.screens" },
  async ({ event, step, publish }) => {
    const {
      userId,
      projectId,
      prompt,
      frames,
      theme: existingTheme,
      designSystemLocked,
    } = event.data;
    const CHANNEL = `user:${userId}`;
    const isExistingGeneration = Array.isArray(frames) && frames.length > 0;

    await publish({
      channel: CHANNEL,
      topic: "generation.start",
      data: {
        status: "running",
        projectId: projectId,
      },
    });

    //Analyze or plan
    const analysis = await step.run("analyze-and-plan-screens", async () => {
      await publish({
        channel: CHANNEL,
        topic: "analysis.start",
        data: {
          status: "analyzing",
          projectId: projectId,
        },
      });

      const contextHTML = isExistingGeneration
        ? frames
          .map(
            (frame: FrameType) =>
              `<!-- ${frame.title} -->\n${frame.htmlContent}`,
          )
          .join("\n\n")
        : "";

      const analysisPrompt = isExistingGeneration
        ? `
          USER REQUEST: ${prompt}
          SELECTED THEME: ${existingTheme}

          EXISTING SCREENS (analyze for consistency navigation, layout, design system etc):
          ${contextHTML}
        `.trim()
        : `
          USER REQUEST: ${prompt}
        `.trim();

      const imageParts = event.data.images?.map((img: string) => ({
        type: "image",
        image: img,
      })) || [];

      const { object } = await generateObject({
        model: openrouter("google/gemini-2.0-flash-001"),
        schema: AnalysisSchema,
        system: ANALYSIS_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: analysisPrompt },
              ...imageParts,
            ],
          },
        ],
      });

      const themeToUse = isExistingGeneration ? existingTheme : object.theme;

      if (!isExistingGeneration) {
        await prisma.project.update({
          where: {
            id: projectId,
            userId: userId,
          },
          data: { theme: themeToUse },
        });
      }

      await publish({
        channel: CHANNEL,
        topic: "analysis.complete",
        data: {
          status: "generating",
          theme: themeToUse,
          totalScreens: object.screens.length,
          screens: object.screens,
          projectId: projectId,
        },
      });

      return { ...object, themeToUse };
    });

    const generatedFrames: FrameType[] = isExistingGeneration ? [...frames] : [];

    for (let i = 0; i < analysis.screens.length; i++) {
      const screenPlan = analysis.screens[i];
      const selectedTheme = THEME_LIST.find((t) => t.id === analysis.themeToUse);
      const fullThemeCSS = `${BASE_VARIABLES}\n${selectedTheme?.style || ""}`;

      const previousFramesContext = generatedFrames
        .map((f: FrameType) => `<!-- ${f.title} -->\n${f.htmlContent}`)
        .join("\n\n");

      await step.run(`generated-screen-${i}`, async () => {
        const genPrompt = `
        SCREEN CONTEXT:
        - Screen ${i + 1}/${analysis.screens.length}: ${screenPlan.name}
        - ID: ${screenPlan.id}
        - Purpose: ${screenPlan.purpose}
        - Visual Directive: ${screenPlan.visualDescription}

        TECHNICAL REQUIREMENTS:
        - Use THEME VARIABLES: ${fullThemeCSS}
        - Map Lucide icons correctly.
        - Ensure real, jittered data for any Chart.js components.
        - Follow ScreenShell layout strictly.
        ${designSystemLocked ? "STRICT DESIGN SYSTEM LOCK: USE PROVIDED THEME VARIABLES ONLY." : ""}
      `.trim();

        const imageParts = event.data.images?.map((img: string) => ({
          type: "image",
          image: img,
        })) || [];

        const result = await generateText({
          model: openrouter("google/gemini-2.0-flash-001"),
          system: GENERATION_SYSTEM_PROMPT,
          tools: { unsplashTool },
          stopWhen: stepCountIs(5),
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: genPrompt },
                ...imageParts,
              ],
            },
          ],
        });

        let finalHtml = result.text ?? "";
        finalHtml = finalHtml.replace(/```(html)?/g, "").replace(/```/g, "").trim();

        const startIdx = finalHtml.indexOf("<div");
        if (startIdx !== -1) {
          finalHtml = finalHtml.substring(startIdx);
        }


        const frame = await prisma.frame.create({
          data: {
            projectId,
            title: screenPlan.name,
            htmlContent: finalHtml,
          },
        });

        await publish({
          channel: CHANNEL,
          topic: "frame.created",
          data: {
            frame: frame,
            screenId: screenPlan.id,
            projectId: projectId,
          },
        });

        generatedFrames.push(frame as any);
      });
    }

    await publish({
      channel: CHANNEL,
      topic: "generation.complete",
      data: {
        status: "completed",
        projectId: projectId,
      },
    });
  },
);
