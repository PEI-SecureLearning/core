import { Users, Mail, MoreVertical, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';

interface UserGroupCardProps {
  id?: string;
  name?: string;
  memberCount?: number;
  color?: string;
  lastUpdated?: string;
  onDelete?: () => void;
}

export function UserGroupCard({
  id = "group",
  name = "Marketing Team",
  memberCount = 0,
  color = "purple",
  lastUpdated = "2 days ago",
  onDelete,
}: UserGroupCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const colorClasses = {
    purple: "from-purple-400 to-purple-600",
    blue: "from-blue-400 to-blue-600",
    green: "from-green-400 to-green-600",
    pink: "from-pink-400 to-pink-600",
    orange: "from-orange-400 to-orange-600",
    teal: "from-teal-400 to-teal-600",
  };

  const bgClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.purple;

  return (
    <Link
      to="/usergroups/$id"
      params={{ id: id || "group" }}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 block"
    >
      {/* Colorful top decoration */}
      <div className={`h-2 bg-gradient-to-r ${bgClass}`}></div>
      
      <div className="p-5">
        {/* Header with menu */}
        <div className="flex items-start justify-between mb-4">
          {/* Icon circle */}
          <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${bgClass} flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
            <Users className="h-6 w-6 text-white" />
          </div>
          
          {/* More menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault(); // Prevent navigation when clicking menu
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
            <Link
              to="/usergroups/$id"
              params={{ id: id || "group" }}
              className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault(); // Prevent navigation
                onDelete?.();
                setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Group name */}
        <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
          {name}
        </h3>

        {/* Member count */}
        <div className="flex items-center gap-1.5 text-gray-600 mb-3">
          <Users className="h-4 w-4" />
          <span className="text-sm">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* Last updated */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Updated {lastUpdated}
          </span>
          
          {/* Send campaign button */}
          <button 
            onClick={(e) => e.preventDefault()} // Prevent navigation
            className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Mail className="h-3.5 w-3.5" />
            Send Campaign
          </button>
        </div>
      </div>
    </Link>
  );
}
