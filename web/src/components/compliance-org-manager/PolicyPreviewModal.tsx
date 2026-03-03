import ReactMarkdown from "react-markdown";
import { markdownComponents } from "./markdownComponents";

type PolicyPreviewModalProps = {
    policyDraft: string;
    onClose: () => void;
};

export default function PolicyPreviewModal({ policyDraft, onClose }: PolicyPreviewModalProps) {
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Preview</p>
                        <h2 className="text-lg font-semibold text-gray-900">Compliance Policy</h2>
                    </div>
                    <button
                        type="button"
                        className="text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                        onClick={onClose}
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
    );
}
