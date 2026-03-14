import { Trash2, Pencil, Package, Mail, Globe } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { PhishingKitDisplayInfo } from "@/types/phishingKit";

interface PhishingKitsTableProps {
  readonly kits: PhishingKitDisplayInfo[];
  readonly onEdit: (id: number) => void;
  readonly onDelete: (id: number, name: string) => void;
  readonly isDeleting?: boolean;
}

export function PhishingKitsTable({
  kits,
  onEdit,
  onDelete,
  isDeleting,
}: PhishingKitsTableProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-10"></TableHead>
            <TableHead className="font-semibold text-foreground">Name</TableHead>
            <TableHead className="font-semibold text-foreground">Email Template</TableHead>
            <TableHead className="font-semibold text-foreground">Landing Page</TableHead>
            <TableHead className="font-semibold text-foreground">Profiles</TableHead>
            <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kits.map((kit) => (
            <TableRow key={kit.id} className="group transition-colors">
              <TableCell>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Package size={14} className="text-primary" />
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium text-foreground">{kit.name}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Mail size={14} className="text-muted-foreground" />
                  <span>{kit.email_template_name || "—"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Globe size={14} className="text-muted-foreground" />
                  <span>{kit.landing_page_template_name || "—"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-[12px] font-medium text-foreground">
                  {kit.sending_profile_names.length}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(kit.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="Edit kit"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(kit.id, kit.name)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete kit"
                    disabled={isDeleting}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
