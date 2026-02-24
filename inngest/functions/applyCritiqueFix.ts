import { generateText } from "ai";
import { inngest } from "../client";
import { openrouter } from "@/lib/openrouter";
import { GENERATION_SYSTEM_PROMPT } from "@/lib/prompt";
import prisma from "@/lib/prisma";

export const applyCritiqueFix = inngest.createFunction(
    { id: "apply-critique-fix" },
    { event: "ui/apply.critique.fix" },
    async ({ event, step, publish }) => {
        const { userId, projectId, frameId, htmlContent, actionableFixes, themeId, designSystemLocked } = event.data;
        const CHANNEL = `user:${userId}`;

        await publish({
            channel: CHANNEL,
            topic: "generation.start",
            data: {
                status: "fixing",
                projectId: projectId,
                frameId: frameId,
            },
        });

        const resultHtml = await step.run("apply-fix-screen", async () => {
            const { BASE_VARIABLES, THEME_LIST } = require("@/lib/themes");
            const selectedTheme = THEME_LIST.find((t: any) => t.id === themeId);
            const fullThemeCSS = `${BASE_VARIABLES}\n${selectedTheme?.style || ""}`;

            const { text } = await generateText({
                model: openrouter("google/gemini-2.0-flash-001"),
                system: GENERATION_SYSTEM_PROMPT + (designSystemLocked ? "\n\nSTRICT DESIGN SYSTEM LOCK ACTIVE: You MUST use the provided THEME VARIABLES for all colors, spacing, and typography. Do NOT introduce any new colors or utility classes that deviate from the design system." : ""),
                prompt: `
          FIX this screen using the following technical directive: ${actionableFixes}
          
          ORIGINAL HTML:
          ${htmlContent}
          
          THEME VARIABLES: ${fullThemeCSS}

          STRICT RULES:
          1. Preserve the theme and identity.
          2. Only apply the fixes described.
          3. Return only raw HTML.
        `,
            });

            let finalHtml = text ?? "";
            const match = finalHtml.match(/<div[\s\S]*<\/div>/);
            finalHtml = match ? match[0] : finalHtml;
            finalHtml = finalHtml.replace(/```(html)?/g, "").replace(/```/g, "").trim();
            return finalHtml;
        });

        const updatedFrame = await step.run("update-frame-db", async () => {
            return await prisma.frame.update({
                where: { id: frameId },
                data: { htmlContent: resultHtml },
            });
        });

        await publish({
            channel: CHANNEL,
            topic: "frame.created",
            data: {
                frame: updatedFrame,
                screenId: frameId,
                projectId: projectId,
            },
        });

        await publish({
            channel: CHANNEL,
            topic: "generation.complete",
            data: {
                status: "completed",
                projectId: projectId,
            },
        });

        return { success: true };
    }
);
