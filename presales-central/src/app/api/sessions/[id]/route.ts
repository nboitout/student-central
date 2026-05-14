import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await db.getSessionById(params.id);
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(session);
  } catch (err) {
    console.error("[GET /api/sessions/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body    = await req.json();
    const session = await db.updateSession(params.id, body);
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(session);
  } catch (err) {
    console.error("[PATCH /api/sessions/[id]]", err);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
