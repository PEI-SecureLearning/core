import { CircleQuestionMark } from "lucide-react";
import type { ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

export type FormTooltipSide = "top" | "right" | "bottom" | "left";
export type FormTooltipVariant = "default" | "error";

interface FormTooltipProps {
  readonly content: ReactNode | readonly string[];
  readonly side?: FormTooltipSide;
  readonly iconSize?: number;
  readonly children?: ReactNode;
  readonly variant?: FormTooltipVariant;
}

const ICON_CLASSES = "text-primary hover:text-primary/80 transition-colors";

export default function FormTooltip({
  content,
  side = "right",
  iconSize = 14,
  children,
  variant = "default"
}: Readonly<FormTooltipProps>) {
  const lines = Array.isArray(content) ? content : null;
  const maxWidthClass = side === "top" ? "max-w-[14rem]" : "max-w-[22rem]";

  const contentClasses =
    variant === "error"
      ? "w-fit bg-red-50 border-[1.5px] border-red-600 text-red-700 m-1"
      : "w-fit bg-surface border-[1.5px] border-primary text-primary/100 m-1";

  const trigger = children || (
    <button
      type="button"
      className={ICON_CLASSES}
      aria-label="More information"
    >
      <CircleQuestionMark size={iconSize} />
    </button>
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent
          side={side}
          className={`${contentClasses} ${maxWidthClass}`}
        >
          {lines ? (
            <div className="text-[12px] font-medium space-y-1 whitespace-normal wrap-break-word">
              {lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : (
            content
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
