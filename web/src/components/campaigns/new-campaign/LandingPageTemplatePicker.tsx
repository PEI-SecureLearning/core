import { useState } from "react";
import { Check, Layout, AlertCircle } from "lucide-react";
import { useCampaign } from "./CampaignContext";

interface LandingPageTemplate {
  id: number;
  name: string;
  description: string;
  thumbnail?: string;
}

const inputStyle = {
  background: "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
};

export default function LandingPageTemplatePicker() {
  const { data, updateData } = useCampaign();
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: Replace with API call to fetch landing page templates
  // Placeholder templates for now
  const mockTemplates: LandingPageTemplate[] = [
    {
      id: 1,
      name: "Login Page",
      description: "Classic login form with username and password fields",
    },
    {
      id: 2,
      name: "Password Reset",
      description: "Password reset form with email verification",
    },
    {
      id: 3,
      name: "Document Download",
      description: "Fake document download page",
    },
    {
      id: 4,
      name: "Survey Form",
      description: "Employee satisfaction survey template",
    },
    {
      id: 5,
      name: "Software Update",
      description: "Fake software update notification page",
    },
    {
      id: 6,
      name: "Account Verification",
      description: "Account verification form template",
    },
  ];

  const filteredTemplates = mockTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTemplate = (templateId: number) => {
    updateData({ landing_page_template_id: templateId });
  };

  return (
    <div className="h-full w-full flex flex-col gap-4  p-2">
      {/* Placeholder Notice */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <AlertCircle size={16} className="text-amber-500" />
        <p className="text-[13px] text-amber-700">
          Landing page templates are placeholders. API integration pending.
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-normal text-slate-500 tracking-wide uppercase">
          Search Landing Page Templates
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-xl px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-full max-w-md"
          style={inputStyle}
          placeholder="Search templates..."
        />
      </div>

      {/* Templates Grid */}
      <div className="flex-1 ">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                data.landing_page_template_id === template.id
                  ? "ring-2 ring-purple-500 bg-purple-50/50"
                  : "hover:bg-slate-50/50"
              }`}
              style={{
                background:
                  data.landing_page_template_id === template.id
                    ? "rgba(147, 51, 234, 0.08)"
                    : "rgba(255, 255, 255, 0.7)",
                border:
                  data.landing_page_template_id === template.id
                    ? "1px solid rgba(147, 51, 234, 0.3)"
                    : "1px solid rgba(148, 163, 184, 0.2)",
              }}
            >
              {data.landing_page_template_id === template.id && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
              )}

              {/* Template Preview Placeholder */}
              <div
                className="w-full h-24 rounded-lg mb-3 flex items-center justify-center"
                style={{ background: "rgba(148, 163, 184, 0.1)" }}
              >
                <Layout size={32} className="text-slate-400" />
              </div>

              <h3 className="text-[14px] font-medium text-slate-700 mb-1">
                {template.name}
              </h3>
              <p className="text-[12px] text-slate-500 line-clamp-2">
                {template.description}
              </p>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layout size={40} className="text-slate-300 mb-3" />
            <p className="text-slate-500 text-[14px]">No templates found</p>
            <p className="text-slate-400 text-[13px]">
              Try a different search term
            </p>
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {data.landing_page_template_id && (
        <div className="text-[13px] text-purple-600 font-medium">
          ✓ Selected:{" "}
          {
            mockTemplates.find((t) => t.id === data.landing_page_template_id)
              ?.name
          }
        </div>
      )}
    </div>
  );
}
