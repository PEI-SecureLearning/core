import React, { useState } from "react";
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
    <form onSubmit={handleSubmit} className="w-full m-5 space-y-5">
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
          className="border rounded px-3 py-2"
          placeholder="Describe your campaign"
          rows={3}
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
              className=" text-center align-middle px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm border border-purple-300"
            >
              # {tag}
            </div>
          ))}
          <TagInput onAdd={(tag) => setTags((prev) => [...prev, tag])} />
        </div>
      </div>
    </form>
  );
}

export default CampaignForms;
