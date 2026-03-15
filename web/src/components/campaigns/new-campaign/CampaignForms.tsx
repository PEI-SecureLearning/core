import { useCampaign } from "./CampaignContext";

function CampaignForms() {
  const { data, updateData } = useCampaign();

  return (
    <div className="size-full space-y-6 p-2">
      {/* Campaign Name */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="campaign-name"
          className="text-[12px] font-normal text-muted-foreground tracking-wide uppercase"
        >
          Campaign Name <span className="text-destructive">*</span>
        </label>
        <input
          id="campaign-name"
          type="text"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          className="rounded-xl px-4 py-3 text-[14px] text-foreground bg-surface border border-border placeholder:text-muted-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary"
          placeholder="Enter campaign name"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="campaign-description"
          className="text-[12px] font-normal text-muted-foreground tracking-wide uppercase"
        >
          Description
        </label>
        <textarea
          id="campaign-description"
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          className="rounded-xl px-4 py-3 text-[14px] text-foreground bg-surface border border-border placeholder:text-muted-foreground outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          placeholder="Describe your campaign (optional)"
          rows={Math.max(4, data.description.split("\n").length)}
        />
      </div>
    </div>
  );
}

export default CampaignForms;
