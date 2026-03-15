import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePhishingKit } from "./PhishingKitContext";

export default function PhishingKitBasicInfoStep() {
  const { data, updateData } = usePhishingKit();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const addTag = (rawValue: string) => {
    const normalized = rawValue.trim().replaceAll(/\s+/g, " ");
    if (!normalized) return;

    const alreadyExists = tags.some(
      (tag) => tag.toLowerCase() === normalized.toLowerCase()
    );
    if (alreadyExists) {
      setTagInput("");
      return;
    }

    setTags((prev) => [...prev, normalized]);
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="h-full w-full flex flex-col gap-5 p-2">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="kit-name"
          className="text-[12px] font-normal text-muted-foreground tracking-wide uppercase"
        >
          Kit Name <span className="text-destructive">*</span>
        </label>
        <input
          id="kit-name"
          type="text"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="e.g. Password Reset Phish"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="kit-description"
          className="text-[12px] font-normal text-muted-foreground tracking-wide uppercase"
        >
          Description
        </label>
        <textarea
          id="kit-description"
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          rows={4}
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Briefly describe this phishing kit..."
        />
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="kit-tags"
          className="text-[12px] font-normal text-muted-foreground tracking-wide uppercase"
        >
          Tags
        </label>

        <div className="flex items-center gap-2">
          <div className="w-full rounded-xl border border-border bg-background px-3 py-2 flex flex-wrap items-center gap-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="default"
                className="px-2 pr-1 py-1 text-[12px] font-medium bg-primary/10 text-primary border border-primary/20"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20 transition-colors"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            <input
              id="kit-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              className="flex-1 min-w-[180px] bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
              placeholder={
                tags.length === 0
                  ? "Type a tag and press Enter"
                  : "Add another tag"
              }
            />
          </div>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="rounded-full shrink-0"
            onClick={() => addTag(tagInput)}
            aria-label="Add tag"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
