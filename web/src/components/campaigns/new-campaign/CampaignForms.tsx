import React, { useState } from "react";
import { X } from "lucide-react";
import TagInput from "./TagInput";

function CampaignForms() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description || tags.length === 0) {
      alert("All fields (including at least one tag) are required.");
      return;
    }

    console.log("Form Data:", { name, description, tags });
  };

  const inputBaseStyle = {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6 h-full">
      {/* Campaign Name */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-normal text-slate-500 tracking-wide uppercase">
          Campaign Name <span className="text-rose-400">*</span>
        </label>
        <input
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
          style={inputBaseStyle}
          placeholder="Enter campaign name"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-normal text-slate-500 tracking-wide uppercase">
          Description <span className="text-rose-400">*</span>
        </label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 resize-none"
          style={inputBaseStyle}
          placeholder="Describe your campaign"
          rows={Math.max(4, description.split("\n").length)}
        />
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-3">
        <label className="text-[12px] font-normal text-slate-500 tracking-wide uppercase">
          Tags <span className="text-rose-400">*</span>
        </label>

        <div className="flex flex-wrap gap-2 items-center">
          {tags.map((tag, i) => (
            <div
              key={i}
              className="flex gap-1.5 items-center pl-3 pr-2 py-1.5 rounded-full text-[13px] font-medium text-purple-700 transition-all duration-150 hover:shadow-md cursor-default"
              style={{
                background: 'rgba(147, 51, 234, 0.1)',
                border: '1px solid rgba(147, 51, 234, 0.2)',
              }}
            >
              <span># {tag}</span>
              <button
                type="button"
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                className="p-0.5 rounded-full hover:bg-purple-200/60 transition-colors"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          ))}
          <TagInput onAdd={(tag) => setTags((prev) => [...prev, tag])} />
        </div>
      </div>
    </form>
  );
}

export default CampaignForms;
