import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { UserRecord } from "./types";

type Props = {
  realm: string;
  users: UserRecord[];
  isLoading: boolean;
  deletingIds: Record<string, boolean>;
  onDelete: (id: string) => Promise<void>;
};

export default function UsersList({ realm, users, isLoading, deletingIds, onDelete }: Props) {
  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg">Users in Realm</CardTitle>
        <CardDescription>Listing users for realm {realm || "resolving..."}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="text-sm text-gray-500">No users found.</div>
        ) : (
          <div className="border rounded-md divide-y text-sm">
            {users.map((u) => {
              const id = u.id || u.username || "";
              return (
                <div key={id} className="flex items-center justify-between px-3 py-2 gap-3">
                  <div className="truncate">
                    <span className="font-medium">{u.username}</span>
                    {u.email ? <span className="text-gray-500"> · {u.email}</span> : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 hidden sm:block">
                      {u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "—"}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={!id || deletingIds[id]}
                      onClick={() => onDelete(id)}
                    >
                      {deletingIds[id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
