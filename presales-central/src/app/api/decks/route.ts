import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

const REP_ID = "default";

export async function GET(req: NextRequest) {
  const repId = req.nextUrl.searchParams.get("repId") ?? REP_ID;
  try {
    const decks = await db.listDecksByRep(repId);
    return NextResponse.json(decks);
  } catch (err) {
    console.error("[GET /api/decks]", err);
    return NextResponse.json({ error: "Failed to list decks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const deck = await db.createDeck({
      repId:          body.repId ?? REP_ID,
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
