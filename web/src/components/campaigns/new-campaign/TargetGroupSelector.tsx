import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface Group {
  id: number;
  name: string;
  color: string;
}

export default function TargetGroupSelector() {
  const mockGroups: Group[] = [
    { id: 1, name: "Finance Department", color: "purple" },
    { id: 2, name: "Human Resources", color: "pink" },
    { id: 3, name: "IT Support", color: "blue" },
    { id: 4, name: "Marketing Team", color: "green" },
    { id: 5, name: "Sales Team", color: "yellow" },
    { id: 6, name: "Executives", color: "red" },
  ];

  const [selected, setSelected] = useState<Group[]>([]);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const filtered = mockGroups.filter(
    (g) =>
      g.name.toLowerCase().includes(query.toLowerCase()) &&
      !selected.some((s) => s.id === g.id)
  );

  const handleSelect = (group: Group) => {
    setSelected([...selected, group]);
    setQuery("");
    setHighlightedIndex(0);
  };

  const handleRemove = (id: number) => {
    setSelected(selected.filter((g) => g.id !== id));
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

  const colorMap: Record<string, string> = {
    purple: "bg-purple-600",
    pink: "bg-pink-500",
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-500 text-gray-800",
    red: "bg-red-600",
  };

  return (
    <div className="w-full max-w-lg h-full flex flex-col gap-2 px-2 overflow-y-auto">
      <label className="font-medium mb-1">Target Groups</label>

      <div className="relative w-full">
        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search groups..."
          className="w-full border rounded px-3 py-2"
        />

        {/* Dropdown: positioned absolutely relative to input wrapper */}
        {query.length > 0 && filtered.length > 0 && (
          <ul
            ref={dropdownRef}
            className="absolute top-full left-0 mt-1 w-full max-h-40 overflow-y-auto border rounded bg-white z-50 shadow"
          >
            {filtered.map((group, index) => (
              <li
                key={group.id}
                onClick={() => handleSelect(group)}
                className={cn(
                  "px-3 py-2 cursor-pointer text-sm",
                  index === highlightedIndex
                    ? "bg-purple-100"
                    : "hover:bg-gray-100"
                )}
              >
                {group.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected groups */}
      {selected.length > 0 && (
        <ul className="flex flex-col gap-2 mt-2 overflow-y-auto max-h-64 border-2 bg-gray-100 p-2 rounded">
          {selected.map((group) => (
            <li
              key={group.id}
              className={cn(
                "flex justify-between gap-2 px-4 py-2 rounded text-white text-sm font-medium w-full",
                colorMap[group.color] || "bg-gray-500"
              )}
            >
              {group.name}
              <button
                type="button"
                onClick={() => handleRemove(group.id)}
                className="ml-2 text-white hover:text-gray-200 font-bold"
              >
                <X />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
