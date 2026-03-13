import { cn } from "@/lib/utils";

interface StepCardProps {
  index: number;
  label: string;
  active: boolean;
}

export default function StepCard({ index, label, active }: StepCardProps) {
  return (
    <div className="flex items-center align-middle gap-1">
      {/* Number Bubble */}
      <div
        className={cn(
          "py-0 px-3.5 rounded-full flex items-center justify-center font-semibold text-sm border",
          active
            ? "bg-primary/90 text-white border-primary"
            : "bg-muted/60 text-foreground/90 border-border/60"
        )}
      >
        {index + 1}
      </div>

      {/* Label */}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
