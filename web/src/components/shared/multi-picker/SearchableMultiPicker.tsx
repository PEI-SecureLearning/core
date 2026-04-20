import { useCallback, useMemo, useRef, useState, type ReactNode, type FocusEvent } from "react";
import { CircleQuestionMark, Loader2 } from "lucide-react";

import FormTooltip, {
  type FormTooltipSide
} from "@/components/shared/FormTooltip";
import SearchBar from "@/components/shared/SearchBar";
import {
  Popover,
  PopoverAnchor,
  PopoverContent
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

type PickerItemId = string | number;

interface SearchableMultiPickerProps<
  T extends { id: TId },
  TId extends PickerItemId
> {
  readonly items: readonly T[];
  readonly selectedIds: readonly TId[];
  readonly onSelectedIdsChange: (ids: TId[]) => void;
  readonly getSearchText: (item: T) => string;
  readonly renderSuggestionItem: (
    item: T,
    highlighted: boolean,
    onSelect: () => void,
    bindRef: (el: HTMLButtonElement | null) => void,
    onHighlight: () => void
  ) => ReactNode;
  readonly renderSelectedItem: (item: T, onRemove: () => void) => ReactNode;
  readonly renderEmptySelected: ReactNode;
  readonly label: string;
  readonly labelIcon: ReactNode;
  readonly tooltipLines?: readonly string[];
  readonly tooltipSide?: FormTooltipSide;
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
  TId extends PickerItemId
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
  tooltipSide = "right",
  selectedTitle,
  searchPlaceholder,
  loading,
  loadingText,
  error,
  noResultsText,
  maxSuggestions = 5
}: Readonly<SearchableMultiPickerProps<T, TId>>) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const anchorRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const unselectedItems = useMemo(
    () => items.filter((item) => !selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  const filteredItems = useMemo(() => {
    const search = inputValue.toLowerCase().trim();
    const matched = search
      ? unselectedItems.filter((item) =>
        getSearchText(item).toLowerCase().includes(search)
      )
      : unselectedItems;
    return matched.slice(0, maxSuggestions);
  }, [getSearchText, inputValue, maxSuggestions, unselectedItems]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    setHighlightedIndex(-1);
    setOpen(true);
  }, []);

  const handleToggleSelection = useCallback(
    (itemId: TId) => {
      onSelectedIdsChange(
        selectedIds.includes(itemId)
          ? selectedIds.filter((id) => id !== itemId)
          : [...selectedIds, itemId]
      );
      setInputValue("");
      setHighlightedIndex(-1);
      setOpen(false);
    },
    [onSelectedIdsChange, selectedIds]
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
    [filteredItems, handleToggleSelection, highlightedIndex, open]
  );

  const anchorWidth = anchorRef.current?.offsetWidth;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm w-full">
        <Loader2 className="animate-spin" size={16} />
        {loadingText}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 border border-destructive/30 text-destructive w-full">
        <CircleQuestionMark size={14} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col gap-4  overflow-y-auto">
      <div className="flex flex-col gap-3 relative w-full h-full">
        <label className="text-[12px] font-normal text-muted-foreground tracking-wide uppercase flex items-center gap-1.5">
          {labelIcon}
          {label}
          {tooltipLines && tooltipLines.length > 0 && (
            <FormTooltip side={tooltipSide} content={tooltipLines} />
          )}
        </label>

        <Popover
          open={open}
          onOpenChange={(nextOpen: boolean) => {
            if (nextOpen) setOpen(true);
          }}
          modal={false}
        >
          <PopoverAnchor asChild>
            <div ref={anchorRef} className="relative flex items-center ">
              <SearchBar
                value={inputValue}
                onChange={handleInputChange}
                placeholder={searchPlaceholder}
                className="flex-1 bg-background"
                inputClassName="rounded-md h-[46px] text-[14px]  border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary transition"
                iconClassName="left-3 h-[15px] w-[15px]"
                inputProps={{
                  onFocus: () => setOpen(true),
                  onClick: () => setOpen(true),
                  onBlur: () => setOpen(false),
                  onKeyDown: handleKeyDown,
                  autoComplete: "off",
                  autoCorrect: "off",
                  spellCheck: false,
                  role: "combobox",
                  "aria-expanded": open,
                  "aria-autocomplete": "list"
                }}
              />
            </div>
          </PopoverAnchor>

          <PopoverContent
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e: Event) => e.preventDefault()}
            onFocusOutside={(e: FocusEvent | Event) => e.preventDefault()}
            style={{ width: anchorWidth ?? "100%" }}
            className="p-0 shadow-lg border-border bg-popover"
          >
            <ScrollArea>
              <div className="p-1">
                {filteredItems.length === 0 ? (
                  <p className="font-medium text-center text-sm py-3 text-muted-foreground">
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
                      () => setHighlightedIndex(idx)
                    )
                  )
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <div className="flex flex-col gap-3 mt-4 h-full overflow-hidden">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span>{selectedTitle}</span>
              <span className="flex items-center justify-center bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px]">
                {selectedIds.length}
              </span>
            </h3>
          </div>

          <ScrollArea className="w-full h-full rounded-xl border-2 border-dashed border-border bg-background">
            <div
              className={
                selectedIds.length > 0
                  ? "flex flex-col gap-2 p-4 h-full"
                  : "flex h-full items-center justify-center align-middle p-4"
              }
            >
              {selectedIds.length > 0
                ? selectedIds.map((id) => {
                  const item = items.find((candidate) => candidate.id === id);
                  if (!item) return null;
                  return renderSelectedItem(item, () =>
                    handleToggleSelection(id)
                  );
                })
                : renderEmptySelected}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
