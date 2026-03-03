import { CheckCircle2 } from "lucide-react";
import type { SubmitResponse } from "./types";

type ComplianceConfirmStepProps = {
    result: SubmitResponse;
    attest: boolean;
    submitting: boolean;
    onAttestChange: (checked: boolean) => void;
    onAccept: () => void;
};

export default function ComplianceConfirmStep({
    result,
    attest,
    submitting,
    onAttestChange,
    onAccept,
}: ComplianceConfirmStepProps) {
    return (
        <div className="space-y-3">
            {/* Passed score banner */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="h-5 w-5" />
                    <div>
                        <p className="font-semibold">Quiz passed</p>
                        <p className="text-sm">Your Score: {result.score}%. Please attest to finish.</p>
                    </div>
                </div>
            </div>

            {/* Attestation card */}
            <button
                type="button"
                onClick={() => onAttestChange(!attest)}
                className={`w-full text-left rounded-lg p-4 flex items-start gap-4 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${attest
                    ? 'border-purple-500 bg-purple-50/60 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                    }`}
            >
                {/* Custom checkbox indicator */}
                <span
                    className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${attest
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-white border-gray-300'
                        }`}
                >
                    <svg
                        className={`h-3 w-3 text-white transition-transform duration-150 ${attest ? 'scale-100' : 'scale-0'}`}
                        viewBox="0 0 12 10"
                        fill="none"
                    >
                        <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug transition-colors duration-200 ${attest ? 'text-purple-900' : 'text-slate-800'}`}>
                        I attest that I have read this policy
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        I have read, understood, and will comply with this policy in its entirety.
                    </p>
                </div>
            </button>

            {/* Confirm button */}
            <div className="flex justify-end">
                <button
                    className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition disabled:opacity-60"
                    onClick={onAccept}
                    disabled={!attest || submitting}
                >
                    {submitting ? "Saving..." : "Confirm and continue"}
                </button>
            </div>
        </div>
    );
}
