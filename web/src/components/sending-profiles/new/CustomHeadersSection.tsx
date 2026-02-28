import { memo, useState } from "react";
import { Plus, X, List } from "lucide-react";
import { type CustomHeader } from "@/types/sendingProfile";

interface Props {
  headers: CustomHeader[];
  onAddHeader: (h: CustomHeader) => void;
  onRemoveHeader: (index: number) => void;
}

const HeaderRow = memo(function HeaderRow({
  header,
  onRemove,
}: {
  header: CustomHeader;
  onRemove: () => void;
}) {
  return (
    <div className="liquid-list-item flex items-center justify-between p-3 mb-2">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
          H
        </div>
        <div className="min-w-0 flex flex-col md:flex-row md:items-center md:gap-2">
          <span className="font-medium text-gray-800 truncate">
            {header.name}:
          </span>
          <span className="text-sm text-gray-500 truncate font-mono bg-white/50 px-1 rounded">
            {header.value}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50/80 rounded-xl transition-transform hover:scale-110 active:scale-95"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});

function CustomHeadersSection({ headers, onAddHeader, onRemoveHeader }: Props) {
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (newName && newValue) {
      onAddHeader({ name: newName, value: newValue });
      setNewName("");
      setNewValue("");
    }
  };

  return (
    <div className="liquid-glass-card p-6 relative z-10">
      <h4 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
        <List className="h-5 w-5 text-purple-500" />
        Custom Headers (Optional)
      </h4>

      {/* Inputs to add new */}
      <div className="flex flex-col md:flex-row gap-3 mb-5 items-end">
        <div className="flex-1 w-full">
          <label className="text-xs text-gray-500 ml-1">Header Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="X-Priority"
            className="liquid-glass-input w-full px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="text-xs text-gray-500 ml-1">Value</label>
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="1"
            className="liquid-glass-input w-full px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleAdd}
          type="button"
          disabled={!newName || !newValue}
          className="liquid-glass-button-secondary p-2.5 disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* List */}
      <div className="max-h-60 purple-scrollbar overflow-y-auto pr-1">
        {headers.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-300 rounded-xl">
            No custom headers added
          </div>
        ) : (
          headers.map((h, i) => (
            <HeaderRow key={i} header={h} onRemove={() => onRemoveHeader(i)} />
          ))
        )}
      </div>
    </div>
  );
}

export default memo(CustomHeadersSection);
