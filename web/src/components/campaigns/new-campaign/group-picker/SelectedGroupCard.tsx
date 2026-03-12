import { Users, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CampaignTargetGroup } from "./GroupSuggestionItem";

interface SelectedGroupCardProps {
  readonly group: CampaignTargetGroup;
  readonly onRemove: () => void;
}

export default function SelectedGroupCard({
  group,
  onRemove,
}: Readonly<SelectedGroupCardProps>) {
  return (
    <Card className="py-0 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-purple-200 transition-colors">
      <CardContent className="p-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex flex-col text-left truncate">
            <span className="text-[14px] font-medium text-slate-700 leading-tight truncate">
              {group.name}
            </span>
            {group.path && (
              <Badge variant="secondary" className="font-normal mt-1 w-fit">
                {group.path}
              </Badge>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
          title="Remove group"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
