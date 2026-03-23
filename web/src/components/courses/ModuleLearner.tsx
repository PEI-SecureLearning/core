import { useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  PartyPopper,
  SkipForward,
  X
} from "lucide-react";
import type { CourseModule } from "./courseData";
import { COURSES } from "./courseData";
import type {
  Block,
  Choice,
  Section
} from "@/components/content-manager/modules/module-creation/types";
import { renderMarkdown } from "@/components/content-manager/modules/module-creation/utils";
import { DIFFICULTY_COLORS } from "@/components/content-manager/modules/module-creation/constants";

/* ────────────────────────────────────────────────────────────────────────────
   Question type labels & true/false helpers
   ──────────────────────────────────────────────────────────────────────────── */

const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  short_answer: "Short Answer"
};

const TF_CHOICES: Choice[] = [
  { id: "tf-t", text: "True", isCorrect: true },
  { id: "tf-f", text: "False", isCorrect: false }
];

/* ────────────────────────────────────────────────────────────────────────────
   Block renderers (adapted from ModulePreview)
   ──────────────────────────────────────────────────────────────────────────── */

function RichMediaPreview({
  block
}: {
  readonly block: Extract<Block, { kind: "rich_content" }>;
}) {
  if (!block.url) {
    return (
      <div className="flex items-center justify-center h-24 text-muted-foreground/70 gap-2 text-sm italic">
        <ImageIcon className="w-5 h-5" /> No media URL set
      </div>
    );
  }
  if (block.mediaType === "image") {
    return (
      <img
        src={block.url}
        alt={block.caption || "media"}
        className="w-full max-h-80 object-contain"
      />
    );
  }
  if (block.mediaType === "video") {
    return (
      <video src={block.url} controls className="w-full max-h-80">
        <track kind="captions" />
      </video>
    );
  }
  if (block.mediaType === "audio") {
    return (
      <audio src={block.url} controls className="w-full px-4 py-3">
        <track kind="captions" />
      </audio>
    );
  }
  return (
    <a
      href={block.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 px-4 py-3 text-sm text-primary font-medium hover:text-primary/80 transition-colors"
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="truncate">{block.url}</span>
    </a>
  );
}

function QuestionBlock({
  block,
  qIndex,
  answeredChoices,
  onMark
}: {
  readonly block: Extract<Block, { kind: "question" }>;
  readonly qIndex: number;
  readonly answeredChoices: Record<string, string>;
  readonly onMark: (qid: string, cid: string) => void;
}) {
  const q = block.question;
  const answered = answeredChoices[q.id];
  const typeLabel = QUESTION_TYPE_LABELS[q.type] ?? "Question";
  const choices = q.type === "true_false" ? TF_CHOICES : q.choices;

  const choiceBtnClass = (c: Choice) => {
    if (answered !== c.id) {
      return "bg-background border-border text-foreground/90 hover:bg-primary/5 hover:border-primary/30";
    }
    return c.isCorrect
      ? "bg-success/10 border-success/40 text-success"
      : "bg-error/10 border-error/40 text-error";
  };

  const choiceCircleClass = (c: Choice) => {
    if (answered !== c.id) return "border-border/60";
    return c.isCorrect
      ? "border-success bg-success/20"
      : "border-error bg-error/20";
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-subtle border-b border-border/40">
        <ListChecks className="w-3.5 h-3.5 shrink-0 text-primary/90" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/90">
          {typeLabel}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/70">
          Q{qIndex}
        </span>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-foreground leading-relaxed mb-4">
          {q.text || (
            <em className="text-muted-foreground/70 font-normal">
              No question text
            </em>
          )}
        </p>
        {q.type === "short_answer" ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Your answer…"
              className="flex-1 bg-surface-subtle border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            />
            <button
              type="button"
              className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors bg-primary hover:bg-primary"
            >
              Check
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {choices.map((c) => {
              const isSelected = answered === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onMark(q.id, c.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-all ${choiceBtnClass(c)}`}
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${choiceCircleClass(c)}`}
                  >
                    {isSelected && c.isCorrect && (
                      <Check className="w-2.5 h-2.5 text-success" />
                    )}
                    {isSelected && !c.isCorrect && (
                      <X className="w-2.5 h-2.5 text-error" />
                    )}
                  </span>
                  <span className="flex-1">
                    {c.text || (
                      <em className="text-muted-foreground/70">Empty choice</em>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewBlock({
  block,
  qIndex,
  answeredChoices,
  onMark
}: {
  readonly block: Block;
  readonly qIndex: number;
  readonly answeredChoices: Record<string, string>;
  readonly onMark: (qid: string, cid: string) => void;
}) {
  if (block.kind === "text") {
    return (
      <div
        className="text-[15px] leading-7 text-foreground/90 [&_h1]:text-foreground [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_strong]:text-foreground [&_strong]:font-semibold [&_em]:text-muted-foreground [&_a]:text-primary [&_a]:underline [&_code]:bg-muted [&_code]:text-primary [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:font-mono [&_pre]:bg-background [&_pre]:rounded-xl [&_pre]:text-success [&_pre]:my-4 [&_li]:text-foreground/90 [&_li]:leading-7 [&_blockquote]:border-accent-secondary [&_blockquote]:text-muted-foreground [&_blockquote]:bg-primary/5 [&_blockquote]:py-1 [&_hr]:border-border [&_del]:text-muted-foreground/70 [&_table]:w-full [&_th]:bg-surface-subtle [&_th]:text-foreground/90 [&_th]:border-border [&_td]:text-foreground/90 [&_td]:border-border"
        dangerouslySetInnerHTML={{
          __html: renderMarkdown(block.content || "")
        }}
      />
    );
  }
  if (block.kind === "rich_content") {
    return (
      <div className="rounded-xl overflow-hidden border border-border bg-surface-subtle">
        <RichMediaPreview block={block} />
        {block.caption && (
          <p className="text-[11px] text-muted-foreground text-center px-3 py-2 border-t border-border italic">
            {block.caption}
          </p>
        )}
      </div>
    );
  }
  if (block.kind === "question") {
    return (
      <QuestionBlock
        block={block}
        qIndex={qIndex}
        answeredChoices={answeredChoices}
        onMark={onMark}
      />
    );
  }
  return null;
}

/* ────────────────────────────────────────────────────────────────────────────
   Section locking logic
   ──────────────────────────────────────────────────────────────────────────── */

/** Check if all questions in a section have been answered correctly */
function isSectionComplete(
  section: Section,
  answeredChoices: Record<string, string>
): boolean {
  const questions = section.blocks.filter(
    (b) => b.kind === "question"
  ) as Extract<Block, { kind: "question" }>[];

  if (questions.length === 0) return true; // no questions → auto-complete on open

  if (section.requireCorrectAnswers) {
    // Every question must be answered correctly
    return questions.every((qb) => {
      const q = qb.question;
      const chosen = answeredChoices[q.id];
      if (!chosen) return false;
      const choices = q.type === "true_false" ? TF_CHOICES : q.choices;
      const correct = choices.find((c) => c.isCorrect);
      return chosen === correct?.id;
    });
  }

  // No strict requirement → just need to have answered each question (any answer)
  return questions.every((qb) => answeredChoices[qb.question.id] !== undefined);
}

/** Determine which sections are unlocked based on sequential completion */
function computeUnlockedSections(
  sections: Section[],
  completedSections: Set<string>
): Set<string> {
  const unlocked = new Set<string>();
  let previousRequiredCompleted = true;

  for (const sec of sections) {
    if (previousRequiredCompleted || sec.isOptional) {
      unlocked.add(sec.id);
    }

    if (!sec.isOptional) {
      previousRequiredCompleted = completedSections.has(sec.id);
    }
  }

  return unlocked;
}

/* ────────────────────────────────────────────────────────────────────────────
   Toast message component
   ──────────────────────────────────────────────────────────────────────────── */

function Toast({
  message,
  onDone
}: {
  readonly message: string;
  readonly onDone: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.25 }}
      onAnimationComplete={() => {
        setTimeout(onDone, 2200);
      }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background text-foreground px-5 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 border border-border"
    >
      <Lock className="w-4 h-4 text-warning" />
      {message}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Main ModuleLearner component
   ──────────────────────────────────────────────────────────────────────────── */

type Props = {
  readonly module: CourseModule;
  readonly courseId: string;
};

export default function ModuleLearner({ module: mod, courseId }: Props) {
  const sections = mod.sections ?? [];
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // ── State ──
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >(() => {
    // Start with all sections collapsed except the first unlocked
    const collapsed: Record<string, boolean> = {};
    sections.forEach((s, i) => {
      collapsed[s.id] = i !== 0;
    });
    return collapsed;
  });
  const [answeredChoices, setAnsweredChoices] = useState<
    Record<string, string>
  >({});
  const [completedSections, setCompletedSections] = useState<Set<string>>(
    new Set()
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [openedSections, setOpenedSections] = useState<Set<string>>(
    () => new Set(sections[0] ? [sections[0].id] : [])
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // ── Derived state ──
  const unlockedSections = useMemo(
    () => computeUnlockedSections(sections, completedSections),
    [sections, completedSections]
  );

  const allComplete = sections.every(
    (s) => s.isOptional || completedSections.has(s.id)
  );

  // ── Handlers ──
  const onMark = useCallback((qid: string, cid: string) => {
    setAnsweredChoices((prev) => ({ ...prev, [qid]: cid }));
  }, []);

  const toggleSection = useCallback(
    (id: string) => {
      if (!unlockedSections.has(id)) {
        setToastMsg("Complete the previous section first");
        return;
      }
      setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
      setOpenedSections((prev) => new Set(prev).add(id));
    },
    [unlockedSections]
  );

  const scrollTo = useCallback(
    (id: string) => {
      if (!unlockedSections.has(id)) {
        setToastMsg("Complete the previous section first");
        return;
      }
      const el = sectionRefs.current[id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setCollapsedSections((prev) => ({ ...prev, [id]: false }));
      setOpenedSections((prev) => new Set(prev).add(id));
    },
    [unlockedSections]
  );

  const completeSection = useCallback(
    (sectionId: string) => {
      setCompletedSections((prev) => {
        const next = new Set(prev);
        next.add(sectionId);
        return next;
      });

      // Auto-expand next locked section
      const idx = sections.findIndex((s) => s.id === sectionId);
      if (idx >= 0 && idx < sections.length - 1) {
        const nextSec = sections[idx + 1];
        setTimeout(() => {
          setCollapsedSections((prev) => ({ ...prev, [nextSec.id]: false }));
          setOpenedSections((prev) => new Set(prev).add(nextSec.id));
          const el = sectionRefs.current[nextSec.id];
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    },
    [sections]
  );

  const skipSection = useCallback((sectionId: string) => {
    setCompletedSections((prev) => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
  }, []);

  const course = useMemo(
    () => COURSES.find((c) => c.id === courseId),
    [courseId]
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col h-full overflow-hidden bg-surface-subtle">
      {/* ── Top bar ── */}
      <div className="relative flex flex-col px-6 py-3 bg-background border-b border-border shadow-sm shrink-0">
        {/* Row 1: back link (course title) */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to={"/courses/$courseId" as any}
            params={{ courseId } as any}
            className="flex items-center gap-1 text-muted-foreground/70 hover:text-primary transition-colors text-sm font-medium shrink-0"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            {course?.title ?? "Course"}
          </Link>
        </div>
        {/* module title */}
        <div className="mt-1 min-w-0">
          <span className="text-xl font-bold text-foreground truncate">
            {mod.title}
          </span>
        </div>
        {/* Row 3: difficulty + duration + sections */}
        <div className="flex items-center gap-4 mt-1.5 pl-1">
          {mod.difficulty &&
            (["Easy", "Medium", "Hard"] as const).includes(
              mod.difficulty as "Easy" | "Medium" | "Hard"
            ) && (
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-bold border ${DIFFICULTY_COLORS[mod.difficulty as "Easy" | "Medium" | "Hard"]}`}
              >
                {mod.difficulty}
              </span>
            )}
          {mod.estimatedTime && (
            <span className="flex items-center gap-1 text-muted-foreground/70 text-sm">
              <Clock className="w-3.5 h-3.5" />
              {mod.estimatedTime}
            </span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground/70 text-sm">
            <Layers className="w-3.5 h-3.5" />
            {sections.length} section{sections.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* ── Body (sidebar + main) ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar ── */}
        <div
          className={`shrink-0 bg-background border-r border-border flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out max-w-64 ${sidebarCollapsed ? "w-14" : "w-1/3"}`}
        >
          {/* Sidebar header */}
          <div className="px-3 pt-3 pb-3 border-b border-border/40 shrink-0">
            <div
              className={`flex items-center mb-2 ${sidebarCollapsed ? "justify-center" : "justify-end"}`}
            >
              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="rounded-md p-1 text-muted-foreground hover:text-primary hover:bg-surface-subtle transition-colors"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-label={
                  sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </div>
            {/* Overall progress */}
            {!sidebarCollapsed && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 mb-1">
                  <span>Progress</span>
                  <span className="font-bold text-primary">
                    {sections.length > 0
                      ? Math.round(
                          (completedSections.size /
                            sections.filter((s) => !s.isOptional).length) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary/90"
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        sections.length > 0
                          ? `${(completedSections.size / sections.filter((s) => !s.isOptional).length) * 100}%`
                          : "0%"
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section list */}
          <div className="flex-1 overflow-y-auto py-2">
            {!sidebarCollapsed && (
              <p className="px-4 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Sections
              </p>
            )}
            {sections.length === 0 ? (
              <p
                className={`${sidebarCollapsed ? "px-2 text-center" : "px-4"} py-3 text-xs text-muted-foreground/70 italic`}
              >
                No sections
              </p>
            ) : (
              sections.map((sec, i) => {
                const isLocked = !unlockedSections.has(sec.id);
                const isComplete = completedSections.has(sec.id);
                const qCount = sec.blocks.filter(
                  (b) => b.kind === "question"
                ).length;

                let badgeCls = "bg-primary text-white";
                if (isComplete) badgeCls = "bg-emerald-500 text-white";
                else if (isLocked)
                  badgeCls = "bg-muted/60 text-muted-foreground/70";

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollTo(sec.id)}
                    title={
                      sidebarCollapsed
                        ? sec.title || `Section ${i + 1}`
                        : undefined
                    }
                    className={`w-full text-left ${sidebarCollapsed ? "px-2 py-2 justify-center" : "px-4 py-2.5"} flex items-start gap-2.5 transition-colors group border-l-2 border-transparent
                                        ${
                                          isLocked
                                            ? "cursor-not-allowed opacity-50"
                                            : "hover:bg-surface-subtle hover:border-primary/50 cursor-pointer"
                                        }`}
                  >
                    <span
                      className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${badgeCls}`}
                    >
                      {isComplete ? (
                        <Check className="w-3 h-3" />
                      ) : isLocked ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    {!sidebarCollapsed && (
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold transition-colors ${isLocked ? "text-muted-foreground/70" : "text-foreground/90 group-hover:text-primary"}`}
                        >
                          {sec.title || `Section ${i + 1}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {sec.isOptional && (
                            <span className="flex items-center gap-0.5 text-[10px] text-info">
                              <SkipForward className="w-2.5 h-2.5" /> Optional
                            </span>
                          )}
                          {sec.requireCorrectAnswers && (
                            <span className="flex items-center gap-0.5 text-[10px] text-success">
                              <CheckCircle className="w-2.5 h-2.5" /> Required
                            </span>
                          )}
                          {qCount > 0 && (
                            <span className="text-[10px] text-muted-foreground/70">
                              {qCount} {qCount === 1 ? "question" : "questions"}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 overflow-y-auto">
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/70">
              <Layers className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm font-medium">No content in this module</p>
            </div>
          ) : (
            (() => {
              let globalQIndex = 0;
              return (
                <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col gap-4">
                  {sections.map((sec, i) => {
                    const isLocked = !unlockedSections.has(sec.id);
                    const isCollapsed = !!collapsedSections[sec.id];
                    const isComplete = completedSections.has(sec.id);
                    const qCount = sec.blocks.filter(
                      (b) => b.kind === "question"
                    ).length;
                    const baseQIndex = globalQIndex;
                    globalQIndex += qCount;

                    // Check if section can be completed
                    const sectionDone = isSectionComplete(sec, answeredChoices);
                    const noQuestionsButOpened =
                      qCount === 0 && openedSections.has(sec.id);
                    const canComplete =
                      !isComplete &&
                      !isLocked &&
                      (sectionDone || noQuestionsButOpened);

                    return (
                      <motion.div
                        key={sec.id}
                        ref={(el: HTMLDivElement | null) => {
                          sectionRefs.current[sec.id] = el;
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`bg-background rounded-2xl border shadow-sm overflow-hidden scroll-mt-4 transition-all
                                            ${
                                              isLocked
                                                ? "border-border opacity-60"
                                                : isComplete
                                                  ? "border-success/20 bg-success/5"
                                                  : "border-border"
                                            }`}
                      >
                        {/* Section header */}
                        <button
                          type="button"
                          onClick={() => toggleSection(sec.id)}
                          className={`w-full flex items-center gap-3 px-6 py-4 transition-colors text-left group
                                                ${
                                                  isLocked
                                                    ? "bg-surface-subtle cursor-not-allowed"
                                                    : "bg-background hover:bg-surface-subtle cursor-pointer"
                                                }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0
                                                ${isComplete ? "bg-success" : isLocked ? "bg-muted-foreground/40" : "bg-primary"}`}
                          >
                            {isComplete ? (
                              <Check className="w-4 h-4" />
                            ) : isLocked ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              i + 1
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-base font-bold transition-colors truncate
                                                    ${isLocked ? "text-muted-foreground/70" : isComplete ? "text-success" : "text-foreground group-hover:text-primary"}`}
                            >
                              {sec.title || `Section ${i + 1}`}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {sec.isOptional && (
                                <span className="text-[10px] text-info font-medium flex items-center gap-0.5">
                                  <SkipForward className="w-3 h-3" /> Optional
                                </span>
                              )}
                              {sec.requireCorrectAnswers && (
                                <span className="text-[10px] text-success font-medium flex items-center gap-0.5">
                                  <CheckCircle className="w-3 h-3" /> Correct
                                  answers required
                                </span>
                              )}
                              {qCount > 0 && (
                                <span className="text-[11px] text-muted-foreground/70">
                                  {qCount}{" "}
                                  {qCount === 1 ? "question" : "questions"}
                                </span>
                              )}
                              {isComplete && (
                                <span className="text-[10px] text-success font-bold">
                                  ✓ Completed
                                </span>
                              )}
                              {isLocked && (
                                <span className="text-[10px] text-muted-foreground/70 font-medium">
                                  🔒 Locked
                                </span>
                              )}
                            </div>
                          </div>
                          {!isLocked && (
                            <motion.div
                              animate={{ rotate: isCollapsed ? -90 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="text-muted-foreground/70 shrink-0 group-hover:text-primary/90"
                            >
                              <ChevronDown className="w-5 h-5" />
                            </motion.div>
                          )}
                        </button>

                        {/* Section body */}
                        <AnimatePresence initial={false}>
                          {!isCollapsed && !isLocked && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.22,
                                ease: [0.4, 0, 0.2, 1]
                              }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-6 pt-1 flex flex-col gap-5 border-t border-border/40">
                                {sec.blocks.length === 0 ? (
                                  <p className="text-sm text-muted-foreground/70 italic py-3">
                                    No content in this section yet.
                                  </p>
                                ) : (
                                  (() => {
                                    let localQ = baseQIndex;
                                    return sec.blocks.map((block) => {
                                      if (block.kind === "question") localQ++;
                                      return (
                                        <PreviewBlock
                                          key={block.id}
                                          block={block}
                                          qIndex={
                                            block.kind === "question"
                                              ? localQ
                                              : 0
                                          }
                                          answeredChoices={answeredChoices}
                                          onMark={onMark}
                                        />
                                      );
                                    });
                                  })()
                                )}

                                {/* Complete / Skip section button */}
                                <div className="flex items-center gap-3 pt-3 border-t border-border/40">
                                  {!isComplete && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => completeSection(sec.id)}
                                        disabled={!canComplete}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                                                                            ${
                                                                              canComplete
                                                                                ? "bg-primary text-white hover:bg-primary shadow-md hover:shadow-lg active:scale-[0.97]"
                                                                                : "bg-muted text-muted-foreground/70 cursor-not-allowed"
                                                                            }`}
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Complete Section
                                      </button>
                                      {sec.isOptional && (
                                        <button
                                          type="button"
                                          onClick={() => skipSection(sec.id)}
                                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-info hover:bg-info/10 transition-colors"
                                        >
                                          <SkipForward className="w-4 h-4" />
                                          Skip
                                        </button>
                                      )}
                                      {!canComplete && qCount > 0 && (
                                        <p className="text-xs text-muted-foreground/70 italic">
                                          {sec.requireCorrectAnswers
                                            ? "Answer all questions correctly to continue"
                                            : "Answer all questions to continue"}
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {isComplete && (
                                    <p className="flex items-center gap-2 text-sm text-success font-semibold">
                                      <CheckCircle className="w-4 h-4" />
                                      Section completed!
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}

                  {/* ── Completion banner ── */}
                  <AnimatePresence>
                    {allComplete && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-primary rounded-2xl p-8 text-center text-primary-foreground shadow-xl border border-primary-foreground/20"
                      >
                        <PartyPopper className="w-12 h-12 mx-auto mb-4 text-amber-300" />
                        <h2 className="text-2xl font-bold mb-2">
                          Module Complete! 🎉
                        </h2>
                        <p className="text-primary-foreground/70 mb-6">
                          You've successfully completed all sections in "
                          {mod.title}".
                        </p>
                        <Link
                          to={"/courses/$courseId" as any}
                          params={{ courseId } as any}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-foreground text-primary font-semibold shadow-md hover:shadow-lg hover:bg-primary-foreground/90 transition-all"
                        >
                          ← Back to Course
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()
          )}
        </div>
      </div>
      {/* end flex body */}

      {/* ── Toast ── */}
      <AnimatePresence>
        {toastMsg && (
          <Toast message={toastMsg} onDone={() => setToastMsg(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
