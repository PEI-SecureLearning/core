import {
  Send,
  Mail,
  MoreVertical,
  Trash2,
  Edit,
  ChevronRight,
  Server,
} from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { type SendingProfileDisplayInfo } from "@/types/sendingProfile";

interface TableProps {
  readonly profiles: SendingProfileDisplayInfo[];
  readonly onDelete?: (id: number) => void;
}

function TableRow({
  profile,
  onDelete,
}: {
  readonly profile: SendingProfileDisplayInfo;
  readonly onDelete?: (id: number) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <tr className="group hover:bg-purple-50/50 transition-colors border-b border-gray-100 last:border-0">
      {/* Profile Name with Icon */}
      <td className="px-4 py-4">
        <Link
          to={`/sending-profiles/${profile.id}` as any}
          className="flex items-center gap-3 hover:text-purple-600 transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Send className="h-5 w-5 pl-0.5" />
          </div>
          <div>
            <span className="font-medium text-gray-900 group-hover:text-purple-600 block">
              {profile.name}
            </span>
            <span className="text-xs text-gray-400 md:hidden">
              {profile.from_email}
            </span>
          </div>
        </Link>
      </td>

      {/* From Email */}
      <td className="px-4 py-4 hidden md:table-cell">
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="h-4 w-4" />
          <span className="text-sm">{profile.from_email}</span>
        </div>
      </td>

      {/* SMTP Host */}
      <td className="px-4 py-4 hidden sm:table-cell">
        <div className="flex items-center gap-2 text-gray-500">
          <Server className="h-4 w-4" />
          <span className="text-sm">
            {profile.smtp_host}:{profile.smtp_port}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-2">
          {/* View Button */}
          <Link
            to={`/sending-profiles/${profile.id}` as any}
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
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />

                <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <Link
                    to={`/sending-profiles/${profile.id}` as any}
                    className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(profile.id);
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

export default function SendingProfilesTable({
  profiles = [],
  onDelete,
}: TableProps) {
  return (
    <div className="w-full bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="h-full w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Identity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                From Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                SMTP Config
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <TableRow
                key={profile.id}
                profile={profile}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {profiles.length === 0 && (
        <div className="px-2 py-12 text-center">
          <Send className="h-12 w-12 text-gray-300 mx-auto mb-3 pl-1" />
          <p className="text-gray-500 font-medium">No profiles found</p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first sending profile
          </p>
        </div>
      )}
    </div>
  );
}
