import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BaseButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "onClick" | "children"
>;

interface RefreshButtonProps extends BaseButtonProps {
  readonly onClick: () => void | Promise<unknown>;
  readonly isRefreshing?: boolean;
  readonly label?: ReactNode;
  readonly iconSize?: number;
  readonly iconClassName?: string;
}

export default function RefreshButton({
  onClick,
  isRefreshing = false,
  label = "Refresh",
  iconSize = 16,
  iconClassName,
  title,
  type = "button",
  ...buttonProps
}: Readonly<RefreshButtonProps>) {
  return (
    <Button
      type={type}
      onClick={onClick}
      title={title ?? "Refresh"}
      {...buttonProps}
    >
      <RefreshCcw
        size={iconSize}
        className={cn(
          "transition",
          isRefreshing && "animate-spin",
          iconClassName
        )}
      />
      {label}
    </Button>
  );
}
