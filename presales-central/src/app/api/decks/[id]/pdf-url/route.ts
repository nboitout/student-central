import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deck = await db.getDeckById(params.id);
    if (!deck?.pdfUrl) return NextResponse.json({ error: "No PDF attached" }, { status: 404 });
    /* pdfUrl is already a public path (/uploads/...) — return as-is */
    return NextResponse.json({ url: deck.pdfUrl });
  } catch (err) {
    console.error("[GET /api/decks/[id]/pdf-url]", err);
    return NextResponse.json({ error: "Failed to get PDF URL" }, { status: 500 });
  }
}
