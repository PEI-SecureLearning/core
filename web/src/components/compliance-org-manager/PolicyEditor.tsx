import { useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { markdownComponents } from "./markdownComponents";

type PolicyEditorProps = {
    policyDraft: string;
    policyUpdated: string;
    importingPolicy: boolean;
    onDraftChange: (value: string) => void;
    onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function PolicyEditor({
    policyDraft,
    policyUpdated,
    importingPolicy,
    onDraftChange,
    onImportFile,
}: Readonly<PolicyEditorProps>) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);
    const syncingFrom = useRef<"editor" | "preview" | null>(null);

    const syncScroll = useCallback((source: "editor" | "preview") => {
        if (syncingFrom.current && syncingFrom.current !== source) return;
        syncingFrom.current = source;

        const editor = textareaRef.current;
        const preview = previewRef.current;
        if (!editor || !preview) { syncingFrom.current = null; return; }

        const editorRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
        const previewRatio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1);

        if (source === "editor") {
            preview.scrollTop = editorRatio * (preview.scrollHeight - preview.clientHeight);
        } else {
            editor.scrollTop = previewRatio * (editor.scrollHeight - editor.clientHeight);
        }

        requestAnimationFrame(() => { syncingFrom.current = null; });
    }, []);

    return (
        <section className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Policy (Markdown)</h2>
                    <p className="text-xs text-muted-foreground">Last updated: {policyUpdated}</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".md,.markdown,.pdf,application/pdf,text/markdown"
                        className="hidden"
                        onChange={onImportFile}
                    />
                    <button
                        type="button"
                        className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-surface-subtle cursor-pointer disabled:opacity-60"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importingPolicy}
                    >
                        {importingPolicy ? "Importing…" : "Import file"}
                    </button>
                </div>
            </div>

            {/* Editor + Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                <textarea
                    ref={textareaRef}
                    value={policyDraft}
                    onChange={(e) => onDraftChange(e.target.value)}
                    onScroll={() => syncScroll("editor")}
                    className="w-full rounded-lg border border-border p-3 text-sm font-mono resize-none h-full overflow-y-auto"
                />
                <div
                    ref={previewRef}
                    onScroll={() => syncScroll("preview")}
                    className="rounded-lg border border-border p-3 bg-background overflow-y-auto"
                >
                    <ReactMarkdown
                        className="prose prose-sm max-w-none text-foreground"
                        components={markdownComponents}
                    >
                        {policyDraft}
                    </ReactMarkdown>
                </div>
            </div>
        </section>
    );
}
