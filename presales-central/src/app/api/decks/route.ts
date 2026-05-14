import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const repId = req.nextUrl.searchParams.get("repId") ?? "";
  if (!repId) return NextResponse.json({ error: "repId required" }, { status: 400 });
  try {
    const decks = await db.listDecksByRep(repId);
    return NextResponse.json(decks);
  } catch (err) {
    console.error("[GET /api/decks]", err);
    return NextResponse.json({ error: "Failed to list decks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  const repId = body.repId ?? session?.user?.email ?? session?.user?.id;
  if (!repId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const deck = await db.createDeck({
      repId,
      productName:    body.productName   ?? "Untitled",
      targetPersona:  body.targetPersona ?? "",
      differentiators: body.differentiators ?? [],
      keyQuestions:   body.keyQuestions   ?? [],
    });
    return NextResponse.json(deck, { status: 201 });
  } catch (err) {
    console.error("[POST /api/decks]", err);
    return NextResponse.json({ error: "Failed to create deck" }, { status: 500 });
  }
}
