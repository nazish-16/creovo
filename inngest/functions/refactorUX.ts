import { generateText } from "ai";
import { inngest } from "../client";
import { openrouter } from "@/lib/openrouter";
import { UX_REFACTOR_PROMPT, GENERATION_SYSTEM_PROMPT } from "@/lib/prompt";
import prisma from "@/lib/prisma";

export const refactorUX = inngest.createFunction(
    { id: "refactor-ux" },
    { event: "ui/refactor.ux" },
    async ({ event, step, publish }) => {
        const { userId, projectId, frameId, htmlContent, themeId, designSystemLocked } = event.data;
        const CHANNEL = `user:${userId}`;

        await publish({
            channel: CHANNEL,
            topic: "generation.start",
            data: {
                status: "refactoring",
                projectId: projectId,
                frameId: frameId,
            },
        });

        const resultHtml = await step.run("refactor-structure", async () => {
            const { BASE_VARIABLES, THEME_LIST } = require("@/lib/themes");
            const selectedTheme = THEME_LIST.find((t: any) => t.id === themeId);
            const fullThemeCSS = `${BASE_VARIABLES}\n${selectedTheme?.style || ""}`;

            const { text } = await generateText({
                model: openrouter("google/gemini-2.0-flash-001"),
                system: GENERATION_SYSTEM_PROMPT + "\n\n" + UX_REFACTOR_PROMPT +
                    (designSystemLocked ? "\n\nSTRICT DESIGN SYSTEM LOCK ACTIVE: You MUST use the provided THEME VARIABLES for all colors, spacing, and typography. Do NOT introduce any new colors or utility classes that deviate from the design system." : ""),
                prompt: `REFACTOR this screen:\n\n${htmlContent}\n\nTHEME VARIABLES: ${fullThemeCSS}`,
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
