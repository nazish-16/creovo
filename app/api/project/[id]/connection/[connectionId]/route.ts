import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string, connectionId: string }> }
) {
    try {
        const { id: projectId, connectionId } = await context.params;
        const session = await getKindeServerSession();
        const user = await session.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify project ownership
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                userId: user.id,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        await prisma.connection.delete({
            where: {
                id: connectionId,
                projectId: projectId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.log("Delete connection error:", error);
        return NextResponse.json(
            { error: "Failed to delete connection" },
            { status: 500 }
        );
    }
}
