import { Mail, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SendingProfileDisplayInfo } from "@/types/sendingProfile";

interface SelectedSendingProfileCardProps {
  readonly profile: SendingProfileDisplayInfo;
  readonly onRemove: () => void;
}

export default function SelectedSendingProfileCard({
  profile,
  onRemove,
}: Readonly<SelectedSendingProfileCardProps>) {
  return (
    <Card className="py-0 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-purple-200 transition-colors">
      <CardContent className="p-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
            <Mail className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex flex-col text-left truncate">
            <span className="text-[14px] font-medium text-slate-700 leading-tight truncate">
              {profile.name}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[12px] text-slate-500">
              <span className="truncate">{profile.from_email}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <Badge variant="secondary" className="font-normal">
                {profile.smtp_host}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
          title="Remove profile"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
