import { memo } from "react";

export type ViewMode = "month" | "week" | "timeline";

interface TimelineViewToggleProps {
    activeView: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

export const TimelineViewToggle = memo(function TimelineViewToggle({
    activeView,
    onViewChange,
}: TimelineViewToggleProps) {
    const views: { value: ViewMode; label: string }[] = [
        { value: "month", label: "Month" },
        { value: "week", label: "Week" },
        { value: "timeline", label: "Timeline" },
    ];

    return (
        <div
            className="inline-flex rounded-xl p-1 shadow-lg shadow-slate-200/30"
            style={{
                background: "rgba(255, 255, 255, 0.27)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(77, 76, 76, 0.06)",
            }}
        >
            {views.map((view) => (
                <button
                    key={view.value}
                    onClick={() => onViewChange(view.value)}
                    className={`px-5 py-2 rounded-lg text-[14px] font-medium transition-all duration-200 cursor-pointer ${activeView === view.value
                            ? "bg-white shadow-md text-purple-600"
                            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        }`}
                >
                    {view.label}
                </button>
            ))}
        </div>
    );
});
