import React, { useState } from "react";

interface TagInputProps {
  onAdd: (tag: string) => void;
}

const TagInput: React.FC<TagInputProps> = ({ onAdd }) => {
  const [adding, setAdding] = useState(false);
  const [tempTag, setTempTag] = useState("");

  const handleAdd = () => {
    if (!tempTag.trim()) return;

    onAdd(tempTag.trim()); // value has no "#" prefix
    setTempTag("");
    setAdding(false);
  };

  return (
    <div>
      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="size-8 cursor- rounded-full bg-purple-600 text-white flex items-center justify-center text-xl hover:bg-purple-700 transition"
        >
          +
        </button>
      ) : (
        <div className="relative w-48">
          {/* Hashtag prefix */}
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
            #
          </span>

          {/* Input */}
          <input
            type="text"
            autoFocus
            value={tempTag}
            onChange={(e) => setTempTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="border rounded px-5 pr-8 py-1 text-sm w-full"
            placeholder="tag"
          />

          {/* Check button */}
          <button
            type="button"
            onClick={handleAdd}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-800 text-lg"
          >
            ✔
          </button>
        </div>
      )}
    </div>
  );
};

export default TagInput;
