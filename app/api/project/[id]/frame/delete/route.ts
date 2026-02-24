import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getKindeServerSession();
    const user = await session.getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { frameId } = body;

    console.log(`Attempting to delete frame: ${frameId} from project: ${projectId} for user: ${user.id}`);

    if (!frameId) {
      return NextResponse.json({ error: "Frame ID is required" }, { status: 400 });
    }

    // 1. Find the frame and include its project to verify ownership
    // Using findFirst with ID or findUnique should both work, but findFirst is safer for weird ID formats
    const frame = await prisma.frame.findFirst({
      where: {
        id: frameId,
      },
      include: {
        project: true,
      },
    });

    if (!frame) {
      console.error(`Frame not found: ${frameId}`);
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    // 2. Verify frame belongs to the project and the user owns the project
    // Robust comparison using String() to avoid object vs string issues
    const frameProjectIdStr = String(frame.projectId);
    const routeProjectIdStr = String(projectId);
    const frameProjectUserId = String(frame.project.userId);
    const currentUserId = String(user.id);

    if (frameProjectIdStr !== routeProjectIdStr || frameProjectUserId !== currentUserId) {
      console.error("Ownership verification failed:", {
        frame_project: frameProjectIdStr,
        route_project: routeProjectIdStr,
        frame_user: frameProjectUserId,
        current_user: currentUserId
      });
      return NextResponse.json(
        { error: "Unauthorized to delete this frame" },
        { status: 403 }
      );
    }

    // 3. Perform the actual deletion
    await prisma.frame.delete({
      where: {
        id: frameId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Frame deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete frame internal error:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json(
      {
        error: "Failed to delete frame",
        message: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
