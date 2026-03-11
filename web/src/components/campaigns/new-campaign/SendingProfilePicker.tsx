import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Mail,
  CircleQuestionMark,
  Send,
  Loader2,
  X,
  Search,
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

interface SendingProfile {
  id: number;
  name: string;
  from_email: string;
  smtp_host: string;
}

export default function SendingProfilePicker() {
  const { data, updateData } = useCampaign();
  const { keycloak } = useKeycloak();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const anchorRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Fetch sending profiles from API
  const [sendingProfiles, setSendingProfiles] = useState<SendingProfile[]>([]);
  const [sendingProfilesLoading, setSendingProfilesLoading] = useState(false);
  const [sendingProfilesError, setSendingProfilesError] = useState<
    string | null
  >(null);

  const API_BASE = useMemo(() => import.meta.env.VITE_API_URL, []);

  useEffect(() => {
    const fetchSendingProfiles = async () => {
      setSendingProfilesLoading(true);
      setSendingProfilesError(null);
      try {
        const res = await fetch(`${API_BASE}/sending-profiles`, {
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to load sending profiles (${res.status})`);
        }
        const json = (await res.json()) as SendingProfile[];
        setSendingProfiles(json);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load sending profiles";
        setSendingProfilesError(message);
      } finally {
        setSendingProfilesLoading(false);
      }
    };
    fetchSendingProfiles();
  }, [API_BASE, keycloak.token]);

  const unselectedProfiles = useMemo(
    () =>
      sendingProfiles.filter((p) => !data.sending_profile_ids.includes(p.id)),
    [sendingProfiles, data.sending_profile_ids],
  );

  const filteredProfiles = useMemo(() => {
    const search = inputValue.toLowerCase().trim();
    if (!search) return unselectedProfiles;
    return unselectedProfiles.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.from_email.toLowerCase().includes(search),
    );
  }, [unselectedProfiles, inputValue]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      setHighlightedIndex(-1);
      setOpen(val.trim() !== "");
    },
    [],
  );

  const handleSelectProfile = useCallback(
    (profileId: number) => {
      updateData({
        sending_profile_ids: data.sending_profile_ids.includes(profileId)
          ? data.sending_profile_ids.filter((id) => id !== profileId)
          : [...data.sending_profile_ids, profileId],
      });
      setInputValue("");
      setHighlightedIndex(-1);
      setOpen(false);
    },
    [data.sending_profile_ids, updateData],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, profiles: SendingProfile[]) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev < profiles.length - 1 ? prev + 1 : 0;
          itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : profiles.length - 1;
          itemRefs.current[next]?.scrollIntoView({ block: "nearest" });
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < profiles.length) {
          handleSelectProfile(profiles[highlightedIndex].id);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    },
    [open, highlightedIndex, handleSelectProfile],
  );

  const anchorWidth = anchorRef.current?.offsetWidth;

  const renderContent = () => {
    if (sendingProfilesLoading) {
      return (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={16} />
          Loading sending profiles...
        </div>
      );
    }

    if (sendingProfilesError) {
      return (
        <div className="flex items-center gap-2 p-2 rounded bg-rose-50 border border-rose-200 text-rose-700">
          <CircleQuestionMark size={14} />
          <span>{sendingProfilesError}</span>
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
                onKeyDown={(e) => handleKeyDown(e, filteredProfiles)}
                placeholder="Search profiles by name or email..."
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
                {filteredProfiles.length === 0 ? (
                  <p className="font-medium text-center text-sm py-3 text-slate-400">
                    No sending profile found
                  </p>
                ) : (
                  filteredProfiles.map((profile, idx) => (
                    <button
                      key={profile.id}
                      ref={(el) => {
                        itemRefs.current[idx] = el;
                      }}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectProfile(profile.id);
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
                          {profile.name}
                        </span>
                        <span className="text-sm text-slate-500 leading-none">
                          {profile.from_email} • {profile.smtp_host}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Selected Profiles Section */}
        <div className="flex flex-col gap-3 mt-4 h-full">
          <div className="flex items-center justify-between max-w-2xl">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              Selected Profiles
              <span className="flex items-center justify-center bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 text-[10px]">
                {data.sending_profile_ids.length}
              </span>
            </h3>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 max-w-2xl">
            {data.sending_profile_ids.length > 0 ? (
              data.sending_profile_ids.map((id) => {
                const profile = sendingProfiles.find((p) => p.id === id);
                if (!profile) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-purple-200 transition-colors w-full"
                  >
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                        <Mail className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex flex-col text-left truncate">
                        <span className="text-[14px] font-medium text-slate-700 leading-tight truncate">
                          {profile.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[12px] text-slate-500">
                          <span className="truncate">{profile.from_email}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="truncate">{profile.smtp_host}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectProfile(id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-4 shrink-0"
                      title="Remove profile"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400 transition-all h-full gap-1">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Mail className="w-6 h-6 opacity-40 text-slate-400" />
                </div>
                <p className="text-sm text-center font-semibold text-slate-500">
                  No sending profiles selected
                </p>
                <p className="text-[12px] text-center text-slate-400">
                  Search and select profiles using the bar above
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
          <Send size={12} />
          Sending Profiles
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
                  <p>Used as a fallback if the phishing kit's profile fails.</p>
                  <p>Recommended for guaranteed email delivery.</p>
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
