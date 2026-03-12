import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PhishingKitDisplayInfo } from "@/types/phishingKit";

interface PhishingKitSuggestionItemProps {
  readonly kit: PhishingKitDisplayInfo;
  readonly highlighted: boolean;
  readonly onSelect: () => void;
  readonly onHighlight: () => void;
  readonly buttonRef?: (el: HTMLButtonElement | null) => void;
}

export default function PhishingKitSuggestionItem({
  kit,
  highlighted,
  onSelect,
  onHighlight,
  buttonRef,
}: Readonly<PhishingKitSuggestionItemProps>) {
  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="ghost"
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
      onMouseEnter={onHighlight}
      className={cn(
        "w-full h-auto justify-start px-4 py-3 rounded-md text-left transition-colors",
        highlighted
          ? "bg-slate-100 ring-1 ring-inset ring-slate-200"
          : "hover:bg-slate-50",
      )}
    >
      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-slate-700 text-sm leading-none">
          {kit.name}
        </span>
        <span className="text-xs text-slate-500 max-w-sm truncate">
          {kit.description || "No description"}
        </span>
      </div>
    </Button>
  );
}
