import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function EmptyState() {
  return (
    <Card className="bg-white/80 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <FileText size={18} />
          No templates yet
        </CardTitle>
        <CardDescription>
          Add templates via the UI or API at <code className="text-xs">POST /api/templates</code> to see them here.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
