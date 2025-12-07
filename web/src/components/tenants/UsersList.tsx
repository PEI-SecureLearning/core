import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { UserRecord } from "./types";

type Props = {
  realm: string;
  users: UserRecord[];
  isLoading: boolean;
  deletingIds: Record<string, boolean>;
  onDelete: (id: string) => Promise<void>;
};

// Memoized user row to prevent re-renders during animations
const UserRow = memo(function UserRow({
  user,
  isDeleting,
  onDelete,
}: {
  user: UserRecord;
  isDeleting: boolean;
  onDelete: (id: string) => Promise<void>;
}) {
  const id = user.id || user.username || "";
  return (
    <div key={id} className="flex items-center justify-between px-3 py-2 gap-3">
      <div className="truncate">
        <span className="font-medium">{user.username}</span>
        {user.email ? <span className="text-gray-500"> · {user.email}</span> : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs text-gray-500 hidden sm:block">
          {user.firstName || user.lastName ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "—"}
        </div>
        <button
          type="button"
          className="liquid-glass-button-destructive"
          disabled={!id || isDeleting}
          onClick={() => onDelete(id)}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
        </button>
      </div>
    </div>
  );
});

// Memoized list content to isolate from animation surface
const UsersListContent = memo(function UsersListContent({
  users,
  isLoading,
  deletingIds,
  onDelete,
}: {
  users: UserRecord[];
  isLoading: boolean;
  deletingIds: Record<string, boolean>;
  onDelete: (id: string) => Promise<void>;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading users...
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="text-sm text-gray-500">No users found.</div>;
  }

  return (
    <div className="border rounded-md divide-y text-sm">
      {users.map((u) => {
        const id = u.id || u.username || "";
        return (
          <UserRow
            key={id}
            user={u}
            isDeleting={deletingIds[id] || false}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
});

// Main component - animation surface only
function UsersList({ realm, users, isLoading, deletingIds, onDelete }: Props) {
  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg">Users in Realm</CardTitle>
        <CardDescription>Listing users for realm {realm || "resolving..."}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <UsersListContent
          users={users}
          isLoading={isLoading}
          deletingIds={deletingIds}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
}

export default memo(UsersList);
