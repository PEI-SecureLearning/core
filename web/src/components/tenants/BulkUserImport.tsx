import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { BulkUser } from "./types";

type Props = {
  bulkUsers: BulkUser[];
  isBulkLoading: boolean;
  onCsvUpload: (file: File) => void;
  onBulkCreate: () => void;
};

export default function BulkUserImport({ bulkUsers, isBulkLoading, onCsvUpload, onBulkCreate }: Props) {
  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg">Bulk User Registration</CardTitle>
        <CardDescription>
          Import a CSV with username,name,email,role[,groups] columns and create users. Role is required for every row
          and must be one of: Organization manager, Content manager, or User.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Label className="font-medium">Import CSV</Label>
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onCsvUpload(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={onBulkCreate} disabled={isBulkLoading || bulkUsers.length === 0}>
            {isBulkLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {bulkUsers.length > 0 ? `Create ${bulkUsers.length} users` : "No users imported"}
          </Button>
        </div>
        {bulkUsers.length > 0 && (
          <div className="border rounded-md p-3 max-h-64 overflow-y-auto text-sm">
            <div className="font-semibold mb-2">Imported users</div>
            <div className="space-y-1">
              {bulkUsers.map((u, idx) => (
                <div key={`${u.email}-${idx}`} className="flex items-center justify-between gap-2">
                  <div className="truncate">
                    {u.name} ({u.email}) — {u.role}
                    {u.groups && u.groups.length ? ` · groups: ${u.groups.join(", ")}` : ""}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{u.status || "pending"}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
