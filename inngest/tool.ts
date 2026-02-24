import { tool } from "ai";
import { z } from "zod";

export const unsplashTool = tool({
  description:
    "Get high-quality placeholder images. Use this when you need to add an <img> tag.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("Image category (e.g. 'finance', 'travel', 'nature')"),
    width: z.number().default(600),
    height: z.number().default(400),
  }),
  execute: async ({ query, width, height }) => {
    try {
      return `https://loremflickr.com/${width}/${height}/${encodeURIComponent(query)}`;
    } catch {
      return `https://placehold.co/${width}x${height}?text=${encodeURIComponent(query)}`;
    }
  },
});
