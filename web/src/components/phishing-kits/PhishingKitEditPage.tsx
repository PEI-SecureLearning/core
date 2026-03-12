import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { fetchPhishingKit } from "@/services/phishingKitsApi";
import PhishingKitForm from "./PhishingKitForm";

interface PhishingKitEditPageProps {
  kitId: number;
}

export default function PhishingKitEditPage({ kitId }: PhishingKitEditPageProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["phishing-kit", kitId],
    queryFn: () => fetchPhishingKit(kitId),
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="animate-spin" size={20} />
        Loading phishing kit...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex items-center justify-center text-rose-600">
        Failed to load phishing kit. Please try again.
      </div>
    );
  }

  return (
    <PhishingKitForm
      editId={kitId}
      initialData={{
        name: data.name,
        description: data.description || "",
        args: data.args || {},
        email_template_id: null, // will be resolved from name
        email_template_name: data.email_template_name || null,
        landing_page_template_id: null,
        landing_page_template_name: data.landing_page_template_name || null,
        sending_profile_ids: [], // will need to be resolved
      }}
    />
  );
}
