/* ── Auth helper ─────────────────────────────────────────
   Components call setCurrentUser() after session resolves.
   Falls back to "nicolas" during local dev without auth.  */
let _currentUserId = "nicolas";

export function setCurrentUser(userId: string) {
  _currentUserId = userId;
}

async function getCurrentUserId(): Promise<string> {
  return _currentUserId;
}

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
  mcqStatus?: "idle" | "generating" | "ready" | "error";  /* MCQ bank generation state */
  learningPrefs?: {
    masteryLevel?:  "familiarity" | "working" | "deep";
    priorKnowledge?: "none" | "some" | "solid" | "adjacent";
    cadence?:       "oneshot" | "days" | "weeks";
    focusNote?:     string;
  } | null;
  status: "Not Started" | "In Progress" | "Completed";
  exercisesTotal: number;
  exercisesDone: number;
  mcqCount?: number;           /* actual number of generated MCQs — updated after generation */
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
export async function listCourses(userId?: string): Promise<Course[]> {
  const uid = userId ?? await getCurrentUserId();
  const data = await request<{ courses: Course[]; count: number }>(
    `/api/courses?userId=${uid}`
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
  learningPrefs?: Course["learningPrefs"];
}): Promise<Course> {
  const uid = payload.userId ?? await getCurrentUserId();
  return request<Course>("/api/courses", {
    method: "POST",
    body: JSON.stringify({ ...payload, userId: uid }),
  });
}

export async function updateCourse(
  courseId: string,
  updates: { status?: string; exercisesDone?: number; learningPrefs?: Course["learningPrefs"]; title?: string; author?: string },
  userId?: string
): Promise<Course> {
  const uid = userId ?? await getCurrentUserId();
  return request<Course>(`/api/courses/${courseId}?userId=${uid}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteCourse(
  courseId: string,
  userId?: string
): Promise<void> {
  const uid = userId ?? await getCurrentUserId();
  await fetch(`${API_URL}/api/courses/${courseId}?userId=${uid}`, {
    method: "DELETE",
  });
}

export async function attachPdf(
  courseId: string,
  pdfUrl: string,
  userId?: string
): Promise<Course> {
  const uid = userId ?? await getCurrentUserId();
  return request<Course>(
    `/api/courses/${courseId}/pdf?userId=${uid}&pdfUrl=${encodeURIComponent(pdfUrl)}`,
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
  userId?: string;
}): Promise<{ status: string; message: string }> {
  const uid = payload.userId ?? await getCurrentUserId();
  return request<{ status: string; message: string }>(
    `/api/upload/trigger-mcq-generation?course_id=${payload.courseId}&pdf_url=${encodeURIComponent(payload.pdfUrl)}&user_id=${encodeURIComponent(uid)}`,
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
  correctIndex:  number;          /* camelCase — may come as correct_index */
  correct_index?: number;         /* snake_case fallback */
  pageNumber?:   number | null;   /* camelCase */
  page_number?:  number | null;   /* snake_case fallback */
  slideImageUrl?: string | null;  /* camelCase */
  slide_image_url?: string | null; /* snake_case — FastAPI default */
  courseId?:     string;
  course_id?:    string;
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
  const uid = payload.userId ?? await getCurrentUserId();
  return request<SessionCreateResponse>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ ...payload, userId: uid }),
  });
}

export async function getSessionQuestion(
  sessionId: string,
  position: number,
  courseId?: string,
  userId?: string
): Promise<SessionQuestion> {
  const uid = userId ?? await getCurrentUserId();
  const params = new URLSearchParams({ userId: uid });
  if (courseId) params.set("courseId", courseId);
  return request<SessionQuestion>(`/api/sessions/${sessionId}/question/${position}?${params}`);
}

export async function patchSessionAnswer(
  sessionId: string,
  payload: { position: number; selectedIndex: number; durationSec: number },
  courseId: string,
  userId?: string
): Promise<SessionAnswerResponse> {
  const uid = userId ?? await getCurrentUserId();
  return request<SessionAnswerResponse>(
    `/api/sessions/${sessionId}/answer?courseId=${courseId}&userId=${uid}`, {
    method: "PATCH",
    body: JSON.stringify({
      position:      payload.position,
      selectedIndex: payload.selectedIndex,
      durationSec:   payload.durationSec,
    }),
  });
}

export async function patchSessionExplanation(
  sessionId: string,
  payload: { position: number; studentExplanation: string },
  courseId: string,
  userId?: string
): Promise<SessionExplanationResponse> {
  const uid = userId ?? await getCurrentUserId();
  return request<SessionExplanationResponse>(
    `/api/sessions/${sessionId}/explanation?courseId=${courseId}&userId=${uid}`, {
    method: "PATCH",
    body: JSON.stringify({
      position:          payload.position,
      studentExplanation: payload.studentExplanation,
    }),
  });
}

export async function patchSessionChat(
  sessionId: string,
  payload: { role: "ai" | "student"; text: string; questionPosition: number },
  courseId: string,
  userId?: string
): Promise<void> {
  const uid = userId ?? await getCurrentUserId();
  await request<void>(`/api/sessions/${sessionId}/chat?courseId=${courseId}&userId=${uid}`, {
    method: "PATCH",
    body: JSON.stringify({
      role:             payload.role,
      text:             payload.text,
      questionPosition: payload.questionPosition,
    }),
  });
}

export async function completeSession(sessionId: string, courseId: string, userId?: string): Promise<SessionSummary> {
  const uid = userId ?? await getCurrentUserId();
  return request<SessionSummary>(`/api/sessions/${sessionId}/complete?courseId=${courseId}&userId=${uid}`, {
    method: "POST",
  });
}

/* ── Session list ────────────────────────────────────────── */
export interface StoredSessionQuestion {
  position:           number;
  mcqId:              string;
  question:           string;
  options:            string[] | MCQOption[];
  correctIndex:       number;
  correct_index?:     number;
  pageNumber?:        number | null;
  page_number?:       number | null;
  selectedIndex?:     number | null;
  selected_index?:    number | null;
  isCorrect?:         boolean | null;
  is_correct?:        boolean | null;
  durationSec?:       number | null;
  duration_sec?:      number | null;
  studentExplanation?: string | null;
  student_explanation?: string | null;
  evaluationSignal?:  string | null;
  evaluation_signal?: string | null;
  evaluationConfidence?: string | null;
  facultyInsight?:    string | null;
  studentFeedback?:   string | null;
}

export interface StoredSession {
  id:           string;
  courseId:     string;
  course_id?:   string;
  userId:       string;
  mode:         string;
  language:     string;
  status:       "started" | "answering" | "reviewing" | "chatting" | "completed";
  startedAt?:   string;
  started_at?:  string;
  completedAt?: string;
  completed_at?: string;
  questions:    StoredSessionQuestion[];
  summary?:     SessionSummary | null;
  chatHistory?: {
    role:              "ai" | "student" | "user";  /* backend may use "user" for student */
    text:              string;
    questionPosition:  number;
    timestamp?:        string;
  }[];
}

export async function listSessions(
  courseId: string,
  userId?: string
): Promise<StoredSession[]> {
  const uid = userId ?? await getCurrentUserId();
  const params = new URLSearchParams({ courseId, userId: uid });
  const data = await request<StoredSession[] | { sessions: StoredSession[] }>(
    `/api/sessions?${params}`
  );
  return Array.isArray(data) ? data : (data as { sessions: StoredSession[] }).sessions ?? [];
}

export async function getSession(sessionId: string, courseId: string, userId?: string): Promise<StoredSession> {
  const uid = userId ?? await getCurrentUserId();
  return request<StoredSession>(`/api/sessions/${sessionId}?courseId=${courseId}&userId=${uid}`);
}
