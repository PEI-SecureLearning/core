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
    <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
            <TableHead className="w-[40px]"></TableHead>
            <TableHead className="font-semibold text-slate-700">Name</TableHead>
            <TableHead className="font-semibold text-slate-700">Email Template</TableHead>
            <TableHead className="font-semibold text-slate-700">Landing Page</TableHead>
            <TableHead className="font-semibold text-slate-700">Profiles</TableHead>
            <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kits.map((kit) => (
            <TableRow key={kit.id} className="group transition-colors">
              <TableCell>
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
                  <Package size={14} className="text-purple-600" />
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium text-slate-900">{kit.name}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-[13px] text-slate-600">
                  <Mail size={14} className="text-slate-400" />
                  <span>{kit.email_template_name || "—"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-[13px] text-slate-600">
                  <Globe size={14} className="text-slate-400" />
                  <span>{kit.landing_page_template_name || "—"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100/80 text-[12px] font-medium text-slate-600">
                  {kit.sending_profile_names.length}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(kit.id)}
                    className="h-8 w-8 text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                    title="Edit kit"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(kit.id, kit.name)}
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
