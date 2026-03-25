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
  tutorLanguage?: string | null;    /* e.g. "en", "fr", "de" — language for MCQ + AI tutor */
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
  mcqId?: string;
  pageNumber?: number;
  slideImageUrl?: string | null;
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
  tutorLanguage?: string;
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

/* ── AI Tutor ───────────────────────────────────────────── */
export interface TutorMessage {
  role: "ai" | "student";
  text: string;
}

export interface TutorProbeRequest {
  courseId:     string;
  question:     string;
  options:      string[];
  correctIndex: number;
  selectedIndex: number;
  isCorrect:    boolean;
  explanation:  string;
  language:     string;
}

export interface TutorReplyRequest extends TutorProbeRequest {
  history: TutorMessage[];
}

export interface TutorResponse {
  message: string;
}

export async function tutorProbe(payload: TutorProbeRequest): Promise<TutorResponse> {
  return request<TutorResponse>("/api/tutor/probe", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function tutorReply(payload: TutorReplyRequest): Promise<TutorResponse> {
  return request<TutorResponse>("/api/tutor/reply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ── Slide SAS URL ──────────────────────────────────────── */
export async function getSlideSasUrl(
  courseId: string,
  mcqId: string
): Promise<{ sasUrl: string; pageNumber: number }> {
  return request<{ sasUrl: string; pageNumber: number }>(
    `/api/mcq/bank/${courseId}/${mcqId}/slide`
  );
}

/* ── Session API ─────────────────────────────────────────── */

/** Shape of a question as returned by the session endpoints */
export interface SessionQuestion {
  mcqId:         string;
  position:      number;          /* 1-based */
  question:      string;
  options:       string[] | MCQOption[];  /* backend sends plain strings */
  correctIndex:  number;
  pageNumber?:   number | null;
  slideImageUrl?: string | null;
  courseId?:     string;
}

export interface SessionCreateResponse {
  sessionId:      string;
  question:       SessionQuestion;   /* backend returns "question", not "firstQuestion" */
  mode?:          string;
  language?:      string;
  totalQuestions?: number;
}

export interface SessionAnswerResponse {
  ok: boolean;
}

/** Returned by PATCH /explanation — includes the computed signal */
export interface SessionExplanationResponse {
  signal:      ReasoningSignal["signal"];
  confidence:  ReasoningSignal["confidence"];
  facultyInsight:  string;
  studentFeedback: string;
}

export interface SessionSummary {
  totalQuestions:  number;
  correctCount:    number;
  totalDurationSec: number;
  signalBreakdown: Record<string, number>;
}

export async function createSession(payload: {
  courseId:  string;
  userId?:   string;
  mode:      "assessment" | "tutoring";
  language:  string;
}): Promise<SessionCreateResponse> {
  return request<SessionCreateResponse>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ userId: payload.userId ?? "nicolas", ...payload }),
  });
}

export async function getSessionQuestion(
  sessionId: string,
  position: number,
  courseId?: string,
  userId = "nicolas"
): Promise<SessionQuestion> {
  const params = new URLSearchParams({ userId });
  if (courseId) params.set("courseId", courseId);
  return request<SessionQuestion>(`/api/sessions/${sessionId}/question/${position}?${params}`);
}

export async function patchSessionAnswer(
  sessionId: string,
  payload: { position: number; selectedIndex: number; durationSec: number }
): Promise<SessionAnswerResponse> {
  return request<SessionAnswerResponse>(`/api/sessions/${sessionId}/answer`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function patchSessionExplanation(
  sessionId: string,
  payload: { position: number; studentExplanation: string }
): Promise<SessionExplanationResponse> {
  return request<SessionExplanationResponse>(`/api/sessions/${sessionId}/explanation`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function patchSessionChat(
  sessionId: string,
  payload: { role: "ai" | "student"; text: string; questionPosition: number }
): Promise<void> {
  await request<void>(`/api/sessions/${sessionId}/chat`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function completeSession(sessionId: string): Promise<SessionSummary> {
  return request<SessionSummary>(`/api/sessions/${sessionId}/complete`, {
    method: "POST",
  });
}
