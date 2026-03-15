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
  onRemove
}: Readonly<SelectedGroupCardProps>) {
  return (
    <Card className="py-0 bg-card border border-border rounded-xl shadow-sm hover:border-primary/30 transition-colors">
      <CardContent className="p-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col text-left truncate">
            <span className="text-[14px] font-medium text-foreground leading-tight truncate">
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
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
          title="Remove group"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
