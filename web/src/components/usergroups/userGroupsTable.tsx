import { Users, Mail, MoreVertical, Trash2, Edit, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';

interface UserGroup {
  id: string;
  name: string;
  memberCount: number;
  color?: string;
  lastUpdated?: string;
}

interface UserGroupsTableProps {
  groups?: UserGroup[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function TableRow({ group, onEdit, onDelete }: { 
  group: UserGroup; 
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const colorClasses = {
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    pink: "bg-pink-100 text-pink-700",
    orange: "bg-orange-100 text-orange-700",
    teal: "bg-teal-100 text-teal-700",
  };

  const colorClass = colorClasses[group.color as keyof typeof colorClasses] || colorClasses.purple;

  return (
    <tr className="group hover:bg-purple-50/50 transition-colors border-b border-gray-100 last:border-0">
      {/* Group Name with Icon */}
      <td className="px-4 py-4">
        <Link 
          to={`/usergroups/${group.id}`}
          className="flex items-center gap-3 hover:text-purple-600 transition-colors"
        >
          <div className={`h-10 w-10 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
            <Users className="h-5 w-5" />
          </div>
          <span className="font-medium text-gray-900 group-hover:text-purple-600">
            {group.name}
          </span>
        </Link>
      </td>

      {/* Member Count */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="h-4 w-4" />
          <span className="text-sm">
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </td>

      {/* Last Updated */}
      <td className="px-4 py-4">
        <span className="text-sm text-gray-500">
          {group.lastUpdated}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-2">
          {/* Send Campaign Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log(`Send campaign to ${group.name}`);
            }}
            className="px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
          >
            <Mail className="h-3.5 w-3.5" />
            Send Campaign
          </button>

          {/* View Button */}
          <Link
            to={`/user-groups/${group.id}`}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(group.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-left"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(group.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 text-left"
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

export default function UserGroupsTable({ 
  groups = [
    { id: "1", name: "Marketing Team", memberCount: 24, color: "purple", lastUpdated: "2 days ago" },
    { id: "2", name: "Sales Department", memberCount: 18, color: "blue", lastUpdated: "1 week ago" },
    { id: "3", name: "Engineering", memberCount: 42, color: "green", lastUpdated: "3 days ago" },
    { id: "4", name: "HR & Admin", memberCount: 8, color: "pink", lastUpdated: "5 days ago" },
    { id: "5", name: "Customer Support", memberCount: 15, color: "orange", lastUpdated: "1 day ago" },
    { id: "6", name: "Product Team", memberCount: 12, color: "teal", lastUpdated: "4 days ago" },
  ],
  onEdit,
  onDelete
}: UserGroupsTableProps) {
  return (
    <div className="w-full bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="h-full w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Group Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Members
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <TableRow
                key={group.id}
                group={group}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {groups.length === 0 && (
        <div className="px-2 py-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No user groups found</p>
          <p className="text-sm text-gray-400 mt-1">Create your first group to get started</p>
        </div>
      )}
    </div>
  );
}