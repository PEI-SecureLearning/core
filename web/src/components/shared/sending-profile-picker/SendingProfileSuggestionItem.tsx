import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SendingProfileDisplayInfo } from "@/types/sendingProfile";

interface SendingProfileSuggestionItemProps {
  readonly profile: SendingProfileDisplayInfo;
  readonly highlighted: boolean;
  readonly onHighlight: () => void;
  readonly onSelect: () => void;
  readonly buttonRef?: (el: HTMLButtonElement | null) => void;
}

export default function SendingProfileSuggestionItem({
  profile,
  highlighted,
  onHighlight,
  onSelect,
  buttonRef,
}: Readonly<SendingProfileSuggestionItemProps>) {
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
          {profile.name}
        </span>
        <span className="text-sm text-slate-500 leading-none">
          {profile.from_email} • {profile.smtp_host}
        </span>
      </div>
    </Button>
  );
}
