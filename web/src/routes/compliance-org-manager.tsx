import { createFileRoute } from "@tanstack/react-router";
import { useKeycloak } from "@react-keycloak/web";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import apiClient from "@/helper/header-injector";

type CompliancePolicyResponse = {
  tenant: string;
  content_md: string;
  updated_at: string;
  updated_by?: string | null;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer_index: number;
  feedback: string;
};

type ComplianceQuizResponse = {
  tenant: string;
  question_bank: QuizQuestion[];
  question_count: number;
  passing_score: number;
  updated_at: string;
  updated_by?: string | null;
};

export const Route = createFileRoute("/compliance-org-manager")({
  component: ComplianceOrgManager,
});

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-semibold text-gray-900 mb-3">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm text-gray-800 leading-6 mb-3">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800 mb-3">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-800 mb-3">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-6">{children}</li>
  ),
  hr: () => <hr className="my-4 border-gray-200" />,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border border-gray-200 text-sm text-gray-800">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-gray-50 text-gray-900 font-semibold">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="border-b">{children}</tr>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-2 text-left border-r last:border-r-0">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-3 py-2 align-top border-r last:border-r-0">
      {children}
    </td>
  ),
};

function ComplianceOrgManager() {
  const { keycloak } = useKeycloak();
  const realm = useMemo(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
  }, [keycloak.tokenParsed]);

  const [policy, setPolicy] = useState<CompliancePolicyResponse | null>(null);
  const [policyDraft, setPolicyDraft] = useState("");
  const [quiz, setQuiz] = useState<ComplianceQuizResponse | null>(null);
  const [quizDraft, setQuizDraft] = useState<QuizQuestion[]>([]);
  const [quizSettings, setQuizSettings] = useState({
    question_count: 5,
    passing_score: 80,
  });
  const [loading, setLoading] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    () => new Set()
  );

  const policyUpdated = policy?.updated_at
    ? new Date(policy.updated_at).toLocaleString()
    : "Unknown";
  const quizUpdated = quiz?.updated_at
    ? new Date(quiz.updated_at).toLocaleString()
    : "Unknown";
  const maxQuestionCount = Math.max(1, quizDraft.length);
  const scoreOptionsForCount = useCallback((count: number) => {
    const safeCount = Math.max(1, count);
    const raw = new Set<number>();
    for (let i = 0; i <= safeCount; i += 1) {
      raw.add(Math.floor((i / safeCount) * 100));
    }
    return Array.from(raw).sort((a, b) => a - b);
  }, []);
  const possiblePassingScores = useMemo(
    () => scoreOptionsForCount(quizSettings.question_count || 1),
    [quizSettings.question_count, scoreOptionsForCount]
  );

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
        (closest, current) =>
          Math.abs(current - rawScore) < Math.abs(closest - rawScore)
            ? current
            : closest,
        options[0]
      );
    },
    [scoreOptionsForCount]
  );


  const loadCompliance = useCallback(async () => {
    if (!realm) return;
    setLoading(true);
    setMessage(null);
    try {
      const [policyRes, quizRes] = await Promise.all([
        apiClient
          .get<CompliancePolicyResponse>(
            `/org-manager/${encodeURIComponent(realm)}/compliance/policy`
          )
          .then((r) => r.data),
        apiClient
          .get<ComplianceQuizResponse>(
            `/org-manager/${encodeURIComponent(realm)}/compliance/quiz`
          )
          .then((r) => r.data),
      ]);
      setPolicy(policyRes);
      setPolicyDraft(policyRes.content_md || "");
      setQuiz(quizRes);
      setQuizDraft(quizRes.question_bank || []);
      const initialCount = Math.min(
        Math.max(1, quizRes.question_count || 1),
        Math.max(1, quizRes.question_bank?.length || 1)
      );
      const scores = new Set(scoreOptionsForCount(initialCount));
      setQuizSettings({
        question_count: initialCount,
        passing_score: scores.has(quizRes.passing_score || 80)
          ? (quizRes.passing_score || 80)
          : Math.min(...Array.from(scores)),
      });
    } catch (err) {
      console.error(err);
      setMessage("Failed to load compliance configuration.");
    } finally {
      setLoading(false);
    }
  }, [realm, scoreOptionsForCount]);

  useEffect(() => {
    if (!keycloak.authenticated) return;
    void loadCompliance();
  }, [keycloak.authenticated, loadCompliance]);

  const savePolicy = async () => {
    if (!realm) return;
    if (!policyDraft.trim()) {
      setMessage("Policy Markdown cannot be empty.");
      return;
    }
    setSavingPolicy(true);
    setMessage(null);
    try {
      const resp = await apiClient
        .put<CompliancePolicyResponse>(
          `/org-manager/${encodeURIComponent(realm)}/compliance/policy`,
          { content_md: policyDraft }
        )
        .then((r) => r.data);
      setPolicy(resp);
      setPolicyDraft(resp.content_md);
      setMessage("Policy updated successfully.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update policy.");
    } finally {
      setSavingPolicy(false);
    }
  };

  const saveQuiz = async () => {
    if (!realm) return;
    if (!quizDraft.length) {
      setMessage("Quiz question bank cannot be empty.");
      return;
    }
    setSavingQuiz(true);
    setMessage(null);
    try {
      const resp = await apiClient
        .put<ComplianceQuizResponse>(
          `/org-manager/${encodeURIComponent(realm)}/compliance/quiz`,
          {
            question_bank: quizDraft,
            question_count: quizSettings.question_count,
            passing_score: quizSettings.passing_score,
          }
        )
        .then((r) => r.data);
      setQuiz(resp);
      setQuizDraft(resp.question_bank || []);
      setQuizSettings({
        question_count: Math.min(
          Math.max(1, resp.question_count),
          Math.max(1, resp.question_bank?.length || 1)
        ),
        passing_score: resp.passing_score,
      });
      setMessage("Quiz updated successfully.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update quiz.");
    } finally {
      setSavingQuiz(false);
    }
  };

  const updateQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    setQuizDraft((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      if (patch.id && patch.id !== prev[index].id) {
        setExpandedQuestions((current) => {
          if (!current.has(prev[index].id)) return current;
          const nextSet = new Set(current);
          nextSet.delete(prev[index].id);
          nextSet.add(patch.id as string);
          return nextSet;
        });
      }
      if (patch.options) {
        const maxIndex = Math.max(0, patch.options.length - 1);
        if (next[index].answer_index > maxIndex) {
          next[index].answer_index = maxIndex;
        }
      }
      return next;
    });
  };

  const addQuestion = () => {
    const newId = `q-${Date.now()}`;
    setQuizDraft((prev) => [
      ...prev,
      {
        id: newId,
        prompt: "",
        options: ["", ""],
        answer_index: 0,
        feedback: "",
      },
    ]);
    setExpandedQuestions((current) => new Set(current).add(newId));
  };

  const removeQuestion = (index: number) => {
    const removedId = quizDraft[index]?.id;
    setQuizDraft((prev) => prev.filter((_, idx) => idx !== index));
    if (removedId) {
      setExpandedQuestions((current) => {
        if (!current.has(removedId)) return current;
        const next = new Set(current);
        next.delete(removedId);
        return next;
      });
    }
  };

  const addOption = (index: number) => {
    const question = quizDraft[index];
    updateQuestion(index, { options: [...question.options, ""] });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const question = quizDraft[qIndex];
    if (question.options.length <= 2) {
      setMessage("Each question must keep at least two options.");
      return;
    }
    const nextOptions = question.options.filter((_, idx) => idx !== optIndex);
    updateQuestion(qIndex, { options: nextOptions });
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">Loading compliance data…</div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Compliance Management
        </h1>
        <p className="text-sm text-gray-500">
          Update your organization&apos;s compliance policy and quiz. Changes
          will require members to re-accept the policy.
        </p>
        {message && (
          <div className="mt-3 rounded-md border border-purple-100 bg-purple-50 px-3 py-2 text-sm text-purple-700">
            {message}
          </div>
        )}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Policy (Markdown)
            </h2>
            <p className="text-xs text-gray-500">
              Last updated: {policyUpdated}
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-lg bg-purple-700 text-white text-sm hover:bg-purple-800 disabled:opacity-60"
            onClick={savePolicy}
            disabled={savingPolicy}
          >
            {savingPolicy ? "Saving…" : "Save Policy"}
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <textarea
            value={policyDraft}
            onChange={(e) => setPolicyDraft(e.target.value)}
            className="min-h-[360px] w-full rounded-lg border border-gray-200 p-3 text-sm font-mono"
          />
          <div className="rounded-lg border border-gray-200 p-3 bg-white max-h-[360px] overflow-y-auto">
            <div className="flex justify-end pb-2">
              <button
                type="button"
                className="text-xs text-purple-700 hover:text-purple-800"
                onClick={() => setShowPreviewModal(true)}
              >
                Open full preview
              </button>
            </div>
            <ReactMarkdown
              className="prose prose-sm max-w-none text-gray-800"
              components={markdownComponents}
            >
              {policyDraft}
            </ReactMarkdown>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Quiz Question Bank
            </h2>
            <p className="text-xs text-gray-500">Last updated: {quizUpdated}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
              onClick={addQuestion}
            >
              Add question
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-purple-700 text-white text-sm hover:bg-purple-800 disabled:opacity-60"
              onClick={saveQuiz}
              disabled={savingQuiz}
            >
              {savingQuiz ? "Saving…" : "Save Quiz"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 place-items-center">
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-center gap-2">
              <label
                htmlFor="question-count"
                className="text-base font-semibold text-gray-800"
              >
                Questions per quiz
              </label>
              <div className="relative group">
                <span className="h-5 w-5 rounded-full border border-purple-600 text-xs text-purple-700 flex items-center justify-center cursor-default">
                  ?
                </span>
                <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-md bg-gray-50 border border-purple-600 px-3 py-2 text-xs text-gray-700 opacity-0 transition-opacity group-hover:opacity-100">
                  Number of questions (randomly selected from the bank) to be asked per quiz.
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                className="h-12 w-12 rounded-full border border-gray-200 text-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() =>
                  setQuizSettings((prev) => {
                    const nextCount = Math.max(1, prev.question_count - 1);
                    return {
                      question_count: nextCount,
                      passing_score: scoreForWrongCount(
                        prev.question_count,
                        prev.passing_score,
                        nextCount
                      ),
                    };
                  })
                }
                disabled={quizSettings.question_count <= 1}
                aria-label="Decrease question count"
              >
                −
              </button>
              <div
                id="question-count"
                className="h-12 min-w-[80px] rounded-xl border border-gray-200 text-gray-900 flex items-center justify-center text-base font-semibold"
              >
                {quizSettings.question_count}
              </div>
              <button
                type="button"
                className="h-12 w-12 rounded-full bg-purple-700 text-white text-xl font-semibold hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() =>
                  setQuizSettings((prev) => {
                    const nextCount = Math.min(
                      maxQuestionCount,
                      prev.question_count + 1
                    );
                    return {
                      question_count: nextCount,
                      passing_score: scoreForWrongCount(
                        prev.question_count,
                        prev.passing_score,
                        nextCount
                      ),
                    };
                  })
                }
                disabled={quizSettings.question_count >= maxQuestionCount}
                aria-label="Increase question count"
              >
                +
              </button>
            </div>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-center gap-2">
              <label
                htmlFor="passing-score"
                className="text-base font-semibold text-gray-800"
              >
                Passing score (%)
              </label>
              <div className="relative group">
                <span className="h-5 w-5 rounded-full border border-purple-600 text-xs text-purple-700 flex items-center justify-center cursor-default">
                  ?
                </span>
                <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2 rounded-md bg-gray-50 border border-purple-600 px-3 py-2 text-xs text-gray-700 opacity-0 transition-opacity group-hover:opacity-100">
                  Percentage required to pass the quiz.
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                className="h-12 w-12 rounded-full border border-gray-200 text-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() =>
                  setQuizSettings((prev) => {
                    const options = scoreOptionsForCount(prev.question_count);
                    const currentIndex = options.indexOf(prev.passing_score);
                    const nextIndex = Math.max(0, currentIndex - 1);
                    return {
                      ...prev,
                      passing_score: options[nextIndex],
                    };
                  })
                }
                disabled={
                  possiblePassingScores.indexOf(quizSettings.passing_score) <= 0
                }
                aria-label="Decrease passing score"
              >
                −
              </button>
              <div
                id="passing-score"
                className="h-12 min-w-[80px] rounded-xl border border-gray-200 text-gray-900 flex items-center justify-center text-base font-semibold"
              >
                {quizSettings.passing_score}%
              </div>
              <button
                type="button"
                className="h-12 w-12 rounded-full bg-purple-700 text-white text-xl font-semibold hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() =>
                  setQuizSettings((prev) => {
                    const options = scoreOptionsForCount(prev.question_count);
                    const currentIndex = options.indexOf(prev.passing_score);
                    const nextIndex = Math.min(
                      options.length - 1,
                      currentIndex + 1
                    );
                    return {
                      ...prev,
                      passing_score: options[nextIndex],
                    };
                  })
                }
                disabled={
                  possiblePassingScores.indexOf(quizSettings.passing_score) >=
                  possiblePassingScores.length - 1
                }
                aria-label="Increase passing score"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {quizDraft.map((question, qIndex) => {
          const baseId = `question-${qIndex}`;
          const isExpanded = expandedQuestions.has(question.id);
          return (
            <div
              key={question.id}
              className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() =>
                    setExpandedQuestions((current) => {
                      const next = new Set(current);
                      if (next.has(question.id)) {
                        next.delete(question.id);
                      } else {
                        next.add(question.id);
                      }
                      return next;
                    })
                  }
                >
                  <p className="text-xs text-gray-500">
                    Question {qIndex + 1}
                  </p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {question.prompt || "Untitled question"}
                  </p>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-xs text-purple-700 hover:text-purple-800"
                    onClick={() =>
                      setExpandedQuestions((current) => {
                        const next = new Set(current);
                        if (next.has(question.id)) {
                          next.delete(question.id);
                        } else {
                          next.add(question.id);
                        }
                        return next;
                      })
                    }
                  >
                    {isExpanded ? "Collapse" : "Expand"}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:text-red-700"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label
                        htmlFor={`${baseId}-id`}
                        className="text-xs text-gray-500"
                      >
                        Question ID
                      </label>
                      <input
                        id={`${baseId}-id`}
                        className="mt-1 w-full rounded-md border border-gray-200 p-2 text-sm"
                        value={question.id}
                        onChange={(e) =>
                          updateQuestion(qIndex, { id: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`${baseId}-prompt`}
                      className="text-xs text-gray-500"
                    >
                      Prompt
                    </label>
                    <textarea
                      id={`${baseId}-prompt`}
                      className="mt-1 w-full rounded-md border border-gray-200 p-2 text-sm"
                      value={question.prompt}
                      onChange={(e) =>
                        updateQuestion(qIndex, { prompt: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">Options</p>
                      <button
                        type="button"
                        className="text-xs text-purple-700 hover:text-purple-800"
                        onClick={() => addOption(qIndex)}
                      >
                        Add option
                      </button>
                    </div>
                    {question.options.map((opt, optIndex) => (
                      <div
                        key={`${question.id}-opt-${optIndex}`}
                        className="flex gap-2"
                      >
                        <input
                          className="flex-1 rounded-md border border-gray-200 p-2 text-sm"
                          value={opt}
                          onChange={(e) => {
                            const nextOptions = [...question.options];
                            nextOptions[optIndex] = e.target.value;
                            updateQuestion(qIndex, { options: nextOptions });
                          }}
                        />
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:text-red-700 px-2"
                          onClick={() => removeOption(qIndex, optIndex)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor={`${baseId}-answer`}
                        className="text-xs text-gray-500"
                      >
                        Correct answer index
                      </label>
                      <select
                        id={`${baseId}-answer`}
                        className="mt-1 w-full rounded-md border border-gray-200 p-2 text-sm"
                        value={question.answer_index}
                        onChange={(e) =>
                          updateQuestion(qIndex, {
                            answer_index: Number(e.target.value),
                          })
                        }
                      >
                        {question.options.map((_, idx) => (
                          <option key={`${question.id}-ans-${idx}`} value={idx}>
                            Option {idx + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor={`${baseId}-feedback`}
                        className="text-xs text-gray-500"
                      >
                        Feedback
                      </label>
                      <textarea
                        id={`${baseId}-feedback`}
                        className="mt-1 w-full rounded-md border border-gray-200 p-2 text-sm"
                        value={question.feedback}
                        onChange={(e) =>
                          updateQuestion(qIndex, { feedback: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
          </div>
        );
        })}
      </section>
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Preview
                </p>
                <h2 className="text-lg font-semibold text-gray-900">
                  Compliance Policy
                </h2>
              </div>
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800"
                onClick={() => setShowPreviewModal(false)}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ReactMarkdown
                className="prose max-w-none text-gray-800"
                components={markdownComponents}
              >
                {policyDraft}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
