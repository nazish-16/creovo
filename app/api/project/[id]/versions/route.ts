import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
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

        const versions = await prisma.projectVersion.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json(versions);
    } catch (error) {
        console.error("Get versions error:", error);
        return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
    }
}

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

        const { data, name } = await request.json();

        if (!data) {
            return NextResponse.json({ error: "Data is required" }, { status: 400 });
        }

        const version = await prisma.projectVersion.create({
            data: {
                projectId,
                data,
                name: name || "Manual save",
            },
        });

        return NextResponse.json(version);
    } catch (error) {
        console.error("Create version error:", error);
        return NextResponse.json({ error: "Failed to create version" }, { status: 500 });
    }
}
