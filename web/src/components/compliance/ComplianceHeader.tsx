import { ShieldCheck } from "lucide-react";
import type { ComplianceDoc, Step } from "./types";
import { STEPS, formatDate } from "./types";

type ComplianceHeaderProps = {
    doc: ComplianceDoc | null;
    step: Step;
};

export default function ComplianceHeader({ doc, step }: ComplianceHeaderProps) {
    return (
        <div className="bg-gradient-to-r from-purple-800 to-purple-900 text-white px-6 py-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5" />
            <div className="flex-1">
                <p className="text-sm uppercase tracking-wide text-white/80">Compliance Required</p>
                <h2 className="text-xl font-semibold">{doc?.title ?? "Compliance Policy"}</h2>
                {doc ? (
                    <p className="text-xs text-white/70">
                        Version {doc.version?.slice?.(0, 8) ?? ""} • Updated {formatDate(doc.updated_at)} •{" "}
                        {doc.word_count} words
                    </p>
                ) : (
                    <p className="text-xs text-white/70">Loading compliance details…</p>
                )}
            </div>
            {/* Step indicator dots */}
            <div className="flex items-center gap-2 text-sm">
                {STEPS.map((s) => (
                    <div key={s} className="flex items-center gap-1">
                        <div
                            className={`h-2.5 w-2.5 rounded-full ${step === s || STEPS.indexOf(step) > STEPS.indexOf(s)
                                ? "bg-white"
                                : "bg-white/40"
                                }`}
                        />
                        <span className="text-white/80 capitalize">{s}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
