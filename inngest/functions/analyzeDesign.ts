import { generateObject } from "ai";
import { inngest } from "../client";
import { z } from "zod";
import { openrouter } from "@/lib/openrouter";
import { CRITIQUE_PROMPT } from "@/lib/prompt";

const CritiqueSchema = z.object({
    critique: z.array(z.string()),
    actionableFixes: z.string(),
});

export const analyzeDesign = inngest.createFunction(
    { id: "analyze-design" },
    { event: "ui/analyze.design" },
    async ({ event, step, publish }) => {
        const { userId, projectId, frameId, htmlContent } = event.data;
        const CHANNEL = `user:${userId}`;

        await publish({
            channel: CHANNEL,
            topic: "critique.start",
            data: {
                status: "analyzing",
                projectId,
                frameId,
            },
        });

        const result = await step.run("generate-critique", async () => {
            const { object } = await generateObject({
                model: openrouter("google/gemini-2.0-flash-001"),
                schema: CritiqueSchema,
                system: CRITIQUE_PROMPT,
                prompt: `Analyze this mobile UI HTML:\n\n${htmlContent}`,
            });
            return object;
        });

        await publish({
            channel: CHANNEL,
            topic: "critique.complete",
            data: {
                status: "completed",
                projectId,
                frameId,
                critique: result.critique,
                actionableFixes: result.actionableFixes,
            },
        });

        return result;
    }
);
