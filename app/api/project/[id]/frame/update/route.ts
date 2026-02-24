import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { frameId, htmlContent } = await req.json();

        if (!frameId || !htmlContent) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const updatedFrame = await prisma.frame.update({
            where: {
                id: frameId,
                projectId: params.id,
            },
            data: {
                htmlContent,
            },
        });

        return NextResponse.json(updatedFrame);
    } catch (error) {
        console.error("[FRAME_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
