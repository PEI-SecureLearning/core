import { Trash2, Pencil, Package } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { PhishingKitDisplayInfo } from "@/types/phishingKit";

interface PhishingKitCardProps {
  readonly kit: PhishingKitDisplayInfo;
  readonly onEdit: (id: number) => void;
  readonly onDelete: (id: number, name: string) => void;
  readonly isDeleting?: boolean;
}

export function PhishingKitCard({
  kit,
  onEdit,
  onDelete,
  isDeleting,
}: PhishingKitCardProps) {
  return (
    <Card className="group relative transition-all duration-200 hover:scale-[1.01] hover:shadow-md bg-card border-border p-0 overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between p-5 pb-0">
        <div className="flex flex-col gap-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 border border-primary/20">
            <Package size={18} className="text-primary" />
          </div>
          <CardTitle className="text-[15px] font-semibold text-foreground pr-16 line-clamp-1">
            {kit.name}
          </CardTitle>
          {kit.description && (
            <CardDescription className="text-[12px] text-muted-foreground line-clamp-2">
              {kit.description}
            </CardDescription>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(kit.id)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Edit kit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(kit.id, kit.name)}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete kit"
            disabled={isDeleting}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-3">
        {/* Linked Resources */}
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-muted-foreground font-medium w-24 shrink-0">
              Email
            </span>
            <span className="text-foreground truncate">
              {kit.email_template_name || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-muted-foreground font-medium w-24 shrink-0">
              Landing Page
            </span>
            <span className="text-foreground truncate">
              {kit.landing_page_template_name || "—"}
            </span>
          </div>
          <div className="flex items-start gap-2 text-[12px]">
            <span className="text-muted-foreground font-medium w-24 shrink-0">
              Profiles
            </span>
            <span className="text-foreground">
              {kit.sending_profile_names.length > 0
                ? kit.sending_profile_names.join(", ")
                : "—"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
