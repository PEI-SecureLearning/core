import React, { useState } from "react";
import { Plus, Check } from "lucide-react";

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
          className="p-2 rounded-full text-white flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
            boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)'
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      ) : (
        <div
          className="relative flex items-center rounded-full overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(147, 51, 234, 0.3)',
            boxShadow: '0 2px 8px rgba(147, 51, 234, 0.1)'
          }}
        >
          {/* Hashtag prefix */}
          <span className="pl-3 text-purple-500 text-[13px] font-medium">
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
            className="bg-transparent px-1.5 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none w-32"
            placeholder="tag name"
          />

          {/* Check button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!tempTag.trim()}
            className="p-1.5 mr-1 rounded-full transition-all duration-150 disabled:opacity-40"
            style={{
              background: tempTag.trim() ? 'rgba(34, 197, 94, 0.9)' : 'rgba(148, 163, 184, 0.3)',
            }}
          >
            <Check size={14} strokeWidth={3} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TagInput;
