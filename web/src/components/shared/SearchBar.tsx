import { type ComponentPropsWithoutRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NativeInputProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  "value" | "onChange" | "placeholder" | "className" | "type"
>;

interface SearchBarProps {
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly inputClassName?: string;
  readonly iconClassName?: string;
  readonly type?: "text" | "search";
  readonly inputProps?: NativeInputProps;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
  inputClassName,
  iconClassName,
  type = "text",
  inputProps
}: Readonly<SearchBarProps>) {
  return (
    <div className={cn("relative rounded-md", className)}>
      <Search
        className={cn(
          "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary ",
          iconClassName
        )}
      />
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className={cn("w-full pl-10", inputClassName)}
        {...inputProps}
      />
    </div>
  );
}
