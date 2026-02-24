/* eslint-disable @typescript-eslint/no-explicit-any */
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
let cachedExecutablePath: string | null = null;
let downloadPromise: Promise<string> | null = null;

async function getChromiumPath(): Promise<string> {
  if (cachedExecutablePath) return cachedExecutablePath;

  if (!downloadPromise) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    downloadPromise = chromium
      .executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar"
      )
      .then((path) => {
        cachedExecutablePath = path;
        console.log("Chromium path cached:", path);
        return path;
      })
      .catch((error) => {
        console.error("Failed to get Chromium path:", error);
        downloadPromise = null;
        throw error;
      });
  }

  return downloadPromise;
}

export async function POST(req: Request) {
  let browser;

  try {
    const body = await req.json();
    const { html, width = 800, height = 600, projectId } = body;
    console.log("Screenshot request received", { width, height, hasProjectId: !!projectId });
    const session = await getKindeServerSession();
    const user = await session.getUser();

    if (!user) {
      console.log("Unauthorized request");
      throw new Error("Unauthorized");
    }
    const userId = user.id;

    //Detect environment
    const isProduction = process.env.NODE_ENV === "production";
    const isVercel = !!process.env.VERCEL;

    let puppeteer: any;
    let launchOptions: any = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=none",
      ],
    };

    console.log("Environment:", { isProduction, isVercel });

    if (isProduction && isVercel) {
      console.log("Using puppeteer-core and chromium-min");
      const chromium = (await import("@sparticuz/chromium-min")).default;
      puppeteer = await import("puppeteer-core");
      const executablePath = await getChromiumPath();

      launchOptions = {
        ...launchOptions,
        args: [...chromium.args, ...launchOptions.args],
        executablePath,
      };
    } else {
      console.log("Using standard puppeteer");
      puppeteer = await import("puppeteer");

      // On Windows development, sometimes we need to explicitly find Chrome or Edge
      // if standard puppeteer fails to find its bundled browser
      if (process.platform === "win32") {
        console.log("Detecting Windows environment, applying compatibility flags");
        // Add more flags if needed
      }
    }

    console.log("Launching browser...");
    try {
      browser = await puppeteer.launch(launchOptions);
    } catch (launchError: any) {
      console.error("First launch attempt failed:", launchError.message);
      console.log("Attempting fallback launch without special args...");
      browser = await puppeteer.launch({ headless: true });
    }
    console.log("Browser launched successfully");

    const page = await browser.newPage();
    console.log("New page created");

    // Set Viewport size
    const finalWidth = Math.min(Number(width), 5000) || 1200;
    const finalHeight = Math.min(Number(height), 5000) || 800;

    await page.setViewport({
      width: finalWidth,
      height: finalHeight,
      deviceScaleFactor: 2,
    });

    console.log(`Setting viewport: ${finalWidth}x${finalHeight}`);

    // Set HTML Content
    console.log("Setting content (length:", html?.length, ")...");
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    console.log("Content set successfully");

    // Wait for a bit more to ensure fonts and styles are applied
    console.log("Waiting for styles to settle...");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Screenshot
    console.log("Taking screenshot...");
    const buffer = await page.screenshot({
      type: "png",
      fullPage: false,
    });
    console.log("Screenshot taken successfully, size:", buffer.length);

    if (projectId) {
      console.log("Saving thumbnail to project:", projectId);
      const base64 = buffer.toString("base64");
      await prisma.project.update({
        where: {
          id: projectId,
          userId,
        },
        data: {
          thumbnail: `data:image/png;base64,${base64}`,
        },
      });
      console.log("Thumbnail saved to database");
      return NextResponse.json({ base64 });
    }

    console.log("Returning screenshot as PNG response");
    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Screenshot API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to capture screenshot",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      console.log("Cleaning up: closing browser...");
      try {
        await browser.close();
        console.log("Browser closed");
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }
  }
}
