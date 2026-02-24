import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
        const { fromId, toId, label } = await request.json();

        // Basic validation for MongoDB Object IDs (24-char hex strings)
        const isValidId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

        if (!fromId || !toId) {
            return NextResponse.json(
                { error: "fromId and toId are required" },
                { status: 400 }
            );
        }

        if (!isValidId(fromId) || !isValidId(toId)) {
            return NextResponse.json(
                { error: "Wait for screens to finish generating before connecting them." },
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

        const connection = await prisma.connection.create({
            data: {
                projectId,
                fromId,
                toId,
                label: label || "On Tap",
            },
        });

        return NextResponse.json(connection);
    } catch (error) {
        console.log("Create connection error:", error);
        return NextResponse.json(
            { error: "Failed to create connection" },
            { status: 500 }
        );
    }
}
