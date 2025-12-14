import { useState, useRef, useEffect, useMemo } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { cn } from "@/lib/utils";
import { X, Loader2, Users } from "lucide-react";
import { useCampaign } from "./CampaignContext";
import { fetchGroups } from "@/services/userGroupsApi";

interface Group {
  id: string;
  name: string;
  path?: string;
}

export default function TargetGroupSelector() {
  const { data, updateData } = useCampaign();
  const { keycloak } = useKeycloak();

  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const dropdownRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const realm = useMemo(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
  }, [keycloak.tokenParsed]);

  // Fetch groups from API
  useEffect(() => {
    if (!realm) return;

    const loadGroups = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchGroups(realm, keycloak.token || undefined);
        setGroups(
          (response.groups || []).map((g) => ({
            id: g.id || "",
            name: g.name || "",
            path: g.path,
          }))
        );
      } catch (err) {
        console.error("Failed to load groups:", err);
        setError("Failed to load groups");
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, [realm, keycloak.token]);

  // Get selected groups from context
  const selectedGroups = groups.filter((g) =>
    data.user_group_ids.includes(g.id)
  );

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(query.toLowerCase()) &&
      !data.user_group_ids.includes(g.id)
  );

  const handleSelect = (group: Group) => {
    updateData({ user_group_ids: [...data.user_group_ids, group.id] });
    setQuery("");
    setHighlightedIndex(0);
  };

  const handleRemove = (id: string) => {
    updateData({
      user_group_ids: data.user_group_ids.filter((gId) => gId !== id),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filtered.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        handleSelect(filtered[highlightedIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setQuery("");
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    const dropdown = dropdownRef.current;
    if (!dropdown) return;
    const activeItem = dropdown.children[highlightedIndex] as HTMLElement;
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const inputStyle = {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        <span className="ml-2 text-slate-500">Loading groups...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-4 p-2 overflow-hidden">
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-normal text-slate-500 tracking-wide uppercase">
          Target Groups <span className="text-rose-400">*</span>
        </label>

        <div className="relative w-full max-w-md">
          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Delay to allow click on dropdown item
              setTimeout(() => setIsFocused(false), 150);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search groups..."
            className="w-full rounded-xl px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
            style={inputStyle}
          />

          {/* Dropdown - show when focused */}
          {isFocused && filtered.length > 0 && (
            <ul
              ref={dropdownRef}
              className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-white z-50 shadow-lg border border-slate-200"
            >
              {filtered.map((group, index) => (
                <li
                  key={group.id}
                  onClick={() => handleSelect(group)}
                  className={cn(
                    "px-4 py-2.5 cursor-pointer text-[14px]",
                    index === highlightedIndex
                      ? "bg-purple-100 text-purple-700"
                      : "hover:bg-slate-50"
                  )}
                >
                  {group.name}
                </li>
              ))}
            </ul>
          )}

          {isFocused && filtered.length === 0 && (
            <div className="absolute top-full left-0 mt-1 w-full rounded-xl bg-white z-50 shadow-lg border border-slate-200 p-4 text-center">
              <p className="text-slate-500 text-[14px]">
                {groups.length === 0
                  ? "No groups available"
                  : query.length > 0
                    ? "No groups match your search"
                    : "All groups have been selected"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Selected groups */}
      <div className="flex-1 overflow-y-auto">
        {selectedGroups.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] text-slate-500 uppercase tracking-wide">
              Selected ({selectedGroups.length})
            </p>
            <ul className="flex flex-col gap-2">
              {selectedGroups.map((group) => (
                <li
                  key={group.id}
                  className="flex justify-between items-center gap-2 px-4 py-3 rounded-xl text-[14px] font-medium"
                  style={{
                    background: "rgba(147, 51, 234, 0.1)",
                    border: "1px solid rgba(147, 51, 234, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-purple-600" />
                    <span className="text-purple-700">{group.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(group.id)}
                    className="p-1 rounded-full hover:bg-purple-200/60 transition-colors"
                  >
                    <X size={16} className="text-purple-600" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users size={40} className="text-slate-300 mb-3" />
            <p className="text-slate-500 text-[14px]">No groups selected</p>
            <p className="text-slate-400 text-[13px]">
              Search and select target groups above
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
