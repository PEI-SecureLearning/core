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
  buttonRef
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
        "w-full h-auto justify-start px-4 py-3 rounded-md text-left transition-colors text-foreground hover:text-foreground",
        highlighted
          ? "bg-muted ring-1 ring-inset ring-border hover:bg-muted dark:hover:bg-muted"
          : "hover:bg-transparent dark:hover:bg-transparent"
      )}
    >
      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-foreground text-sm leading-none">
          {kit.name}
        </span>
        <span className="text-xs text-muted-foreground max-w-sm truncate">
          {kit.description || "No description"}
        </span>
      </div>
    </Button>
  );
}
