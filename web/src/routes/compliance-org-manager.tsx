import { createFileRoute } from "@tanstack/react-router";
import { useKeycloak } from "@react-keycloak/web";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const deepEqual = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
import { apiClient } from "../lib/api-client";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

import type {
  CompliancePolicyResponse,
  ComplianceImportResponse,
  ComplianceQuizResponse,
  QuizQuestionDraft,
  QuizQuestion,
  QuizSettings,
} from "../components/compliance-org-manager/types";

import PolicyEditor from "../components/compliance-org-manager/PolicyEditor";
import PolicyPreviewModal from "../components/compliance-org-manager/PolicyPreviewModal";
import QuizEditor from "../components/compliance-org-manager/QuizEditor";

export const Route = createFileRoute("/compliance-org-manager")({
  component: ComplianceOrgManager,
});

function ComplianceOrgManager() {
  const { keycloak } = useKeycloak();

  const realm = useMemo(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
  }, [keycloak.tokenParsed]);

  // ── state ──────────────────────────────────────────────────────────────────
  const [policy, setPolicy] = useState<CompliancePolicyResponse | null>(null);
  const [policyDraft, setPolicyDraft] = useState("");
  const [quiz, setQuiz] = useState<ComplianceQuizResponse | null>(null);
  const [quizDraft, setQuizDraft] = useState<QuizQuestionDraft[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({ question_count: 5, passing_score: 80 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importingPolicy, setImportingPolicy] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [policyCollapsed, setPolicyCollapsed] = useState(true);
  const [quizCollapsed, setQuizCollapsed] = useState(true);

  // ── dirty tracking ──────────────────────────────────────────────────────────
  const savedPolicyRef = useRef("");
  const savedQuizDraftRef = useRef<QuizQuestionDraft[]>([]);
  const savedQuizSettingsRef = useRef<QuizSettings>({ question_count: 5, passing_score: 80 });
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(() => new Set());

  // ── derived ────────────────────────────────────────────────────────────────
  const policyUpdated = policy?.updated_at ? new Date(policy.updated_at).toLocaleString() : "Unknown";
  const quizUpdated = quiz?.updated_at ? new Date(quiz.updated_at).toLocaleString() : "Unknown";

  const policyDirty = policyDraft !== savedPolicyRef.current;
  const quizDirty = !deepEqual(
    quizDraft.map(({ local_id: _, ...rest }) => rest),
    savedQuizDraftRef.current.map(({ local_id: _, ...rest }) => rest)
  ) || !deepEqual(quizSettings, savedQuizSettingsRef.current);
  const hasPendingChanges = policyDirty || quizDirty;
  const maxQuestionCount = Math.max(1, quizDraft.length);

  const scoreOptionsForCount = useCallback((count: number) => {
    const safeCount = Math.max(1, count);
    const raw = new Set<number>();
    for (let i = 0; i <= safeCount; i += 1) raw.add(Math.floor((i / safeCount) * 100));
    return Array.from(raw).sort((a, b) => a - b);
  }, []);

  const possiblePassingScores = useMemo(
    () => scoreOptionsForCount(quizSettings.question_count || 1),
    [quizSettings.question_count, scoreOptionsForCount]
  );

  const createLocalId = useCallback(() => {
    const cryptoObj = (globalThis as typeof globalThis & { crypto?: Crypto }).crypto;
    if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
    if (cryptoObj?.getRandomValues) {
      const buf = new Uint32Array(2);
      cryptoObj.getRandomValues(buf);
      return `q-${Date.now()}-${Array.from(buf).map((n) => n.toString(36)).join("").slice(0, 8)}`;
    }
    return `q-${Date.now()}`;
  }, []);

  const scoreForWrongCount = useCallback(
    (prevCount: number, prevScore: number, nextCount: number) => {
      const safePrev = Math.max(1, prevCount);
      const safeNext = Math.max(1, nextCount);
      const prevCorrect = Math.round((safePrev * prevScore) / 100);
      const prevWrong = Math.max(0, safePrev - prevCorrect);
      const nextCorrect = Math.max(0, safeNext - prevWrong);
      const rawScore = Math.floor((nextCorrect / safeNext) * 100);
      const options = scoreOptionsForCount(safeNext);
      if (options.includes(rawScore)) return rawScore;
      return options.reduce(
        (closest, current) => Math.abs(current - rawScore) < Math.abs(closest - rawScore) ? current : closest,
        options[0]
      );
    },
    [scoreOptionsForCount]
  );

  // ── data loading ───────────────────────────────────────────────────────────
  const loadCompliance = useCallback(async () => {
    if (!realm) return;
    setLoading(true);
    try {
      const [policyRes, quizRes] = await Promise.all([
        apiClient.get<CompliancePolicyResponse>(`/org-manager/${encodeURIComponent(realm)}/compliance/policy`),
        apiClient.get<ComplianceQuizResponse>(`/org-manager/${encodeURIComponent(realm)}/compliance/quiz`),
      ]);
      setPolicy(policyRes);
      const policyContent = policyRes.content_md || "";
      setPolicyDraft(policyContent);
      savedPolicyRef.current = policyContent;

      setQuiz(quizRes);
      const quizDraftData = (quizRes.question_bank || []).map((q) => ({ ...q, local_id: createLocalId() }));
      setQuizDraft(quizDraftData);
      savedQuizDraftRef.current = quizDraftData;

      const initialCount = Math.min(Math.max(1, quizRes.question_count || 1), Math.max(1, quizRes.question_bank?.length || 1));
      const scores = new Set(scoreOptionsForCount(initialCount));
      const initialSettings = {
        question_count: initialCount,
        passing_score: scores.has(quizRes.passing_score || 80) ? (quizRes.passing_score || 80) : Math.min(...Array.from(scores)),
      };
      setQuizSettings(initialSettings);
      savedQuizSettingsRef.current = initialSettings;
    } catch (err) {
      console.error(err);
      toast.error("Failed to load compliance configuration.");
    } finally {
      setLoading(false);
    }
  }, [realm, scoreOptionsForCount, createLocalId]);

  useEffect(() => {
    if (!keycloak.authenticated) return;
    loadCompliance().catch(console.error);
  }, [keycloak.authenticated, loadCompliance]);

  // ── save all handler ───────────────────────────────────────────────────────
  const saveAll = async () => {
    if (!realm) return;
    setSaving(true);
    const errors: string[] = [];

    // Save policy
    if (policyDirty) {
      if (!policyDraft.trim()) {
        errors.push("Policy Markdown cannot be empty.");
      } else {
        try {
          const resp = await apiClient.put<CompliancePolicyResponse>(
            `/org-manager/${encodeURIComponent(realm)}/compliance/policy`,
            { content_md: policyDraft }
          );
          setPolicy(resp);
          setPolicyDraft(resp.content_md);
          savedPolicyRef.current = resp.content_md;
        } catch (err) {
          console.error(err);
          errors.push("Failed to update policy.");
        }
      }
    }

    // Save quiz
    if (quizDirty) {
      if (!quizDraft.length) {
        errors.push("Quiz question bank cannot be empty.");
      } else {
        try {
          const resp = await apiClient.put<ComplianceQuizResponse>(
            `/org-manager/${encodeURIComponent(realm)}/compliance/quiz`,
            {
              question_bank: quizDraft.map(({ id, prompt, options, answer_index, feedback }) => ({ id, prompt, options, answer_index, feedback })),
              question_count: quizSettings.question_count,
              passing_score: quizSettings.passing_score,
            }
          );
          setQuiz(resp);
          const newQuizDraft = (resp.question_bank || []).map((q) => ({ ...q, local_id: createLocalId() }));
          setQuizDraft(newQuizDraft);
          savedQuizDraftRef.current = newQuizDraft;
          const newSettings = {
            question_count: Math.min(Math.max(1, resp.question_count), Math.max(1, resp.question_bank?.length || 1)),
            passing_score: resp.passing_score,
          };
          setQuizSettings(newSettings);
          savedQuizSettingsRef.current = newSettings;
        } catch (err) {
          console.error(err);
          errors.push("Failed to update quiz.");
        }
      }
    }

    if (errors.length) {
      toast.error(errors.join(" "));
    } else {
      toast.success(policyDirty && quizDirty ? "Policy and quiz updated successfully." : policyDirty ? "Policy updated successfully." : "Quiz updated successfully.");
    }
    setSaving(false);
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !realm) { if (!realm) toast.error("Realm not resolved."); return; }
    setImportingPolicy(true);
    try {
      const filename = file.name.toLowerCase();
      if (filename.endsWith(".md") || filename.endsWith(".markdown")) {
        const text = await file.text();
        if (!text.trim()) { toast.error("Markdown file is empty."); return; }
        setPolicyDraft(text);
        toast.success("File imported. Review and click Save All.");
        return;
      }
      if (filename.endsWith(".pdf") || file.type === "application/pdf") {
        const formData = new FormData();
        formData.append("file", file);
        const resp = await apiClient.post<ComplianceImportResponse>(
          `/org-manager/${encodeURIComponent(realm)}/compliance/policy/import`,
          formData
        );
        if (!resp.content_md?.trim()) { toast.error("Imported PDF has no usable text."); return; }
        setPolicyDraft(resp.content_md);
        toast.success("PDF imported. Review and click Save All.");
        return;
      }
      toast.error("Unsupported file type. Upload PDF or Markdown.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to import file.");
    } finally {
      setImportingPolicy(false);
    }
  };

  // ── quiz handlers ──────────────────────────────────────────────────────────

  const updateQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    setQuizDraft((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      if (patch.options) {
        const maxIndex = Math.max(0, patch.options.length - 1);
        if (next[index].answer_index > maxIndex) next[index].answer_index = maxIndex;
      }
      return next;
    });
  };

  const addQuestion = () => {
    const localId = createLocalId();
    setQuizDraft((prev) => [...prev, { id: `q-${Date.now()}`, local_id: localId, prompt: "", options: ["", ""], answer_index: 0, feedback: "" }]);
    setExpandedQuestions((cur) => new Set(cur).add(localId));
  };

  const removeQuestion = (index: number) => {
    const removedId = quizDraft[index]?.local_id;
    setQuizDraft((prev) => prev.filter((_, idx) => idx !== index));
    if (removedId) {
      setExpandedQuestions((cur) => {
        if (!cur.has(removedId)) return cur;
        const next = new Set(cur);
        next.delete(removedId);
        return next;
      });
    }
  };

  const toggleQuestion = (localId: string) => {
    setExpandedQuestions((cur) => {
      const next = new Set(cur);
      next.has(localId) ? next.delete(localId) : next.add(localId);
      return next;
    });
  };

  const addOption = (index: number) => updateQuestion(index, { options: [...quizDraft[index].options, ""] });

  const removeOption = (qIndex: number, optIndex: number) => {
    const question = quizDraft[qIndex];
    if (question.options.length <= 2) { toast.error("Each question must keep at least two options."); return; }
    updateQuestion(qIndex, { options: question.options.filter((_, idx) => idx !== optIndex) });
  };

  const handleQuestionCountChange = (delta: 1 | -1) => {
    setQuizSettings((prev) => {
      const nextCount = Math.min(maxQuestionCount, Math.max(1, prev.question_count + delta));
      return { question_count: nextCount, passing_score: scoreForWrongCount(prev.question_count, prev.passing_score, nextCount) };
    });
  };

  const handlePassingScoreChange = (delta: 1 | -1) => {
    setQuizSettings((prev) => {
      const options = scoreOptionsForCount(prev.question_count);
      const nextIndex = Math.min(options.length - 1, Math.max(0, options.indexOf(prev.passing_score) + delta));
      return { ...prev, passing_score: options[nextIndex] };
    });
  };

  // ── panel toggles ──────────────────────────────────────────────────────────

  const CLOSE_DURATION_MS = 250; // matches exit transition duration

  const handleTogglePolicy = () => {
    if (policyCollapsed && !quizCollapsed) {
      // opening policy, quiz is open: close quiz first
      setQuizCollapsed(true);
      setTimeout(() => {
        setPolicyCollapsed(false);
      }, CLOSE_DURATION_MS);
    } else {
      // just toggle policy
      setPolicyCollapsed((c) => !c);
    }
  };

  const handleToggleQuiz = () => {
    if (quizCollapsed && !policyCollapsed) {
      // opening quiz, policy is open: close policy first
      setPolicyCollapsed(true);
      setTimeout(() => {
        setQuizCollapsed(false);
      }, CLOSE_DURATION_MS);
    } else {
      // just toggle quiz
      setQuizCollapsed((c) => !c);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  if (loading) return <div className="p-6 text-sm text-gray-500">Loading compliance data…</div>;

  return (
    <div className="px-6 py-4 flex flex-col gap-6 h-full overflow-hidden">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4 flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-slate-700">Compliance Management</h1>
          <p className="text-sm text-slate-500">
            Update your organization&apos;s compliance policy and quiz. Changes will require members to re-accept the policy.
          </p>
        </div>
        <button
          data-testid="save-quiz-btn"
          className={`px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors disabled:opacity-60 ${hasPendingChanges
            ? "bg-purple-700 text-white hover:bg-purple-800"
            : "bg-gray-200 text-gray-500 hover:bg-gray-300"
            }`}
          onClick={saveAll}
          disabled={saving || !hasPendingChanges}
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving…</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span>Save All</span>
            </div>
          )}
        </button>
      </div>

      <PolicyEditor
        policyDraft={policyDraft}
        policyUpdated={policyUpdated}
        importingPolicy={importingPolicy}
        collapsed={policyCollapsed}
        onToggleCollapse={handleTogglePolicy}
        onDraftChange={setPolicyDraft}
        onImportFile={handleImportFile}
        onOpenPreview={() => setShowPreviewModal(true)}
      />

      <QuizEditor
        quizDraft={quizDraft}
        quizSettings={quizSettings}
        quizUpdated={quizUpdated}
        collapsed={quizCollapsed}
        onToggleCollapse={handleToggleQuiz}
        maxQuestionCount={maxQuestionCount}
        possiblePassingScores={possiblePassingScores}
        expandedQuestions={expandedQuestions}
        onQuestionCountChange={handleQuestionCountChange}
        onPassingScoreChange={handlePassingScoreChange}
        onToggleQuestion={toggleQuestion}
        onUpdateQuestion={updateQuestion}
        onRemoveQuestion={removeQuestion}
        onAddOption={addOption}
        onRemoveOption={removeOption}
        onAddQuestion={addQuestion}
      />

      {showPreviewModal && (
        <PolicyPreviewModal
          policyDraft={policyDraft}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}
