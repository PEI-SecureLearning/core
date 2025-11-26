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

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5 h-full">
      {/* Campaign Name */}
      <div className="flex flex-col gap-1">
        <label className="font-medium">
          Campaign Name <span className="text-red-500">*</span>
        </label>
        <input
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="Enter campaign name"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="font-medium">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded px-3 py-2 resize-none size-a"
          placeholder="Describe your campaign"
          rows={Math.max(3, description.split("\n").length)}
        />
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <label className="font-medium">
          Tags <span className="text-red-500">*</span>
        </label>

        <div className="flex flex-wrap gap-2 ">
          {tags.map((tag, i) => (
            <div
              key={i}
              className=" flex gap-2 items-center align-middle text-center pl-3 pr-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm border border-purple-300"
            >
              <span># {tag}</span>
              <X
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                size={22}
                className="hover:bg-purple-300 rounded-full"
              />
            </div>
          ))}
          <TagInput onAdd={(tag) => setTags((prev) => [...prev, tag])} />
        </div>
      </div>
    </form>
  );
}

export default CampaignForms;
