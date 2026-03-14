import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ComplianceDoc } from "./types";
import ExpandButton from "./ExpandButton";

type TocEntry = { id: string; title: string };

type ComplianceReadStepProps = {
    doc: ComplianceDoc;
    toc: TocEntry[];
    hasDocContent: boolean;
    hasQuiz: boolean;
    onNext: () => void;
};

function slugify(text: string) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

export default function ComplianceReadStep({
    doc,
    toc,
    hasDocContent,
    hasQuiz,
    onNext,
}: ComplianceReadStepProps) {
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
                    <div id={id} className="mt-8 mb-3 border-b border-border pb-2 scroll-m-24">
                        <p className="text-lg font-semibold text-foreground">{children}</p>
                    </div>
                );
            },
            h3: ({ children }: { children?: React.ReactNode }) => (
                <p className="mt-4 mb-2 text-base font-semibold text-foreground">{children}</p>
            ),
            p: ({ children }: { children?: React.ReactNode }) => (
                <p className="text-sm text-foreground leading-6 mb-3">{children}</p>
            ),
            ul: ({ children }: { children?: React.ReactNode }) => (
                <ul className="list-disc pl-5 space-y-1 text-sm text-foreground mb-3">{children}</ul>
            ),
            ol: ({ children }: { children?: React.ReactNode }) => (
                <ol className="list-decimal pl-5 space-y-1 text-sm text-foreground mb-3">{children}</ol>
            ),
            li: ({ children }: { children?: React.ReactNode }) => <li className="leading-6">{children}</li>,
            table: ({ children }: { children?: React.ReactNode }) => (
                <div className="overflow-x-auto mb-4">
                    <table className="min-w-full border border-border text-sm text-foreground">{children}</table>
                </div>
            ),
            thead: ({ children }: { children?: React.ReactNode }) => (
                <thead className="bg-surface-subtle text-foreground font-semibold">{children}</thead>
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

    return (
        <div className="space-y-4">
            <div className="pl-4 flex items-center gap-2 text-foreground/90 text-lg font-semibold">
                <span>Review the policy</span>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-start">
                {/* ToC sidebar */}
                <div className="md:w-56 shrink-0 rounded-lg border border-border bg-background p-3">
                    <p className="text-xs font-semibold text-foreground/90 mb-2 border-b-2 border-border pb-2">Jump to section</p>
                    {hasDocContent ? (
                        <div className="space-y-2 text-sm text-primary">
                            {toc.map((entry) => (
                                <button
                                    key={entry.id}
                                    onClick={() => {
                                        const el = document.getElementById(entry.id);
                                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }}
                                    className="block w-full font-medium text-left hover:text-primary/80 cursor-pointer"
                                >
                                    {entry.title}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">Loading sections…</p>
                    )}
                </div>

                {/* Markdown content */}
                <div className="rounded-lg border border-border bg-background p-4 max-h-[55vh] overflow-y-auto w-full">
                    {hasDocContent ? (
                        <ReactMarkdown className="prose prose-sm max-w-none text-foreground" components={markdownComponents}>
                            {doc.content}
                        </ReactMarkdown>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Policy content unavailable. Please refresh or contact an administrator.
                        </p>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <ExpandButton
                    label="Start quiz"
                    loadingLabel="Loading quiz..."
                    disabled={!hasQuiz}
                    onClick={onNext}
                />
            </div>
        </div>
    );
}
