import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const buffer   = Buffer.from(await file.arrayBuffer());
    const safeName = `${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;

    /* Save to public/uploads/ so Next.js serves it as a static file */
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, safeName), buffer);

    const url = `/uploads/${safeName}`;

    /* Extract per-page text with pdf-parse */
    let slideTexts: string[] = [];
    let pageCount = 0;
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const pages: string[] = [];
      await pdfParse(buffer, {
        pagerender: async (pageData: { getTextContent: () => Promise<{ items: { str: string }[] }> }) => {
          const content = await pageData.getTextContent();
          const text = content.items.map((i) => i.str).join(" ").trim();
          pages.push(text || `[Slide ${pages.length + 1}]`);
          return text;
        },
      });
      slideTexts = pages;
      pageCount  = pages.length;
    } catch (pdfErr) {
      console.warn("[upload] pdf-parse failed, continuing without slide texts:", pdfErr);
    }

    return NextResponse.json({ url, filename: file.name, pageCount, slideTexts });
  } catch (err) {
    console.error("[POST /api/upload]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
