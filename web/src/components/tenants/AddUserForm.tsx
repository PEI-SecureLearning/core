import { memo, useCallback } from "react";
import type { FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = {
  realm: string;
  groups: { id?: string; name?: string }[];
  username: string;
  name: string;
  email: string;
  role: string;
  selectedGroupId: string;
  isLoading: boolean;
  onChange: (field: string, value: string) => void;
  onSubmit: (e: FormEvent) => void;
};

// Memoized group select to prevent re-renders
const GroupSelect = memo(function GroupSelect({
  groups,
  selectedGroupId,
  onChange,
}: {
  groups: { id?: string; name?: string }[];
  selectedGroupId: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="group">Group (optional)</Label>
      <select
        id="group"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        value={selectedGroupId}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">No group</option>
        {groups.map((g) => (
          <option key={g.id || g.name} value={g.id || ""}>
            {g.name}
          </option>
        ))}
      </select>
    </div>
  );
});

// Memoized form fields to isolate from animation surface
const FormFields = memo(function FormFields({
  username,
  name,
  email,
  role,
  onChange,
}: {
  username: string;
  name: string;
  email: string;
  role: string;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={name} onChange={(e) => onChange("name", e.target.value)} required placeholder="New User" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onChange("email", e.target.value)}
          required
          placeholder="user@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => onChange("username", e.target.value)}
          required
          placeholder="new.user"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={role}
          onChange={(e) => onChange("role", e.target.value)}
          required
        >
          <option value="">Select a role</option>
          <option value="ORG_MANAGER">Organization manager</option>
          <option value="CONTENT_MANAGER">Content manager</option>
          <option value="DEFAULT_USER">User</option>
        </select>
      </div>
    </>
  );
});

// Main component - animation surface only
function AddUserForm({
  realm,
  groups,
  username,
  name,
  email,
  role,
  selectedGroupId,
  isLoading,
  onChange,
  onSubmit,
}: Props) {
  const handleGroupChange = useCallback(
    (value: string) => onChange("selectedGroupId", value),
    [onChange]
  );

  return (
    <Card className="shadow-sm border border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg">Add User to Realm</CardTitle>
        <CardDescription>Create user within your realm.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormFields
            username={username}
            name={name}
            email={email}
            role={role}
            onChange={onChange}
          />
          <GroupSelect
            groups={groups}
            selectedGroupId={selectedGroupId}
            onChange={handleGroupChange}
          />
          <Button type="submit" disabled={isLoading || !realm} className="w-full">
            {isLoading ? "Saving..." : realm ? "Add user" : "Realm not resolved"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default memo(AddUserForm);
