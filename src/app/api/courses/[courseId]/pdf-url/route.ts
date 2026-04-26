import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL
  ?? "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ detail: "Missing userId." }, { status: 400 });
  }

  const upstream = await fetch(
    `${API}/api/courses/${encodeURIComponent(params.courseId)}/pdf-url?userId=${encodeURIComponent(userId)}`,
    { cache: "no-store" },
  );

  const data = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(data ?? { detail: "PDF URL fetch failed." }, {
      status: upstream.status,
    });
  }

  const url = data?.url ?? data?.sasUrl ?? null;

  return NextResponse.json({
    ...data,
    url,
  });
}
