import { memo, useState } from "react";
import { Plus, X } from "lucide-react";
import { type CustomHeader } from "@/types/sendingProfile";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  headers: CustomHeader[];
  onAddHeader: (h: CustomHeader) => void;
  onRemoveHeader: (index: number) => void;
}

const HeaderRow = memo(function HeaderRow({
  header,
  onRemove
}: {
  header: CustomHeader;
  onRemove: () => void;
}) {
  return (
    <div className="flex w-full min-w-0 max-w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-border bg-surface pl-3 p-1">
      <div className="min-w-0 flex-1 overflow-hidden text-wrap wrap-break-word">
        <span className="font-mono text-sm text-primary">{header.name}: </span>
        <span className="font-mono text-sm text-foreground wrap-break-word break-all">
          {header.value}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={onRemove}
        className="text-primary hover:bg-primary/20 hover:text-primary rounded-full"
        aria-label={`Remove header ${header.name}`}
      >
        <X />
      </Button>
    </div>
  );
});

const SourcePreview = memo(function SourcePreview({
  headers
}: {
  headers: CustomHeader[];
}) {
  const previewText = headers.length
    ? headers.map((header) => `${header.name}: ${header.value}`).join("\n")
    : "No custom headers defined";

  return (
    <div className="size-full min-h-0 rounded-lg border border-border bg-surface-subtle overflow-hidden flex flex-col">
      <div className="border-b border-border bg-surface px-4 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Header Source Preview
        </p>
      </div>

      <pre className="flex-1 min-h-0 overflow-auto p-4 font-mono text-xs leading-6 text-foreground whitespace-pre-wrap wrap-break-word text-wrap">
        {previewText}
      </pre>
    </div>
  );
});

function CustomHeadersSection({
  headers,
  onAddHeader,
  onRemoveHeader
}: Readonly<Props>) {
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    const nextName = newName.trim();
    const nextValue = newValue.trim();

    if (!nextName || !nextValue) {
      return;
    }

    const alreadyExists = headers.some(
      (header) => header.name.toLowerCase() === nextName.toLowerCase()
    );

    if (alreadyExists) {
      toast.error("Header already exists.");
      return;
    }

    onAddHeader({ name: nextName, value: nextValue });
    setNewName("");
    setNewValue("");
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-5  md:grid-cols-2">
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden rounded-lg border border-border bg-surface p-5">
        <div className="grid shrink-0 grid-cols-1 items-end gap-3 md:grid-cols-10">
          <div className="md:col-span-3 space-y-1.5 h-full">
            <Label
              htmlFor="custom-header-name"
              className="text-xs text-muted-foreground uppercase tracking-wide"
            >
              Header Name
            </Label>
            <Input
              id="custom-header-name"
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="X-Priority"
              className=" rounded-md bg-surface-subtle border-border text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="md:col-span-6 space-y-1.5">
            <Label
              htmlFor="custom-header-value"
              className="text-xs text-muted-foreground uppercase tracking-wide"
            >
              Value
            </Label>
            <Input
              id="custom-header-value"
              type="text"
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="1"
              className=" rounded-md bg-surface-subtle border-border text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="md:col-span-1 flex md:justify-end">
            <Button
              onClick={handleAdd}
              type="button"
              size="icon-sm"
              className="rounded-full"
              disabled={!newName.trim() || !newValue.trim()}
              aria-label="Add custom header"
            >
              <Plus />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 basis-0 min-h-0 flex-col gap-2 overflow-hidden">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Header Entries ({headers.length})
          </p>

          <div className="flex flex-1 basis-0 min-h-0 max-h-full overflow-hidden rounded-lg border border-dashed border-border bg-surface-subtle">
            <div className="flex-1 min-h-0 max-h-full overflow-y-auto overflow-x-hidden">
              <div className="flex w-full min-w-0 max-w-full flex-col gap-2 p-3">
                {headers.length === 0 ? (
                  <div className="px-4 py-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No custom headers added yet.
                    </p>
                  </div>
                ) : (
                  headers.map((header, index) => (
                    <HeaderRow
                      key={`${header.name}-${index}`}
                      header={header}
                      onRemove={() => onRemoveHeader(index)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-full min-h-0 min-w-0 overflow-hidden">
        <SourcePreview headers={headers} />
      </div>
    </div>
  );
}

export default memo(CustomHeadersSection);
