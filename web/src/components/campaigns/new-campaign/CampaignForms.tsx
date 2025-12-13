import { useCampaign } from "./CampaignContext";

function CampaignForms() {
  const { data, updateData } = useCampaign();

  const inputBaseStyle = {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
  };

  return (
    <div className="w-full space-y-6 h-full p-2">
      {/* Campaign Name */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-normal text-slate-500 tracking-wide uppercase">
          Campaign Name <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          className="rounded-xl px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
          style={inputBaseStyle}
          placeholder="Enter campaign name"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-normal text-slate-500 tracking-wide uppercase">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          className="rounded-xl px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 resize-none"
          style={inputBaseStyle}
          placeholder="Describe your campaign (optional)"
          rows={Math.max(4, data.description.split("\n").length)}
        />
      </div>
    </div>
  );
}

export default CampaignForms;
