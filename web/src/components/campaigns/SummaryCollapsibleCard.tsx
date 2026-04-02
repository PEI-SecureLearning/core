import { type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SummaryCollapsibleCardProps {
    title: string;
    subtitle: string;
    className?: string;
    children: ReactNode;
}

export function SummaryCollapsibleCard({
    title,
    subtitle,
    className,
    children
}: Readonly<SummaryCollapsibleCardProps>) {
    return (
        <div className={`rounded-2xl border border-border bg-card overflow-hidden ${className ?? ""}`}>
            <Collapsible>
                <CollapsibleTrigger className="w-full flex items-center justify-between gap-4 border-b border-border/60 p-6 text-left transition-colors hover:bg-card/80">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                    </div>
                    <ChevronDown className="h-5 w-5 shrink-0 transition-transform data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-6">{children}</CollapsibleContent>
            </Collapsible>
        </div>
    );
}
