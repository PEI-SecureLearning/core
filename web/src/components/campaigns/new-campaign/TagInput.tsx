import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  onAdd: (tag: string) => void;
}

const TagInput: React.FC<TagInputProps> = ({ onAdd }) => {
  const [adding, setAdding] = useState(false);
  const [tempTag, setTempTag] = useState("");

  const handleAdd = () => {
    if (!tempTag.trim()) return;

    onAdd(tempTag.trim());
    setTempTag("");
    setAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    } else if (e.key === "Escape") {
      setTempTag("");
      setAdding(false);
    }
  };

  return (
    <div>
      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="p-2 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 shadow-lg shadow-primary/30"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      ) : (
        <div
          className="relative flex items-center rounded-full overflow-hidden bg-background/80 backdrop-blur-md border border-primary/30 shadow-lg shadow-primary/10"
        >
          {/* Hashtag prefix */}
          <span className="pl-3 text-primary/90 text-[13px] font-medium">
            #
          </span>

          {/* Input */}
          <input
            type="text"
            autoFocus
            value={tempTag}
            onChange={(e) => setTempTag(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!tempTag.trim()) {
                setAdding(false);
              }
            }}
            className="bg-transparent px-1.5 py-2 text-[13px] text-foreground/90 placeholder:text-muted-foreground/70 outline-none w-32"
            placeholder="tag name"
          />

          {/* Check button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!tempTag.trim()}
            className={cn(
                "p-1.5 mr-1 rounded-full transition-all duration-150 disabled:opacity-40",
                tempTag.trim() ? "bg-success text-success-foreground" : "bg-muted-foreground/30 text-muted-foreground"
            )}
          >
            <Check size={14} strokeWidth={3} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TagInput;
