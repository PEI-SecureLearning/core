import { useState } from "react";
import { Check, Mail, AlertCircle, Send } from "lucide-react";
import { useCampaign } from "./CampaignContext";

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  preview: string;
}

interface SendingProfile {
  id: number;
  name: string;
  from_email: string;
  smtp_host: string;
}

const inputStyle = {
  background: "rgba(255, 255, 255, 0.7)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
};

export default function EmailTemplatePicker() {
  const { data, updateData } = useCampaign();
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: Replace with API call to fetch email templates
  // Placeholder templates for now
  const mockTemplates: EmailTemplate[] = [
    {
      id: 1,
      name: "Phishing Alert",
      subject: "Urgent: Security Update Required",
      preview: "Your account requires immediate attention...",
    },
    {
      id: 2,
      name: "Password Reset",
      subject: "Reset Your Password",
      preview: "Click here to reset your password...",
    },
    {
      id: 3,
      name: "Invoice Notice",
      subject: "Invoice #12345 Due",
      preview: "Please review the attached invoice...",
    },
    {
      id: 4,
      name: "IT Support",
      subject: "IT Support Request",
      preview: "Your IT ticket has been updated...",
    },
    {
      id: 5,
      name: "HR Announcement",
      subject: "Important HR Update",
      preview: "Please review the following policy changes...",
    },
  ];

  // TODO: Replace with API call to fetch sending profiles
  // Placeholder sending profiles for now
  const mockSendingProfiles: SendingProfile[] = [
    {
      id: 1,
      name: "Default SMTP",
      from_email: "noreply@company.com",
      smtp_host: "smtp.company.com",
    },
    {
      id: 2,
      name: "Marketing",
      from_email: "marketing@company.com",
      smtp_host: "smtp.marketing.com",
    },
    {
      id: 3,
      name: "IT Department",
      from_email: "it-support@company.com",
      smtp_host: "smtp.it.company.com",
    },
  ];

  const filteredTemplates = mockTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTemplate = (templateId: number) => {
    updateData({ email_template_id: templateId });
  };

  const handleSelectSendingProfile = (profileId: number) => {
    updateData({ sending_profile_id: profileId });
  };

  return (
    <div className="h-full w-full flex flex-col gap-4  p-2 overflow-y-scroll">
      {/* Placeholder Notice */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <AlertCircle size={16} className="text-amber-500" />
        <p className="text-[13px] text-amber-700">
          Email templates and sending profiles are placeholders. API integration
          pending.
        </p>
      </div>

      {/* Sending Profile Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-normal text-slate-500 tracking-wide uppercase flex items-center gap-1.5">
          <Send size={12} />
          Sending Profile <span className="text-rose-400">*</span>
        </label>
        <select
          value={data.sending_profile_id ?? ""}
          onChange={(e) => handleSelectSendingProfile(Number(e.target.value))}
          className="rounded-xl px-4 py-3 text-[14px] text-slate-700 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 w-full max-w-md cursor-pointer"
          style={inputStyle}
        >
          <option value="" disabled>
            Select a sending profile...
          </option>
          {mockSendingProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name} ({profile.from_email})
            </option>
          ))}
        </select>
        {data.sending_profile_id && (
          <p className="text-[12px] text-slate-500">
            SMTP:{" "}
            {
              mockSendingProfiles.find((p) => p.id === data.sending_profile_id)
                ?.smtp_host
            }
          </p>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-normal text-slate-500 tracking-wide uppercase">
          Search Email Templates
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
                data.email_template_id === template.id
                  ? "ring-2 ring-purple-500 bg-purple-50/50"
                  : "hover:bg-slate-50/50"
              }`}
              style={{
                background:
                  data.email_template_id === template.id
                    ? "rgba(147, 51, 234, 0.08)"
                    : "rgba(255, 255, 255, 0.7)",
                border:
                  data.email_template_id === template.id
                    ? "1px solid rgba(147, 51, 234, 0.3)"
                    : "1px solid rgba(148, 163, 184, 0.2)",
              }}
            >
              {data.email_template_id === template.id && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Mail size={16} className="text-purple-500" />
                <h3 className="text-[14px] font-medium text-slate-700">
                  {template.name}
                </h3>
              </div>
              <p className="text-[13px] font-medium text-slate-600 mb-1">
                {template.subject}
              </p>
              <p className="text-[12px] text-slate-500 line-clamp-2">
                {template.preview}
              </p>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mail size={40} className="text-slate-300 mb-3" />
            <p className="text-slate-500 text-[14px]">No templates found</p>
            <p className="text-slate-400 text-[13px]">
              Try a different search term
            </p>
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {data.email_template_id && (
        <div className="text-[13px] text-purple-600 font-medium">
          ✓ Selected:{" "}
          {mockTemplates.find((t) => t.id === data.email_template_id)?.name}
        </div>
      )}
    </div>
  );
}
