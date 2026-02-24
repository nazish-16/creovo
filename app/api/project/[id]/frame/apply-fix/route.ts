import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const session = await getKindeServerSession();
        const user = await session.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { frameId, actionableFixes } = await request.json();

        if (!frameId || !actionableFixes) {
            return NextResponse.json(
                { error: "frameId and actionableFixes are required" },
                { status: 400 }
            );
        }
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: user.id,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const frame = await prisma.frame.findFirst({
            where: {
                id: frameId,
                projectId: projectId,
            },
        });

        if (!frame) {
            return NextResponse.json({ error: "Frame not found" }, { status: 404 });
        }

        await inngest.send({
            name: "ui/apply.critique.fix",
            data: {
                userId: user.id,
                projectId: projectId,
                frameId: frameId,
                htmlContent: frame.htmlContent,
                actionableFixes,
                themeId: project.theme,
                designSystemLocked: project.designSystemLocked,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Applying fixes...",
        });
    } catch (error) {
        console.log("Apply critique fix error:", error);
        return NextResponse.json(
            { error: "Failed to apply fixes" },
            { status: 500 }
        );
    }
}
