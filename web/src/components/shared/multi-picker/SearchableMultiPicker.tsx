import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { CircleQuestionMark, Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PickerItemId = string | number;

interface SearchableMultiPickerProps<T extends { id: TId }, TId extends PickerItemId> {
  readonly items: readonly T[];
  readonly selectedIds: readonly TId[];
  readonly onSelectedIdsChange: (ids: TId[]) => void;
  readonly getSearchText: (item: T) => string;
  readonly renderSuggestionItem: (
    item: T,
    highlighted: boolean,
    onSelect: () => void,
    bindRef: (el: HTMLButtonElement | null) => void,
    onHighlight: () => void,
  ) => ReactNode;
  readonly renderSelectedItem: (item: T, onRemove: () => void) => ReactNode;
  readonly renderEmptySelected: ReactNode;
  readonly label: string;
  readonly labelIcon: ReactNode;
  readonly tooltipLines?: readonly string[];
  readonly selectedTitle: string;
  readonly searchPlaceholder: string;
  readonly loading: boolean;
  readonly loadingText: string;
  readonly error: string | null;
  readonly noResultsText: string;
  readonly maxSuggestions?: number;
}

export default function SearchableMultiPicker<
  T extends { id: TId },
  TId extends PickerItemId,
>({
  items,
  selectedIds,
  onSelectedIdsChange,
  getSearchText,
  renderSuggestionItem,
  renderSelectedItem,
  renderEmptySelected,
  label,
  labelIcon,
  tooltipLines,
  selectedTitle,
  searchPlaceholder,
  loading,
  loadingText,
  error,
  noResultsText,
  maxSuggestions = 5,
}: Readonly<SearchableMultiPickerProps<T, TId>>) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const anchorRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const unselectedItems = useMemo(
    () => items.filter((item) => !selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  const filteredItems = useMemo(() => {
    const search = inputValue.toLowerCase().trim();
    const matched = search
      ? unselectedItems.filter((item) =>
          getSearchText(item).toLowerCase().includes(search),
        )
      : unselectedItems;
    return matched.slice(0, maxSuggestions);
  }, [getSearchText, inputValue, maxSuggestions, unselectedItems]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      setHighlightedIndex(-1);
      setOpen(true);
    },
    [],
  );

  const handleToggleSelection = useCallback(
    (itemId: TId) => {
      onSelectedIdsChange(
        selectedIds.includes(itemId)
          ? selectedIds.filter((id) => id !== itemId)
          : [...selectedIds, itemId],
      );
      setInputValue("");
      setHighlightedIndex(-1);
      setOpen(false);
    },
    [onSelectedIdsChange, selectedIds],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") setOpen(true);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev < filteredItems.length - 1 ? prev + 1 : 0;
          itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : filteredItems.length - 1;
          itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
          handleToggleSelection(filteredItems[highlightedIndex].id);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    },
    [filteredItems, handleToggleSelection, highlightedIndex, open],
  );

  const anchorWidth = anchorRef.current?.offsetWidth;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <Loader2 className="animate-spin" size={16} />
        {loadingText}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-rose-50 border border-rose-200 text-rose-700">
        <CircleQuestionMark size={14} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col gap-4 p-2 overflow-y-auto">
      <div className="flex flex-col gap-3 relative w-full h-full">
        <label className="text-[12px] font-normal text-slate-500 tracking-wide uppercase flex items-center gap-1.5">
          {labelIcon}
          {label}
          {tooltipLines && tooltipLines.length > 0 && (
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <CircleQuestionMark size={14} className="text-purple-500" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-purple-50 border-purple-200 text-purple-800"
                >
                  <div className="text-[12px] font-medium space-y-1 max-w-[300px]">
                    {tooltipLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </label>

        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            if (nextOpen) setOpen(true);
          }}
          modal={false}
        >
          <PopoverAnchor asChild>
            <div
              ref={anchorRef}
              className="w-full max-w-2xl relative flex items-center"
            >
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="pl-9 h-[46px] text-[14px] bg-white/70 border-slate-300/50 focus-visible:ring-1 focus-visible:ring-purple-200/50 focus-visible:border-purple-500/50 focus-visible:transition transition backdrop-blur-md"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                role="combobox"
                aria-expanded={open}
                aria-autocomplete="list"
              />
              <Search
                size={15}
                className="absolute left-3 text-purple-600 font-bold pointer-events-none"
              />
            </div>
          </PopoverAnchor>

          <PopoverContent
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onFocusOutside={(e) => e.preventDefault()}
            style={{ width: anchorWidth ?? "100%" }}
            className="p-0 shadow-lg border-slate-200"
          >
            <ScrollArea className="max-h-[250px]">
              <div className="p-1">
                {filteredItems.length === 0 ? (
                  <p className="font-medium text-center text-sm py-3 text-slate-400">
                    {noResultsText}
                  </p>
                ) : (
                  filteredItems.map((item, idx) =>
                    renderSuggestionItem(
                      item,
                      highlightedIndex === idx,
                      () => handleToggleSelection(item.id),
                      (el) => {
                        itemRefs.current[idx] = el;
                      },
                      () => setHighlightedIndex(idx),
                    ),
                  )
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <div className="flex flex-col gap-3 mt-4 h-full overflow-hidden">
          <div className="flex items-center justify-between max-w-2xl">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span>{selectedTitle}</span>
              <span className="flex items-center justify-center bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 text-[10px]">
                {selectedIds.length}
              </span>
            </h3>
          </div>

          <ScrollArea className="max-w-2xl h-full min-h-[180px] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30">
            <div className="flex flex-col gap-2 p-4 min-h-full">
              {selectedIds.length > 0
                ? selectedIds.map((id) => {
                    const item = items.find((candidate) => candidate.id === id);
                    if (!item) return null;
                    return renderSelectedItem(item, () => handleToggleSelection(id));
                  })
                : renderEmptySelected}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
