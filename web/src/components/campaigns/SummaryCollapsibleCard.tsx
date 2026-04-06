import { type ReactNode, useId, useState } from "react";
import { ChevronDown } from "lucide-react";

interface SummaryCollapsibleCardProps {
    title: string;
    subtitle?: string;
    className?: string;
    children: ReactNode;
    defaultOpen?: boolean;
}

export function SummaryCollapsibleCard({
    title,
    subtitle,
    className,
    children,
    defaultOpen = false
}: Readonly<SummaryCollapsibleCardProps>) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const contentId = useId();

    return (
        <div className={`self-start rounded-2xl border border-border bg-card overflow-hidden ${className ?? ""}`}>
            <button
                type="button"
                className="w-full flex items-center justify-between gap-4 border-b border-border/60 p-6 text-left transition-colors hover:bg-card/80"
                aria-expanded={isOpen}
                aria-controls={contentId}
                onClick={() => setIsOpen((previous) => !previous)}
            >
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                </div>
                <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-300 text-primary ${isOpen ? "rotate-180" : "rotate-0"}`}
                />
            </button>
            <div
                id={contentId}
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
                <div className="overflow-hidden">
                    <div className="p-6">{children}</div>
                </div>
            </div>
        </div>
    );
}
