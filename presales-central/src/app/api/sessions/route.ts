import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function GET(req: NextRequest) {
  const deckId = req.nextUrl.searchParams.get("deckId") ?? "";
  if (!deckId) return NextResponse.json({ error: "deckId required" }, { status: 400 });

  try {
    const deck = await db.getDeckById(deckId);
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

    const sessions = await db.listSessionsByDeck(deckId);
    return NextResponse.json(sessions);
  } catch (err) {
    console.error("[GET /api/sessions]", err);
    return NextResponse.json({ error: "Failed to list sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.demoDeckId || !body.prospectName) {
      return NextResponse.json({ error: "demoDeckId and prospectName required" }, { status: 400 });
    }
    const deck = await db.getDeckById(body.demoDeckId);
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 });

    const session = await db.createSession({
      demoDeckId:    body.demoDeckId,
      prospectName:  body.prospectName,
      prospectEmail: body.prospectEmail,
      totalSlides:   deck.totalSlides,
    });
    return NextResponse.json({ sessionId: session.id, deck }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/sessions]", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
