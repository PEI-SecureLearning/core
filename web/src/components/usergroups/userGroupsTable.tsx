import { Users, Mail, MoreVertical, Trash2, Edit, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
interface UserGroup {
  id?: string;
  name?: string;
  memberCount?: number;
  lastUpdated?: string;
}

interface UserGroupsTableProps {
  groups?: UserGroup[];
  onDelete?: (id: string) => void;
}

function TableRow({ group, onDelete }: { 
  group: UserGroup; 
  onDelete?: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const memberCount = group.memberCount ?? 0;
  const linkId = group.id || "group";

  return (
    <tr className="group hover:bg-surface-subtle/60 transition-colors border-b border-border/60 last:border-0">
      {/* Group Name with Icon */}
      <td className="px-6 py-4">
        <Link 
          to="/usergroups/$id"
          params={{ id: linkId }}
          className="flex items-center gap-3 hover:text-primary transition-colors"
        >
          <div className="h-9 w-9 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium text-foreground group-hover:text-primary text-[14px]">
            {group.name}
          </span>
        </Link>
      </td>

      {/* Member Count */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-[14px]">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </td>

      {/* Last Updated */}
      <td className="px-6 py-4">
        <span className="text-[14px] text-muted-foreground">
          {group.lastUpdated || '—'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-1">
          {/* Send Campaign Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors flex items-center gap-1.5 opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5" />
            Send Campaign
          </button>

          {/* View Button */}
          <Link
            to="/usergroups/$id"
            params={{ id: linkId }}
            className="p-2 text-muted-foreground/70 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-36 bg-background rounded-lg shadow-lg border border-border py-1 z-20">
                  <Link
                    to="/usergroups/$id"
                    params={{ id: group.id || "group" }}
                    className="w-full px-3 py-2 text-sm text-foreground/90 hover:bg-surface-subtle flex items-center gap-2 text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(group.id || "group");
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 text-left cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function UserGroupsTable({ groups = [], onDelete }: UserGroupsTableProps) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-subtle/80 border-b border-border/60">
            <th className="px-6 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Group Name
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Members
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Last Updated
            </th>
            <th className="px-6 py-4 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <TableRow
              key={group.id}
              group={group}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>

      {/* Empty State */}
      {groups.length === 0 && (
        <div className="px-2 py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No user groups found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Create your first group to get started</p>
        </div>
      )}
    </div>
  );
}
