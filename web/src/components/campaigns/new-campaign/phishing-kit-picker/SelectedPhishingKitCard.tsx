import { Layout, Mail, Package, Send, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PhishingKitDisplayInfo } from "@/types/phishingKit";

interface SelectedPhishingKitCardProps {
  readonly kit: PhishingKitDisplayInfo;
  readonly onRemove: () => void;
}

export default function SelectedPhishingKitCard({
  kit,
  onRemove,
}: Readonly<SelectedPhishingKitCardProps>) {
  return (
    <Card className="py-0 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-purple-200 transition-colors w-full">
      <CardContent className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 overflow-hidden w-full">
          <div className="w-10 h-10 mt-1 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex flex-col text-left truncate w-full">
            <span className="text-[15px] font-semibold text-slate-800 leading-tight truncate">
              {kit.name}
            </span>
            {kit.description && (
              <span className="text-[13px] text-slate-500 mt-1 truncate whitespace-normal">
                {kit.description}
              </span>
            )}
            <div className="flex items-center flex-wrap gap-2 mt-3">
              {kit.email_template_name && (
                <Badge variant="secondary" className="font-medium">
                  <Mail size={12} className="text-slate-500" />
                  <span className="truncate max-w-[150px]">
                    {kit.email_template_name}
                  </span>
                </Badge>
              )}
              {kit.landing_page_template_name && (
                <Badge variant="secondary" className="font-medium">
                  <Layout size={12} className="text-slate-500" />
                  <span className="truncate max-w-[150px]">
                    {kit.landing_page_template_name}
                  </span>
                </Badge>
              )}
              {kit.sending_profile_names.length > 0 && (
                <Badge variant="secondary" className="font-medium">
                  <Send size={12} className="text-slate-500" />
                  <span>{kit.sending_profile_names.length} Profile(s)</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
          title="Remove kit"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
