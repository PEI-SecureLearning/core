import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, BookOpen, CheckCircle2, Loader2, ShieldCheck, Timer, RotateCcw, ArrowUpRight } from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";
import ReactMarkdown from "react-markdown";
import apiClient from "../helper/header-injector";
import { useLocation } from "@tanstack/react-router";
import { isComplianceEligibleUser } from "@/lib/compliance-eligibility";

const LOCAL_STORAGE_KEY = "compliance-quiz-failure";

type ComplianceDoc = {
  version: string;
  title: string;
  updated_at: string;
  word_count: number;
  content: string;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
};

type QuizPayload = {
  version: string;
  required_score: number;
  question_count: number;
  cooldown_seconds: number;
  questions: QuizQuestion[];
};

type SubmitResponse = {
  passed: boolean;
  score: number;
  required_score: number;
  cooldown_seconds_remaining: number;
  feedback: { id: string; correct: boolean; feedback: string }[];
};

type StatusResponse = {
  required_version: string;
  accepted: boolean;
  accepted_at: string | null;
  score: number | null;
};

const STEPS: Array<"read" | "quiz" | "confirm" | "done"> = ["read", "quiz", "confirm", "done"];

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString();
}

export default function ComplianceFlow() {
  const { keycloak, initialized } = useKeycloak();
  const routerLocation = useLocation();
  const portalRef = useRef<HTMLElement | null>(null);
  const ownsPortalRef = useRef(false);
  const createdPortalRef = useRef(false);
  const [canRenderPortal, setCanRenderPortal] = useState(false);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [doc, setDoc] = useState<ComplianceDoc | null>(null);
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [step, setStep] = useState<"read" | "quiz" | "confirm" | "done">("read");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [attest, setAttest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizError] = useState<string | null>(null);
  const [toc, setToc] = useState<Array<{ id: string; title: string }>>([]);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [cooldownBase, setCooldownBase] = useState<number>(0);

  const hasQuiz = !!quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0;
  const hasDocContent = !!doc?.content && doc.content.trim().length > 0;
  const answeredCount = useMemo(() => {
    if (!hasQuiz || !quiz?.questions) return 0;
    return quiz.questions.reduce((count, q) => (answers[q.id] !== undefined ? count + 1 : count), 0);
  }, [answers, hasQuiz, quiz?.questions]);

  const remainingCooldown = useMemo(() => {
    if (!cooldownUntil) return 0;
    const diff = Math.max(0, Math.ceil((cooldownUntil - nowTick) / 1000));
    return diff;
  }, [cooldownUntil, nowTick]);

  const cooldownProgress = useMemo(() => {
    if (!cooldownBase || cooldownBase <= 0) return 0;
    return Math.max(0, Math.min(1, remainingCooldown / cooldownBase));
  }, [cooldownBase, remainingCooldown]);

  const persistFailure = (quizVersion: string, failureResult: SubmitResponse, cooldownUntilTs: number, baseCooldown: number) => {
    if (typeof window === "undefined") return;
    const remaining = Math.max(0, Math.ceil((cooldownUntilTs - Date.now()) / 1000));
    const payload = {
      version: quizVersion,
      result: failureResult,
      cooldownUntil: cooldownUntilTs,
      cooldownBase: Math.max(0, remaining || baseCooldown),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  };

  const clearPersistedFailure = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  // Ensure only one compliance modal renders at a time and render it via portal
  useEffect(() => {
    const existing = document.getElementById("compliance-modal-root");
    const node = existing ?? document.createElement("div");

    if (!existing) {
      node.id = "compliance-modal-root";
      document.body.appendChild(node);
      createdPortalRef.current = true;
    }

    // If another instance already marked the portal as active, skip rendering a duplicate
    if (node.dataset.active === "true" && !ownsPortalRef.current) {
      setCanRenderPortal(false);
      return;
    }

    node.dataset.active = "true";
    portalRef.current = node;
    ownsPortalRef.current = true;
    setCanRenderPortal(true);

    return () => {
      if (ownsPortalRef.current && portalRef.current) {
        portalRef.current.dataset.active = "false";
        if (createdPortalRef.current) {
          document.body.removeChild(portalRef.current);
        }
      }
    };
  }, []);

  const isEligibleUser = useMemo(
    () =>
      isComplianceEligibleUser({
        initialized,
        authenticated: !!keycloak.authenticated,
        tokenParsed: keycloak.tokenParsed,
        pathname: routerLocation.pathname,
      }),
    [initialized, keycloak.authenticated, keycloak.tokenParsed, routerLocation.pathname]
  );

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  useEffect(() => {
    if (!hasDocContent || !doc?.content) {
      setToc([]);
      return;
    }
    const lines = doc.content.split(/\r?\n/);
    const next: Array<{ id: string; title: string }> = [];
    lines.forEach((line) => {
      if (line.startsWith("## ")) {
        const title = line.replace(/^##\s+/, "").trim();
        const id = `sec-${slugify(title)}`;
        next.push({ id, title });
      }
    });
    setToc(next);
  }, [doc?.content, hasDocContent]);

  const markdownComponents = useMemo(
    () => ({
      h1: () => null,
      h2: ({ children }: { children?: React.ReactNode }) => {
        const text =
          typeof children === "string"
            ? children
            : Array.isArray(children)
              ? children.map((c) => (typeof c === "string" ? c : "")).join(" ")
              : String(children);
        const id = `sec-${slugify(text || "section")}`;
        return (
          <div id={id} className="mt-8 mb-3 border-b border-gray-200 pb-2 scroll-m-24">
            <p className="text-lg font-semibold text-gray-900">{children}</p>
          </div>
        );
      },
      h3: ({ children }: { children?: React.ReactNode }) => (
        <p className="mt-4 mb-2 text-base font-semibold text-gray-900">{children}</p>
      ),
      p: ({ children }: { children?: React.ReactNode }) => (
        <p className="text-sm text-gray-800 leading-6 mb-3">{children}</p>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800 mb-3">{children}</ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-800 mb-3">{children}</ol>
      ),
      li: ({ children }: { children?: React.ReactNode }) => <li className="leading-6">{children}</li>,
      table: ({ children }: { children?: React.ReactNode }) => (
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border border-gray-200 text-sm text-gray-800">{children}</table>
        </div>
      ),
      thead: ({ children }: { children?: React.ReactNode }) => (
        <thead className="bg-gray-50 text-gray-900 font-semibold">{children}</thead>
      ),
      tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
      tr: ({ children }: { children?: React.ReactNode }) => <tr className="border-b">{children}</tr>,
      th: ({ children }: { children?: React.ReactNode }) => (
        <th className="px-3 py-2 text-left border-r last:border-r-0">{children}</th>
      ),
      td: ({ children }: { children?: React.ReactNode }) => (
        <td className="px-3 py-2 align-top border-r last:border-r-0">{children}</td>
      ),
    }),
    []
  );

  const loadStatusAndData = async () => {
    setLoading(true);
    try {
      const [statusRes, docRes, quizRes] = await Promise.all([
        apiClient.get<StatusResponse>("/compliance/status").then((r) => r.data),
        apiClient.get<ComplianceDoc>("/compliance/latest").then((r) => r.data),
        apiClient.get<QuizPayload>("/compliance/latest/quiz").then((r) => r.data),
      ]);
      setStatus(statusRes);
      setDoc(docRes);
      setQuiz(quizRes);
      setAnswers({});
      setResult(null);
      if (statusRes.accepted && statusRes.required_version === docRes.version) {
        setStep("done");
        clearPersistedFailure();
        return;
      }

      // If there is a persisted failed attempt for the same version and still under cooldown, restore it
      if (typeof window !== "undefined") {
        const savedRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedRaw) {
          try {
            const saved = JSON.parse(savedRaw) as {
              version: string;
              result: SubmitResponse;
              cooldownUntil: number;
              cooldownBase: number;
            };
            const stillValid =
              saved.version === docRes.version &&
              saved.result &&
              !saved.result.passed &&
              saved.cooldownUntil > Date.now();
            if (stillValid) {
              setResult(saved.result);
              setCooldownBase(saved.cooldownBase);
              setCooldownUntil(saved.cooldownUntil);
              setStep("quiz");
            } else {
              clearPersistedFailure();
            }
          } catch {
            clearPersistedFailure();
          }
        }
      }
    } catch {
      setError("Unable to load compliance data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialized) return;
    if (!keycloak.authenticated || !keycloak.token) return;
    if (!isEligibleUser) return;
    void loadStatusAndData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, keycloak.authenticated, keycloak.token, isEligibleUser]);

  useEffect(() => {
    if (result?.cooldown_seconds_remaining && !result.passed) {
      // If we already have a future cooldown, keep it; if it's expired or missing, set a new one from server-provided seconds
      if (cooldownUntil && cooldownUntil > Date.now()) return;
      const base = result.cooldown_seconds_remaining;
      const until = Date.now() + base * 1000;
      setCooldownBase(base);
      setCooldownUntil(until);
      if (quiz) {
        persistFailure(quiz.version, result, until, base);
      }
    } else if (result?.passed) {
      setCooldownUntil(null);
      setCooldownBase(0);
      clearPersistedFailure();
    }
  }, [result, quiz, cooldownUntil]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  const handleQuizSubmit = async () => {
    if (!quiz || !hasQuiz) {
      setError("Quiz is not available yet. Please retry in a moment.");
      return;
    }
    const unanswered = quiz.questions?.find((q) => answers[q.id] === undefined);
    if (unanswered) {
      setError("Please answer all questions before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        version: quiz.version,
        answers: quiz.questions.map((q) => ({
          id: q.id,
          choice: answers[q.id],
        })),
      };
      const resp = await apiClient.post<SubmitResponse>("/compliance/submit", payload);
      setResult(resp.data);
      if (resp.data.passed) {
        setStep("confirm");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Quiz submission failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!doc || !result) return;
    if (!attest) {
      setError("Please confirm you agree to the policy.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post("/compliance/accept", {
        version: doc.version,
        score: result.score,
      });
      setStep("done");
      setStatus({
        required_version: doc.version,
        accepted: true,
        accepted_at: new Date().toISOString(),
        score: result.score,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not record acceptance. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isEligibleUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (status?.accepted && step === "done") {
    return null;
  }

  if (error && step === "read" && !doc) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        {error}
      </div>
    );
  }

  if (!canRenderPortal || !portalRef.current) {
    return null;
  }

  const modalContent = (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[90vw] max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white px-6 py-4 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5" />
          <div className="flex-1">
            <p className="text-sm uppercase tracking-wide text-white/80">Compliance Required</p>
            <h2 className="text-xl font-semibold">{doc?.title ?? "Compliance Policy"}</h2>
            {doc ? (
              <p className="text-xs text-white/70">
                Version {doc.version?.slice?.(0, 8) ?? ""} • Updated {formatDate(doc.updated_at)} •{" "}
                {doc.word_count} words
              </p>
            ) : (
              <p className="text-xs text-white/70">Loading compliance details…</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {STEPS.map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${step === s || STEPS.indexOf(step) > STEPS.indexOf(s) ? "bg-white" : "bg-white/40"
                    }`}
                />
                <span className="text-white/80 capitalize">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {(error || quizError) && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span>{error ?? quizError}</span>
            </div>
          )}

          {step === "read" && doc && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-purple-700 font-semibold">
                <BookOpen className="h-5 w-5" />
                <span>Review the policy</span>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-start">
                <div className="md:w-56 shrink-0 rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Jump to section</p>
                  {hasDocContent ? (
                    <div className="space-y-2 text-sm text-purple-700">
                      {(toc.length ? toc : []).map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => {
                            const el = document.getElementById(entry.id);
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }}
                          className="block w-full text-left hover:text-purple-900 cursor-pointer"
                        >
                          {entry.title}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Loading sections…</p>
                  )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 max-h-[55vh] overflow-y-auto w-full">
                  {hasDocContent ? (
                    <ReactMarkdown className="prose prose-sm max-w-none text-gray-800" components={markdownComponents}>
                      {doc.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Policy content unavailable. Please refresh or contact an administrator.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition disabled:opacity-60 cursor-pointer"
                  onClick={() => {
                    if (!hasQuiz) {
                      setError("Quiz is still loading. Please wait and try again.");
                      return;
                    }
                    // If failed and still in cooldown, stay on fail view
                    if (result && !result.passed && remainingCooldown > 0) {
                      setStep("quiz");
                      return;
                    }
                    // If failed but cooldown passed, keep fail view until retake is clicked
                    if (result && !result.passed && remainingCooldown === 0) {
                      setStep("quiz");
                      return;
                    }
                    // Normal start quiz: clear state and go to questions
                    setAnswers({});
                    setResult(null);
                    setStep("quiz");
                  }}
                  disabled={!hasQuiz}
                >
                  {hasQuiz ? "Start quiz" : "Loading quiz..."}
                </button>
              </div>
            </div>
          )}

          {step === "quiz" && hasQuiz && quiz && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-purple-700 font-semibold">
                  <ShieldCheck className="h-5 w-5" />
                  <span>Quiz — score at least {quiz.required_score}%</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <span className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                    {answeredCount}/{quiz.questions.length} answered
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                    Required: {quiz.required_score}%+
                  </span>
                  {remainingCooldown > 0 && (
                    <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                      Cooldown: {remainingCooldown}s
                    </span>
                  )}
                </div>
              </div>
              {result && !result.passed ? (
                <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/60 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-5 w-5" />
                      <div>
                        <p className="font-semibold">You didn’t pass this time</p>
                        <p className="text-sm">Score {result.score}% (need {result.required_score}%)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full border border-orange-200 bg-white/80 flex items-center justify-center text-xs font-semibold text-orange-700"
                        style={{
                          background: `conic-gradient(#fb923c ${cooldownProgress * 360}deg, #fde7d3 ${cooldownProgress * 360}deg 360deg)`,
                        }}
                      >
                        {remainingCooldown}s
                      </div>
                      <div className="px-2 py-1 rounded-full bg-white/70 text-orange-800 border border-orange-200 text-xs">
                        Try again in {remainingCooldown}s
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-orange-100 bg-white/70 p-3">
                    <p className="font-semibold text-sm text-gray-900 mb-2">What to review</p>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {result.feedback.map((f) => (
                        <li key={f.id} className={f.correct ? "text-green-800" : "text-orange-800"}>
                          {f.feedback}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="px-3 py-2 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 inline-flex items-center gap-2"
                      onClick={() => setStep("read")}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Review document
                    </button>
                    <button
                      className="px-3 py-2 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={async () => {
                        clearPersistedFailure();
                        setAnswers({});
                        setResult(null);
                        setResult(null);
                        const refreshed = await apiClient
                          .get<QuizPayload>("/compliance/latest/quiz")
                          .then((r) => r.data);
                        setQuiz(refreshed);
                        setStep("quiz");
                      }}
                      disabled={remainingCooldown > 0}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Retake quiz
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {quiz.questions?.map((q, idx) => (
                      <div key={q.id} className="rounded-xl border border-gray-200 p-4 shadow-sm bg-white">
                        <p className="font-semibold text-gray-900 mb-3">
                          {idx + 1}. {q.prompt}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const selected = answers[q.id] === optIdx;
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-start gap-3 rounded-lg border px-3 py-2 cursor-pointer transition ${selected
                                  ? "border-purple-500 bg-purple-50"
                                  : "border-transparent hover:bg-gray-50"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  className="mt-1 cursor-pointer accent-purple-600"
                                  name={q.id}
                                  value={optIdx}
                                  checked={selected}
                                  onChange={() =>
                                    setAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: optIdx,
                                    }))
                                  }
                                  disabled={remainingCooldown > 0}
                                />
                                <span className="text-sm text-gray-800">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {result && result.passed && (
                    <div className="rounded-xl border border-green-200 bg-green-50/80 text-green-800 px-4 py-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-semibold">Passed</span>
                      </div>
                      <p className="text-sm mt-1">Score {result.score}% (need {result.required_score}%)</p>
                      <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                        {result.feedback.map((f) => (
                          <li key={f.id} className={f.correct ? "text-green-800" : "text-green-800"}>
                            {f.feedback}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    {remainingCooldown > 0 ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Timer className="h-4 w-4" />
                        <span>Try again in {remainingCooldown}s</span>
                      </div>
                    ) : (
                      <div />
                    )}
                    <button
                      className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition disabled:opacity-60 cursor-pointer"
                      onClick={handleQuizSubmit}
                      disabled={submitting || remainingCooldown > 0}
                    >
                      {submitting ? "Submitting..." : "Submit quiz"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === "confirm" && result && (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Quiz passed</p>
                    <p className="text-sm">Your Score: {result.score}%. Please attest to finish.</p>
                  </div>
                </div>
              </div>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={attest}
                  onChange={(e) => setAttest(e.target.checked)}
                />
                <span className="text-sm text-gray-800">
                  I have read, understood, and will comply with this policy.
                </span>
              </label>
              <div className="flex justify-end">
                <button
                  className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition disabled:opacity-60"
                  onClick={handleAccept}
                  disabled={!attest || submitting}
                >
                  {submitting ? "Saving..." : "Confirm and continue"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalRef.current);
}
