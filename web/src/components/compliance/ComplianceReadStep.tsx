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

    return (
        <div className="space-y-4">
            <div className="pl-4 flex items-center gap-2 text-slate-700 text-lg font-semibold">
                <span>Review the policy</span>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-start">
                {/* ToC sidebar */}
                <div className="md:w-56 shrink-0 rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2 border-b-2 border-gray-200 pb-2">Jump to section</p>
                    {hasDocContent ? (
                        <div className="space-y-2 text-sm text-purple-700">
                            {toc.map((entry) => (
                                <button
                                    key={entry.id}
                                    onClick={() => {
                                        const el = document.getElementById(entry.id);
                                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }}
                                    className="block w-full font-medium text-left hover:text-purple-900 cursor-pointer"
                                >
                                    {entry.title}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500">Loading sections…</p>
                    )}
                </div>

                {/* Markdown content */}
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
