import { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { markdownComponents } from "./markdownComponents";

type PolicyEditorProps = {
    policyDraft: string;
    policyUpdated: string;
    importingPolicy: boolean;
    collapsed: boolean;
    onToggleCollapse: () => void;
    onDraftChange: (value: string) => void;
    onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenPreview: () => void;
};

export default function PolicyEditor({
    policyDraft,
    policyUpdated,
    importingPolicy,
    collapsed,
    onToggleCollapse,
    onDraftChange,
    onImportFile,
    onOpenPreview,
}: PolicyEditorProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    return (
        <section className={`flex flex-col overflow-hidden ${collapsed ? "shrink-0" : "flex-1 min-h-0"}`}>
            <div
                className="flex items-center justify-between cursor-pointer select-none shrink-0"
                onClick={onToggleCollapse}
            >
                <div className="flex items-center gap-2">
                    <motion.svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ rotate: collapsed ? 0 : 90 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Policy (Markdown)</h2>
                        <p className="text-xs text-gray-500">Last updated: {policyUpdated}</p>
                    </div>
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            className="flex items-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".md,.markdown,.pdf,application/pdf,text/markdown"
                                className="hidden"
                                onChange={onImportFile}
                            />
                            <button
                                type="button"
                                className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 cursor-pointer disabled:opacity-60"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={importingPolicy}
                            >
                                {importingPolicy ? "Importing…" : "Import file"}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div
                        key="policy-content"
                        className="flex-1 min-h-0 flex flex-col"
                        initial={{ height: 0, opacity: 0, y: -20 }}
                        animate={{ height: "auto", opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeInOut" } }}
                        exit={{ height: 0, opacity: 0, y: -20, transition: { duration: 0.25, ease: "easeOut" } }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                    >
                        <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                            <textarea
                                value={policyDraft}
                                onChange={(e) => onDraftChange(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 p-3 text-sm font-mono resize-none h-full"
                            />
                            <div className="rounded-lg border border-gray-200 p-3 bg-white overflow-y-auto">
                                <div className="flex justify-end pb-2">
                                    <button
                                        type="button"
                                        className="text-xs text-purple-700 hover:text-purple-800 cursor-pointer"
                                        onClick={onOpenPreview}
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
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
