import { memo, useState } from "react";
import { Plus, X, List } from "lucide-react";
import { type CustomHeader } from "@/types/sendingProfile";
import { toast } from "sonner";

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
    <div className="flex items-center justify-between p-3 mb-2 rounded-lg bg-surface-subtle border border-border">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
          H
        </div>
        <div className="min-w-0 flex flex-col md:flex-row md:items-center md:gap-2">
          <span className="font-medium text-foreground truncate">
            {header.name}:
          </span>
          <span className="text-sm text-muted-foreground truncate font-mono bg-muted px-1 rounded">
            {header.value}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
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
    
    const alreadyExists = headers.some(
      h => h.name === newName
    );

    if (alreadyExists) {
      toast.error("Header already exists.")
      return
    }

    if (newName && newValue) {
      onAddHeader({ name: newName, value: newValue });
      setNewName("");
      setNewValue("");
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h4 className="text-foreground font-semibold mb-4 flex items-center gap-2">
        <List className="h-5 w-5 text-primary/90" />
        Custom Headers (Optional)
      </h4>

      {/* Inputs to add new */}
      <div className="flex flex-col md:flex-row gap-3 mb-5 items-end">
        <div className="flex-1 w-full">
          <label className="text-xs text-muted-foreground ml-1">Header Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="X-Priority"
            className="w-full px-3 py-2 rounded-md text-sm bg-surface-subtle border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="text-xs text-muted-foreground ml-1">Value</label>
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="1"
            className="w-full px-3 py-2 rounded-md text-sm bg-surface-subtle border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
        <button
          onClick={handleAdd}
          type="button"
          disabled={!newName || !newValue}
          className="p-2.5 rounded-lg border border-border bg-surface hover:bg-surface-subtle text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* List */}
      <div className="h-44 overflow-y-auto pr-1">
        {headers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground/70 text-sm border border-dashed border-border rounded-lg">
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
