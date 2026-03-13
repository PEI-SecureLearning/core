import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CampaignTargetGroup {
  readonly id: string;
  readonly name: string;
  readonly path?: string;
}

interface GroupSuggestionItemProps {
  readonly group: CampaignTargetGroup;
  readonly highlighted: boolean;
  readonly onSelect: () => void;
  readonly onHighlight: () => void;
  readonly buttonRef?: (el: HTMLButtonElement | null) => void;
}

export default function GroupSuggestionItem({
  group,
  highlighted,
  onSelect,
  onHighlight,
  buttonRef,
}: Readonly<GroupSuggestionItemProps>) {
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
          : "hover:bg-transparent dark:hover:bg-transparent",
      )}
    >
      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-slate-700 text-sm leading-none">
          {group.name}
        </span>
        {group.path && (
          <span className="text-xs text-slate-500 truncate max-w-sm">
            {group.path}
          </span>
        )}
      </div>
    </Button>
  );
}
