import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";
import { apiClient } from "../../lib/api-client";

import type {
    ComplianceDoc,
    QuizPayload,
    SubmitResponse,
    StatusResponse,
    Step,
} from "./types";

import ComplianceHeader from "./ComplianceHeader";
import ComplianceReadStep from "./ComplianceReadStep";
import ComplianceQuizStep from "./ComplianceQuizStep";
import ComplianceConfirmStep from "./ComplianceConfirmStep";

const LOCAL_STORAGE_KEY = "compliance-quiz-failure";

function slugify(text: string) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

const persistFailure = (
    quizVersion: string,
    failureResult: SubmitResponse,
    cooldownUntilTs: number,
    baseCooldown: number
) => {
    if (typeof window === "undefined") return;
    const remaining = Math.max(0, Math.ceil((cooldownUntilTs - Date.now()) / 1000));
    localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
            version: quizVersion,
            result: failureResult,
            cooldownUntil: cooldownUntilTs,
            cooldownBase: Math.max(0, remaining || baseCooldown),
        })
    );
};

const clearPersistedFailure = () => {
    if (typeof window !== "undefined") localStorage.removeItem(LOCAL_STORAGE_KEY);
};

export default function ComplianceFlow() {
    const { keycloak, initialized } = useKeycloak();

    // ── portal refs ─────────────────────────────────────────────────────────────
    const portalRef = useRef<HTMLElement | null>(null);
    const ownsPortalRef = useRef(false);
    const createdPortalRef = useRef(false);
    const [canRenderPortal, setCanRenderPortal] = useState(false);

    // ── data state ───────────────────────────────────────────────────────────────
    const [status, setStatus] = useState<StatusResponse | null>(null);
    const [doc, setDoc] = useState<ComplianceDoc | null>(null);
    const [quiz, setQuiz] = useState<QuizPayload | null>(null);
    const [step, setStep] = useState<Step>("read");
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<SubmitResponse | null>(null);
    const [attest, setAttest] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [toc, setToc] = useState<Array<{ id: string; title: string }>>([]);
    const [nowTick, setNowTick] = useState<number>(Date.now());
    const [cooldownBase, setCooldownBase] = useState<number>(0);

    // ── derived values ───────────────────────────────────────────────────────────
    const hasQuiz = !!quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0;
    const hasDocContent = !!doc?.content && doc.content.trim().length > 0;

    const answeredCount = useMemo(() => {
        if (!hasQuiz || !quiz?.questions) return 0;
        return quiz.questions.reduce(
            (count, q) => (answers[q.id] !== undefined ? count + 1 : count),
            0
        );
    }, [answers, hasQuiz, quiz?.questions]);

    const remainingCooldown = useMemo(() => {
        if (!cooldownUntil) return 0;
        return Math.max(0, Math.ceil((cooldownUntil - nowTick) / 1000));
    }, [cooldownUntil, nowTick]);

    const cooldownProgress = useMemo(() => {
        if (!cooldownBase || cooldownBase <= 0) return 0;
        return Math.max(0, Math.min(1, remainingCooldown / cooldownBase));
    }, [cooldownBase, remainingCooldown]);

    const realmRoles = useMemo(() => {
        const roles = (keycloak.tokenParsed?.realm_access?.roles || []).map((r) =>
            String(r).toLowerCase()
        );
        return new Set(roles);
    }, [keycloak.tokenParsed]);

    const isAdminContext =
        typeof window !== "undefined" &&
        (location.pathname.startsWith("/admin") ||
            keycloak.tokenParsed?.iss?.includes("/realms/master") ||
            realmRoles.has("admin"));
    const isOrgManager = realmRoles.has("org_manager");

    // ── portal setup ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const existing = document.getElementById("compliance-modal-root");
        const node = existing ?? document.createElement("div");
        if (!existing) {
            node.id = "compliance-modal-root";
            document.body.appendChild(node);
            createdPortalRef.current = true;
        }
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

    // ── ToC builder ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!hasDocContent || !doc?.content) { setToc([]); return; }
        const next: Array<{ id: string; title: string }> = [];
        doc.content.split(/\r?\n/).forEach((line) => {
            if (line.startsWith("## ")) {
                const title = line.replace(/^##\s+/, "").trim();
                next.push({ id: `sec-${slugify(title)}`, title });
            }
        });
        setToc(next);
    }, [doc?.content, hasDocContent]);

    // ── clock tick for cooldown countdown ────────────────────────────────────────
    useEffect(() => {
        const timer = setInterval(() => setNowTick(Date.now()), 500);
        return () => clearInterval(timer);
    }, []);

    // ── data loading ─────────────────────────────────────────────────────────────
    const loadStatusAndData = async () => {
        setLoading(true);
        try {
            const [statusRes, docRes, quizRes] = await Promise.all([
                apiClient.get<StatusResponse>("/compliance/status"),
                apiClient.get<ComplianceDoc>("/compliance/latest"),
                apiClient.get<QuizPayload>("/compliance/latest/quiz"),
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
        if (isAdminContext || isOrgManager) return;
        void loadStatusAndData();
    }, [initialized, keycloak.authenticated]);

    useEffect(() => {
        if (result?.cooldown_seconds_remaining && !result.passed) {
            if (cooldownUntil && cooldownUntil > Date.now()) return;
            const base = result.cooldown_seconds_remaining;
            const until = Date.now() + base * 1000;
            setCooldownBase(base);
            setCooldownUntil(until);
            if (quiz) persistFailure(quiz.version, result, until, base);
        } else if (result?.passed) {
            setCooldownUntil(null);
            setCooldownBase(0);
            clearPersistedFailure();
        }
    }, [result, quiz, cooldownUntil]);

    // ── submit handlers ──────────────────────────────────────────────────────────
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
                answers: quiz.questions.map((q) => ({ id: q.id, choice: answers[q.id] })),
            };
            const resp = await apiClient.post<SubmitResponse>("/compliance/submit", payload);
            setResult(resp);
            if (resp.passed) setStep("confirm");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Quiz submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAccept = async () => {
        if (!doc || !result) return;
        if (!attest) { setError("Please confirm you agree to the policy."); return; }
        setSubmitting(true);
        setError(null);
        try {
            await apiClient.post("/compliance/accept", { version: doc.version, score: result.score });
            setStep("done");
            setStatus({ required_version: doc.version, accepted: true, accepted_at: new Date().toISOString(), score: result.score });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Could not record acceptance. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStartQuiz = () => {
        if (!hasQuiz) { setError("Quiz is still loading. Please wait and try again."); return; }
        setAnswers({});
        setResult(null);
        setStep("quiz");
    };

    // ── early exits ──────────────────────────────────────────────────────────────
    if (isAdminContext || isOrgManager) return null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
        );
    }

    if (status?.accepted && step === "done") return null;

    if (error && step === "read" && !doc) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
        );
    }

    if (!canRenderPortal || !portalRef.current) return null;

    // ── modal ────────────────────────────────────────────────────────────────────
    const modalContent = (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="w-[90vw] max-w-5xl max-h-[90vh] bg-white rounded-t-md shadow-2xl overflow-hidden flex flex-col">
                <ComplianceHeader doc={doc} step={step} />

                <div className="flex-1 overflow-auto p-6 space-y-4">
                    {/* Error banner */}
                    {error && (
                        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
                            <AlertTriangle className="h-4 w-4 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {step === "read" && doc && (
                        <ComplianceReadStep
                            doc={doc}
                            toc={toc}
                            hasDocContent={hasDocContent}
                            hasQuiz={hasQuiz}
                            onNext={handleStartQuiz}
                        />
                    )}

                    {step === "quiz" && hasQuiz && quiz && (
                        <ComplianceQuizStep
                            quiz={quiz}
                            answers={answers}
                            answeredCount={answeredCount}
                            result={result}
                            remainingCooldown={remainingCooldown}
                            cooldownProgress={cooldownProgress}
                            submitting={submitting}
                            onAnswerChange={(qId, idx) => setAnswers((prev) => ({ ...prev, [qId]: idx }))}
                            onSubmit={handleQuizSubmit}
                            onReviewDoc={() => setStep("read")}
                            onRetake={(freshQuiz) => {
                                setAnswers({});
                                setResult(null);
                                setQuiz(freshQuiz);
                                setStep("quiz");
                            }}
                            clearPersistedFailure={clearPersistedFailure}
                        />
                    )}

                    {step === "confirm" && result && (
                        <ComplianceConfirmStep
                            result={result}
                            attest={attest}
                            submitting={submitting}
                            onAttestChange={setAttest}
                            onAccept={handleAccept}
                        />
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, portalRef.current);
}
