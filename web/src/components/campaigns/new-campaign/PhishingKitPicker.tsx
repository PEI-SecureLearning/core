import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Package,
  CircleQuestionMark,
  Send,
  Loader2,
  X,
  Search,
  Mail,
  Layout,
} from "lucide-react";
import { useCampaign } from "./CampaignContext";
import { useKeycloak } from "@react-keycloak/web";
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

interface PhishingKit {
  id: number;
  name: string;
  description?: string;
  email_template_name: string | null;
  landing_page_template_name: string | null;
  sending_profile_names: string[];
}

export default function PhishingKitPicker() {
  const { data, updateData } = useCampaign();
  const { keycloak } = useKeycloak();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const anchorRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Fetch phishing kits from API
  const [kits, setKits] = useState<PhishingKit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = useMemo(() => import.meta.env.VITE_API_URL, []);

  useEffect(() => {
    const fetchKits = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/phishing-kits`, {
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to load phishing kits (${res.status})`);
        }
        const json = (await res.json()) as PhishingKit[];
        setKits(json);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load phishing kits";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchKits();
  }, [API_BASE, keycloak.token]);

  const unselectedKits = useMemo(
    () =>
      kits.filter((p) => !data.phishing_kit_ids.includes(p.id)),
    [kits, data.phishing_kit_ids],
  );

  const filteredKits = useMemo(() => {
    const search = inputValue.toLowerCase().trim();
    if (!search) return unselectedKits;
    return unselectedKits.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        (p.description || "").toLowerCase().includes(search)
    );
  }, [unselectedKits, inputValue]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      setHighlightedIndex(-1);
      setOpen(val.trim() !== "");
    },
    [],
  );

  const handleSelectKit = useCallback(
    (kitId: number) => {
      updateData({
        phishing_kit_ids: data.phishing_kit_ids.includes(kitId)
          ? data.phishing_kit_ids.filter((id) => id !== kitId)
          : [...data.phishing_kit_ids, kitId],
      });
      setInputValue("");
      setHighlightedIndex(-1);
      setOpen(false);
    },
    [data.phishing_kit_ids, updateData],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, activeKits: PhishingKit[]) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev < activeKits.length - 1 ? prev + 1 : 0;
          itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : activeKits.length - 1;
          itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < activeKits.length) {
          handleSelectKit(activeKits[highlightedIndex].id);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    },
    [open, highlightedIndex, handleSelectKit],
  );

  const anchorWidth = anchorRef.current?.offsetWidth;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={16} />
          Loading phishing kits...
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
      <div className="flex flex-col gap-3 relative w-full h-full">
        {/* Search Input with Popover */}
        <Popover open={open} onOpenChange={setOpen} modal={false}>
          <PopoverAnchor asChild>
            <div
              ref={anchorRef}
              className="w-full max-w-2xl relative flex items-center"
            >
              <Search
                size={15}
                className="absolute left-3 text-slate-400 pointer-events-none"
              />
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => handleKeyDown(e, filteredKits)}
                placeholder="Search phishing kits by name..."
                className="pl-9 h-[46px] text-[14px] bg-white/70 border-slate-200/50 focus-visible:ring-purple-500/20 focus-visible:border-purple-300 backdrop-blur-md"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                role="combobox"
                aria-expanded={open}
                aria-autocomplete="list"
              />
            </div>
          </PopoverAnchor>

          <PopoverContent
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            style={{ width: anchorWidth ?? "100%" }}
            className="p-0 shadow-lg border-slate-200"
          >
            <ScrollArea className="max-h-[250px]">
              <div className="p-1">
                {filteredKits.length === 0 ? (
                  <p className="font-medium text-center text-sm py-3 text-slate-400">
                    No phishing kit found
                  </p>
                ) : (
                  filteredKits.map((kit, idx) => (
                    <button
                      key={kit.id}
                      ref={(el) => {
                        itemRefs.current[idx] = el;
                      }}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectKit(kit.id);
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full flex justify-between items-center px-4 py-3 rounded-md cursor-pointer text-left transition-colors ${
                        highlightedIndex === idx
                          ? "bg-slate-100 ring-1 ring-inset ring-slate-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium text-slate-700 text-sm leading-none">
                          {kit.name}
                        </span>
                        <span className="text-xs text-slate-500 max-w-sm truncate">
                          {kit.description || "No description"}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Selected Kits Section */}
        <div className="flex flex-col gap-3 mt-4 h-full">
          <div className="flex items-center justify-between max-w-2xl">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              Selected Kits
              <span className="flex items-center justify-center bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 text-[10px]">
                {data.phishing_kit_ids.length}
              </span>
            </h3>
          </div>

          <div className="flex flex-col gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 max-w-2xl">
            {data.phishing_kit_ids.length > 0 ? (
              data.phishing_kit_ids.map((id) => {
                const kit = kits.find((k) => k.id === id);
                if (!kit) return null;
                return (
                  <div
                    key={id}
                    className="flex items-start justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-purple-200 transition-colors w-full"
                  >
                    <div className="flex items-start gap-4 overflow-hidden w-full">
                      <div className="w-10 h-10 mt-1 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex flex-col text-left truncate w-full">
                        <span className="text-[15px] font-semibold text-slate-800 leading-tight truncate">
                          {kit.name}
                        </span>
                        {kit.description && (
                          <span className="text-[13px] text-slate-500 mt-1 truncate whitespace-normal">
                            {kit.description}
                          </span>
                        )}
                        <div className="flex items-center flex-wrap gap-3 mt-3">
                          {kit.email_template_name && (
                            <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200">
                              <Mail size={12} className="text-slate-500" />
                              <span className="text-[12px] font-medium text-slate-700 truncate max-w-[150px]">
                                {kit.email_template_name}
                              </span>
                            </div>
                          )}
                          {kit.landing_page_template_name && (
                            <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200">
                              <Layout size={12} className="text-slate-500" />
                              <span className="text-[12px] font-medium text-slate-700 truncate max-w-[150px]">
                                {kit.landing_page_template_name}
                              </span>
                            </div>
                          )}
                          {kit.sending_profile_names && kit.sending_profile_names.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200">
                              <Send size={12} className="text-slate-500" />
                              <span className="text-[12px] font-medium text-slate-700 truncate max-w-[150px]">
                                {kit.sending_profile_names.length} Profile(s)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectKit(id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-4 shrink-0"
                      title="Remove kit"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 transition-all h-full gap-2">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                  <Package className="w-7 h-7 opacity-40 text-slate-400" />
                </div>
                <p className="text-sm text-center font-semibold text-slate-500">
                  No phishing kits selected
                </p>
                <p className="text-[12px] text-center text-slate-400">
                  Search and select kits using the bar above
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col gap-4 p-2 overflow-y-auto">
      <div className="flex flex-col gap-2 h-full">
        <label className="text-[12px] font-normal text-slate-500 tracking-wide uppercase flex items-center gap-1.5">
          <Package size={12} />
          Phishing Kits
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
                  <p>Select one or more phishing kits to use in this campaign.</p>
                  <p>A random kit will be chosen for each target user.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </label>
        {renderContent()}
      </div>
    </div>
  );
}
