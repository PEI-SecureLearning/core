import { usePhishingKit } from "./PhishingKitContext";

const inputStyle = {
  background: "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
};

export default function PhishingKitBasicInfoStep() {
  const { data, updateData } = usePhishingKit();

  return (
    <div className="h-full w-full flex flex-col gap-5 p-2">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="kit-name"
          className="text-[12px] font-normal text-slate-500 tracking-wide uppercase"
        >
          Kit Name <span className="text-rose-400">*</span>
        </label>
        <input
          id="kit-name"
          type="text"
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          className="rounded-xl px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-full max-w-md"
          style={inputStyle}
          placeholder="e.g. Password Reset Phish"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="kit-description"
          className="text-[12px] font-normal text-slate-500 tracking-wide uppercase"
        >
          Description
        </label>
        <textarea
          id="kit-description"
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          rows={4}
          className="rounded-xl px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-full max-w-md resize-none"
          style={inputStyle}
          placeholder="Briefly describe this phishing kit..."
        />
      </div>
    </div>
  );
}
