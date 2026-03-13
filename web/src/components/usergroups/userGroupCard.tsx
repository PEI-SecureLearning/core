import { Users, Mail, MoreVertical, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';

interface UserGroupCardProps {
  readonly id?: string;
  readonly name?: string;
  readonly memberCount?: number;
  readonly lastUpdated?: string;
  readonly onDelete?: () => void;
}

export function UserGroupCard({
  id = "group",
  name = "Marketing Team",
  memberCount = 0,
  lastUpdated,
  onDelete,
}: UserGroupCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <Link
      to="/usergroups/$id"
      params={{ id: id || "group" }}
      data-testid={`group-card-${name}`}
      className="group relative bg-surface border border-border rounded-lg hover:shadow-md transition-all duration-200 overflow-hidden block"
    >
      <div className="p-5">
        {/* Header with menu */}
        <div className="flex items-start justify-between mb-4">
          {/* Icon circle */}
          <div className="h-12 w-12 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6 text-primary" />
          </div>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-md hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground/70" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); setShowMenu(false); }} />
                <div className="absolute right-0 mt-1 w-36 bg-background rounded-lg shadow-lg border border-border py-1 z-20">
                  <Link
                    to="/usergroups/$id"
                    params={{ id: id || "group" }}
                    className="w-full px-3 py-2 text-sm text-foreground/90 hover:bg-surface-subtle flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete?.();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Group name */}
        <h3 className="font-semibold text-foreground text-[15px] mb-1 truncate">
          {name}
        </h3>

        {/* Member count */}
        <p className="text-[13px] text-muted-foreground flex items-center gap-1.5 mb-3">
          <Users className="h-3.5 w-3.5" />
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          {lastUpdated ? (
            <span className="text-xs text-muted-foreground/70">Updated {lastUpdated}</span>
          ) : (
            <span />
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              navigate({ to: "/campaigns/new", search: { groupId: id } });
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5" />
            Send Campaign
          </button>
        </div>
      </div>
    </Link>
  );
}
