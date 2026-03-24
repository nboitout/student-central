"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./mcq.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { tx as getT } from "@/i18n/translations";
import { evaluateReasoning, getSlideSasUrl, type MCQQuestion, type ReasoningSignal } from "@/lib/api";

const DEMO_SLIDE_URL = "https://placehold.co/1280x720/e8eaff/0048d8?text=Slide+preview";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://student-central-api.whitefield-86cda2f2.westeurope.azurecontainerapps.io";

const LETTERS = ["A", "B", "C", "D"];

type Screen = "loading" | "waiting" | "question" | "answered" | "chat" | "result";

interface ChatMessage { role: "ai" | "student"; text: string; }

const MAX_TURNS = 5;

/* Contextual AI follow-up probe */
function aiProbe(correct: boolean, questionText: string): string {
  if (correct) {
    return `Good — you picked the right answer. In your own words, why is that correct? What's the underlying concept?`;
  }
  return `You selected an incorrect option. What led you to that choice? Try to explain your reasoning.`;
}

const AI_FOLLOWUPS = [
  `Thanks. Can you say more about how you'd distinguish between the correct answer and the distractors?`,
  `Interesting. What prior knowledge or assumption guided your thinking here?`,
  `Good. Can you connect this concept to something you've seen in the course material?`,
  `Almost there — one last question: if you had to explain this to a classmate in one sentence, what would you say?`,
];

function MCQContent() {
  const params      = useSearchParams();
  const router      = useRouter();
  const { lang }    = useLanguage();
  const ui          = getT(lang).mcq;
  const courseId    = params.get("id") ?? "";
  const courseTitle = decodeURIComponent(params.get("title") ?? "Course");
  const pdfUrl      = decodeURIComponent(params.get("pdf") ?? "");

  /* ── Core MCQ state ── */
  const [screen,      setScreen]     = useState<Screen>("loading");
  const [questions,   setQuestions]  = useState<MCQQuestion[]>([]);
  const [qIndex,      setQIndex]     = useState(0);
  const [answers,     setAnswers]    = useState<(number | null)[]>([]);
  const [loadError,   setLoadError]  = useState<string | null>(null);

  /* ── Chat state ── */
  const [chatMsgs,    setChatMsgs]   = useState<ChatMessage[]>([]);
  const [chatInput,   setChatInput]  = useState("");
  const [chatTurns,   setChatTurns]  = useState(0);
  const [evaluating,  setEvaluating] = useState(false);
  const [evalError,   setEvalError]  = useState<string | null>(null);
  const [signal,      setSignal]     = useState<ReasoningSignal | null>(null);

  /* ── Slide state ── */
  const [slideSasUrl, setSlideSasUrl] = useState<string | null>(null);
  const [slideLoaded, setSlideLoaded] = useState(false);

  /* ── Resizable split ── */
  const [slideWidth,  setSlideWidth] = useState(55);
  const bodyRef    = useRef<HTMLDivElement>(null);
  const dragging   = useRef(false);
  const dividerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dividerRef.current?.classList.add(styles.dragging);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !bodyRef.current) return;
      const { left, width } = bodyRef.current.getBoundingClientRect();
      const pct = ((e.clientX - left) / width) * 100;
      setSlideWidth(Math.min(Math.max(pct, 25), 72));
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      dividerRef.current?.classList.remove(styles.dragging);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, []);

  /* ── Helpers ── */
  const mcq     = questions[qIndex] ?? null;
  const selected = answers[qIndex] ?? null;
  const isCorrect = mcq !== null && selected === mcq.correctIndex;

  /* ── Load MCQ ── */
  const loadMCQ = useCallback(() => {
    setScreen("loading");
    setLoadError(null);
    setSlideSasUrl(null);
    setSlideLoaded(false);

    fetch(`${API_URL}/api/mcq/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, pdfUrl: pdfUrl || undefined, courseTitle }),
    })
      .then(async (res) => {
        if (res.status === 202) { setScreen("waiting"); setTimeout(() => loadMCQ(), 10000); return; }
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
          setLoadError(err.detail ?? `Error ${res.status}`);
          setScreen("question");
          return;
        }
        const q: MCQQuestion = await res.json();
        setQuestions(prev => {
          const next = [...prev];
          next[qIndex] = q;
          return next;
        });
        setAnswers(prev => {
          const next = [...prev];
          if (next[qIndex] === undefined) next[qIndex] = null;
          return next;
        });
        setScreen("question");
        if (q.mcqId && q.slideImageUrl) {
          getSlideSasUrl(q.courseId, q.mcqId)
            .then(({ sasUrl }) => setSlideSasUrl(sasUrl))
            .catch(() => setSlideSasUrl(DEMO_SLIDE_URL));
        } else {
          setSlideSasUrl(DEMO_SLIDE_URL);
        }
      })
      .catch(err => { setLoadError(err.message); setScreen("question"); });
  }, [courseId, pdfUrl, courseTitle, qIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadMCQ(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Submit answer → go to answered screen ── */
  const handleSubmit = () => {
    if (selected === null) return;
    setScreen("answered");
  };

  /* ── Pick option ── */
  const pick = (i: number) => {
    setAnswers(prev => { const next = [...prev]; next[qIndex] = i; return next; });
  };

  /* ── Go to chat ── */
  const startChat = () => {
    setChatMsgs([{ role: "ai", text: aiProbe(isCorrect, mcq?.question ?? "") }]);
    setChatInput("");
    setChatTurns(0);
    setSignal(null);
    setEvalError(null);
    setScreen("chat");
  };

  /* ── Send chat message ── */
  const sendChat = () => {
    if (!chatInput.trim() || chatTurns >= MAX_TURNS) return;
    const msg = chatInput.trim();
    setChatInput("");
    const newTurns = chatTurns + 1;
    setChatTurns(newTurns);

    const aiReply = newTurns < MAX_TURNS
      ? AI_FOLLOWUPS[Math.min(newTurns - 1, AI_FOLLOWUPS.length - 1)]
      : null; /* no AI reply on final turn — conversation ends */

    setChatMsgs(prev => [
      ...prev,
      { role: "student", text: msg },
      ...(aiReply ? [{ role: "ai" as const, text: aiReply }] : []),
    ]);
  };

  /* ── Evaluate reasoning ── */
  const handleEvaluate = async () => {
    if (!mcq) return;
    const explanation = chatMsgs
      .filter(m => m.role === "student")
      .map(m => m.text)
      .join(" | ");
    setEvaluating(true); setEvalError(null);
    try {
      const result = await evaluateReasoning({
        courseId,
        question: mcq.question,
        options: mcq.options.map(o => o.text),
        correctIndex: mcq.correctIndex,
        selectedIndex: selected ?? 0,
        studentExplanation: explanation || "(no explanation provided)",
      });
      setSignal(result);
      setScreen("result");
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : "Evaluation failed.");
    } finally {
      setEvaluating(false);
    }
  };

  /* ── Next question ── */
  const nextQuestion = () => {
    const nextIdx = qIndex + 1;
    setQIndex(nextIdx);
    setScreen("loading");
    setLoadError(null);
    setSlideSasUrl(null);
    setSlideLoaded(false);
    setChatMsgs([]);
    setChatTurns(0);
    setSignal(null);

    fetch(`${API_URL}/api/mcq/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, pdfUrl: pdfUrl || undefined, courseTitle }),
    })
      .then(async (res) => {
        if (!res.ok) { setLoadError(`Error ${res.status}`); setScreen("question"); return; }
        const q: MCQQuestion = await res.json();
        setQuestions(prev => { const next = [...prev]; next[nextIdx] = q; return next; });
        setAnswers(prev => { const next = [...prev]; next[nextIdx] = null; return next; });
        setScreen("question");
        if (q.mcqId && q.slideImageUrl) {
          getSlideSasUrl(q.courseId, q.mcqId)
            .then(({ sasUrl }) => setSlideSasUrl(sasUrl))
            .catch(() => setSlideSasUrl(DEMO_SLIDE_URL));
        } else {
          setSlideSasUrl(DEMO_SLIDE_URL);
        }
      })
      .catch(() => { setScreen("question"); });
  };

  /* ── Previous question ── */
  const prevQuestion = () => {
    if (qIndex === 0) return;
    const prevIdx = qIndex - 1;
    setQIndex(prevIdx);
    setSlideSasUrl(null);
    setSlideLoaded(false);
    setChatMsgs([]);
    setChatTurns(0);
    setSignal(null);
    const prevScreen = answers[prevIdx] !== null ? "answered" : "question";
    setScreen(prevScreen);
  };

  /* ── Header (shared) ── */
  const Header = () => (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        {qIndex > 0
          ? <button className={styles.backBtn} onClick={prevQuestion}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              {ui.prevQuestion ?? "Previous question"}
            </button>
          : <button className={styles.backBtn} onClick={() => router.back()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              {ui.backToCourse ?? "Back to course"}
            </button>
        }
      </div>
      <div className={styles.headerCenter}>
        <span className={styles.headerEyebrow}>{ui.eyebrow}</span>
        <span className={styles.headerTitle}>{courseTitle}</span>
      </div>
      <div className={styles.headerRight}>
        <span className={styles.qCounter}>Q{qIndex + 1}</span>
      </div>
    </header>
  );

  /* ── Full-page loading/waiting ── */
  if (screen === "loading" || screen === "waiting") {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.loadingPage}>
          <div className={styles.loadingWrap}>
            <div className={styles.loadingLabel}>
              {screen === "waiting" ? (ui.preparingQuestions ?? "Preparing…") : (ui.generating ?? "Generating…")}
            </div>
            <div className={styles.loadingDots}><span /><span /><span /></div>
            <div className={styles.loadingHint}>
              {screen === "waiting" ? (ui.preparingHint ?? "Analysing document…") : (ui.generatingHint ?? "Reading with AI")}
            </div>
            {screen === "waiting" && <div className={styles.retryHint}>{ui.retryHint ?? "Checking again…"}</div>}
          </div>
        </div>
      </div>
    );
  }

  /* ── Slide pane (shared for question / answered / chat / result screens) ── */
  const SlidePaneContent = () => (
    <div className={styles.slidePane} style={{ width: `${slideWidth}%` }}>
      {mcq?.pageNumber !== undefined && (
        <div className={styles.slidePageBadge}>{ui.slidePage ?? "Page"} {mcq.pageNumber + 1}</div>
      )}
      {slideSasUrl && !slideLoaded && (
        <div className={styles.slideLoadingWrap}><div className={styles.loadingDots}><span /><span /><span /></div></div>
      )}
      {slideSasUrl && (
        <img
          src={slideSasUrl}
          alt={`Slide ${(mcq?.pageNumber ?? 0) + 1}`}
          className={styles.slideImg}
          style={{ display: slideLoaded ? "block" : "none" }}
          onLoad={() => setSlideLoaded(true)}
        />
      )}
      {!slideSasUrl && (
        <div className={styles.slideLoadingWrap}><div className={styles.loadingDots}><span /><span /><span /></div></div>
      )}
    </div>
  );

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.body} ref={bodyRef}>
        <SlidePaneContent />

        {/* ── Drag divider ── */}
        <div ref={dividerRef} className={styles.divider} onMouseDown={onMouseDown} title="Drag to resize">
          <div className={styles.dividerHandle}>
            <span /><span /><span /><span /><span /><span />
          </div>
        </div>

        {/* ── QUESTION screen ── */}
        {screen === "question" && (
          <div className={styles.questionPane}>
            {loadError && <div className={styles.errorBanner}>{loadError}</div>}
            {mcq && (
              <>
                <div className={styles.questionWrap}>
                  <div className={styles.questionLabel}>{ui.questionLabel}</div>
                  <h1 className={styles.question}>{mcq.question}</h1>
                </div>
                <div className={styles.options}>
                  {mcq.options.map((opt, i) => (
                    <button
                      key={i}
                      className={[styles.option, selected === i ? styles.optSelected : ""].join(" ")}
                      onClick={() => pick(i)}
                    >
                      <span className={styles.optLetter}>{LETTERS[i]}</span>
                      <span className={styles.optText}>{opt.text}</span>
                    </button>
                  ))}
                </div>
                <div className={styles.actions}>
                  <button className={styles.ghostBtn} onClick={() => router.back()}>{ui.backToWorkspace}</button>
                  <button
                    className={`${styles.submitBtn} ${selected === null ? styles.submitDisabled : ""}`}
                    onClick={handleSubmit}
                    disabled={selected === null}
                  >
                    {ui.submitAnswer}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ANSWERED screen — full recap ── */}
        {screen === "answered" && mcq && (
          <div className={styles.questionPane}>
            <div className={`${styles.resultBanner} ${isCorrect ? styles.bannerCorrect : styles.bannerWrong}`}>
              <div className={styles.resultIconWrap}>
                <span className={styles.resultIcon}>{isCorrect ? "✓" : "✗"}</span>
              </div>
              <div>
                <div className={styles.resultTitle}>{isCorrect ? ui.correctTitle : ui.incorrectTitle}</div>
                <div className={styles.resultSub}>
                  {isCorrect ? ui.correctSub : `${ui.incorrectPrefix} "${mcq.options[mcq.correctIndex].text}"`}
                </div>
              </div>
            </div>

            {/* Full question recap */}
            <div className={styles.recapQuestion}>{mcq.question}</div>

            {/* All options with full highlighting */}
            <div className={styles.options}>
              {mcq.options.map((opt, i) => {
                const isCorrectOpt = i === mcq.correctIndex;
                const isSelectedOpt = i === selected;
                const isWrong = isSelectedOpt && !isCorrectOpt;
                return (
                  <div
                    key={i}
                    className={[
                      styles.optionStatic,
                      isCorrectOpt ? styles.optCorrect : "",
                      isWrong ? styles.optWrong : "",
                      isSelectedOpt && isCorrectOpt ? styles.optCorrect : "",
                    ].join(" ")}
                  >
                    <span className={styles.optLetter}>{LETTERS[i]}</span>
                    <span className={styles.optText}>{opt.text}</span>
                    {isCorrectOpt && <span className={styles.optMark}>✓</span>}
                    {isWrong      && <span className={styles.optMark}>✗</span>}
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            <div className={styles.explanationSection}>
              <div className={styles.sectionLabel}>{ui.whyMatters}</div>
              <p className={styles.explanationText}>{mcq.explanation}</p>
            </div>

            <div className={styles.answeredActions}>
              <button className={styles.ghostBtn} onClick={() => router.back()}>{ui.backToWorkspace}</button>
              <div className={styles.answeredActionsRight}>
                <button className={styles.skipBtn} onClick={nextQuestion}>{ui.skipToNext ?? "Next question →"}</button>
                <button className={styles.submitBtn} onClick={startChat}>{ui.discussWithAI ?? "Discuss with AI →"}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── CHAT screen ── */}
        {screen === "chat" && mcq && (
          <div className={styles.questionPane}>

            {/* Full question + all options — always visible */}
            <div className={styles.chatQuestionBlock}>
              <div className={`${styles.chatResultBadge} ${isCorrect ? styles.badgeCorrect : styles.badgeWrong}`}>
                {isCorrect ? "✓ Correct" : "✗ Incorrect"}
              </div>
              <div className={styles.chatQuestionText}>{mcq.question}</div>
              <div className={styles.chatOptions}>
                {mcq.options.map((opt, i) => {
                  const isCorrectOpt = i === mcq.correctIndex;
                  const isSelectedOpt = i === selected;
                  const isWrong = isSelectedOpt && !isCorrectOpt;
                  return (
                    <div
                      key={i}
                      className={[
                        styles.chatOption,
                        isCorrectOpt ? styles.optCorrect : "",
                        isWrong ? styles.optWrong : "",
                        isSelectedOpt && !isCorrectOpt ? "" : "",
                        !isCorrectOpt && !isWrong ? styles.chatOptDimmed : "",
                      ].join(" ")}
                    >
                      <span className={styles.optLetter}>{LETTERS[i]}</span>
                      <span className={styles.optText}>{opt.text}</span>
                      {isCorrectOpt  && <span className={styles.optMark}>✓</span>}
                      {isWrong       && <span className={styles.optMark}>✗</span>}
                      {isSelectedOpt && isCorrectOpt && <span className={styles.optMark}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat thread */}
            <div className={styles.chatThread}>
              {chatMsgs.map((msg, i) => (
                <div key={i} className={msg.role === "ai" ? styles.chatAI : styles.chatStudent}>
                  <span className={styles.chatSender}>{msg.role === "ai" ? "AI Tutor" : (ui.you ?? "You")}</span>
                  {msg.text}
                </div>
              ))}
              {/* End-of-conversation warning */}
              {chatTurns >= MAX_TURNS && (
                <div className={styles.chatEndWarning}>
                  {ui.chatEnded ?? "You've reached the end of the discussion. Get your evaluation below."}
                </div>
              )}
            </div>

            {/* Input — disabled when max turns reached */}
            {chatTurns < MAX_TURNS && (
              <div className={styles.chatInputWrap}>
                <div className={styles.chatTurnCounter}>
                  {chatTurns}/{MAX_TURNS} {ui.turns ?? "exchanges"}
                </div>
                <textarea
                  className={styles.chatInput}
                  placeholder={ui.explainPlaceholder ?? "Type your response…"}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  rows={3}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && chatInput.trim()) { e.preventDefault(); sendChat(); } }}
                />
                {evalError && <div className={styles.errorBanner}>{evalError}</div>}
              </div>
            )}

            <div className={styles.answeredActions}>
              <button className={styles.ghostBtn} onClick={nextQuestion}>{ui.skipEvaluation ?? "Skip"}</button>
              <div className={styles.answeredActionsRight}>
                {chatTurns >= 1 && (
                  <button
                    className={`${styles.skipBtn} ${evaluating ? styles.submitDisabled : ""}`}
                    onClick={handleEvaluate}
                    disabled={evaluating}
                  >
                    {evaluating ? "…" : (ui.evaluateBtn ?? "Get evaluation →")}
                  </button>
                )}
                {chatTurns < MAX_TURNS && (
                  <button
                    className={`${styles.submitBtn} ${!chatInput.trim() ? styles.submitDisabled : ""}`}
                    onClick={sendChat}
                    disabled={!chatInput.trim()}
                  >
                    {ui.send ?? "Send →"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT screen ── */}
        {screen === "result" && mcq && signal && (
          <div className={styles.questionPane}>
            <div className={`${styles.signalBanner} ${styles[`signal${signal.signal.replace(/ /g, "")}`]}`}>
              <div className={styles.signalLabel}>{ui.reasoningSignal ?? "Reasoning signal"}</div>
              <div className={styles.signalValue}>{signal.signal}</div>
              <div className={styles.signalConfidence}>{ui.confidence ?? "Confidence"}: {signal.confidence}</div>
            </div>

            <div className={styles.recapSection}>
              <div className={styles.sectionLabel}>{ui.feedbackForYou ?? "Feedback for you"}</div>
              <p className={styles.feedbackText}>{signal.studentFeedback}</p>
            </div>

            <div className={styles.explanationSection}>
              <div className={styles.sectionLabel}>{ui.whyMatters}</div>
              <p className={styles.explanationText}>{mcq.explanation}</p>
            </div>

            <div className={styles.facultySection}>
              <div className={styles.sectionLabel}>{ui.facultyInsight ?? "Faculty insight"}</div>
              <p className={styles.facultyText}>{signal.facultyInsight}</p>
            </div>

            <div className={styles.answeredActions}>
              <button className={styles.ghostBtn} onClick={() => router.back()}>{ui.backToWorkspace}</button>
              <button className={styles.submitBtn} onClick={nextQuestion}>{ui.nextQuestion ?? "Next question →"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MCQPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--surface-low)", minHeight: "100vh" }} />}>
      <MCQContent />
    </Suspense>
  );
}
