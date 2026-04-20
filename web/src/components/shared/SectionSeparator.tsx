import { Separator } from "@/components/ui/separator";

type SectionSeparatorProps = Readonly<{
    title: string;
}>;

export function SectionSeparator({ title }: SectionSeparatorProps) {
    return (
        <div className="flex items-center gap-3">
            <span className="shrink-0 whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-primary">
                {title}
            </span>
            <Separator className="flex-1 bg-primary/70 self-center" />
        </div>
    );
}