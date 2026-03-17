import { Grid3x3, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

type ToggleIcon = "grid" | "table" | "list";

export interface DisplayModeOption<T extends string> {
  readonly value: T;
  readonly ariaLabel: string;
  readonly icon: ToggleIcon;
}

interface DisplayModeToggleProps<T extends string> {
  readonly value: T;
  readonly onChange: (mode: T) => void;
  readonly options: readonly DisplayModeOption<T>[];
  readonly className?: string;
}

function iconFor(icon: ToggleIcon) {
  switch (icon) {
    case "table":
      return <List className="h-4 w-4" />;
    case "list":
      return <List className="h-4 w-4" />;
    case "grid":
      return <LayoutGrid className="h-4 w-4" />;
    default:
      return <Grid3x3 className="h-4 w-4" />;
  }
}

export default function DisplayModeToggle<T extends string>({
  value,
  onChange,
  options,
  className,
}: DisplayModeToggleProps<T>) {
  return (
    <div className={cn("hidden sm:flex items-center bg-muted rounded-md p-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "p-2 rounded-md transition-colors cursor-pointer",
            value === option.value
              ? "bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-label={option.ariaLabel}
        >
          {iconFor(option.icon)}
        </button>
      ))}
    </div>
  );
}