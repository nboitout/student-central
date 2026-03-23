const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";

/* ── Types ─────────────────────────────────────────────── */
export interface Course {
  id: string;
  userId: string;
  title: string;
  author: string;
  source: string;
  pdfUrl?: string | null;
  allowDownload?: boolean;
  status: "Not Started" | "In Progress" | "Completed";
  exercisesTotal: number;
  exercisesDone: number;
  createdAt: string;
  updatedAt: string;
}

export interface MCQOption {
  letter: string;
  text: string;
}

export interface MCQQuestion {
  question: string;
  options: MCQOption[];
  correctIndex: number;
  explanation: string;
  courseId: string;
}

export interface ReasoningSignal {
  signal: "Strong" | "Fragile" | "Partial misconception" | "Low mastery";
  confidence: "High" | "Medium" | "Low";
  facultyInsight: string;
  studentFeedback: string;
}

/* ── Helper ─────────────────────────────────────────────── */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error ${res.status}: ${error}`);
  }
  return res.json();
}

/* ── Courses ────────────────────────────────────────────── */
export async function listCourses(userId = "nicolas"): Promise<Course[]> {
  const data = await request<{ courses: Course[]; count: number }>(
    `/api/courses?userId=${userId}`
  );
  return data.courses;
}

export async function createCourse(payload: {
  title: string;
  author: string;
  source: string;
  userId?: string;
  exercisesTotal?: number;
  allowDownload?: boolean;
}): Promise<Course> {
  return request<Course>("/api/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCourse(
  courseId: string,
  updates: { status?: string; exercisesDone?: number },
  userId = "nicolas"
): Promise<Course> {
  return request<Course>(`/api/courses/${courseId}?userId=${userId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteCourse(
  courseId: string,
  userId = "nicolas"
): Promise<void> {
  await fetch(`${API_URL}/api/courses/${courseId}?userId=${userId}`, {
    method: "DELETE",
  });
}

export async function attachPdf(
  courseId: string,
  pdfUrl: string,
  userId = "nicolas"
): Promise<Course> {
  return request<Course>(
    `/api/courses/${courseId}/pdf?userId=${userId}&pdfUrl=${encodeURIComponent(pdfUrl)}`,
    { method: "PATCH" }
  );
}

/* ── Upload ─────────────────────────────────────────────── */
export async function uploadPdf(file: File): Promise<{ url: string; filename: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Upload error ${res.status}: ${error}`);
  }
  return res.json();
}

/* ── MCQ ────────────────────────────────────────────────── */
export async function generateMCQ(payload: {
  courseId: string;
  pdfUrl?: string;
  courseTitle?: string;
}): Promise<MCQQuestion> {
  return request<MCQQuestion>("/api/mcq/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function evaluateReasoning(payload: {
  courseId: string;
  question: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number;
  studentExplanation: string;
}): Promise<ReasoningSignal> {
  return request<ReasoningSignal>("/api/mcq/evaluate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ── MCQ Generation trigger ─────────────────────────────── */
export async function triggerMCQGeneration(payload: {
  courseId: string;
  pdfUrl: string;
}): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>(
    `/api/upload/trigger-mcq-generation?course_id=${payload.courseId}&pdf_url=${encodeURIComponent(payload.pdfUrl)}`,
    { method: "POST" }
  );
}
