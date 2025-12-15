import { Send, Server, MoreVertical, Trash2, Edit, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
// Import corrigido para evitar erro circular:
import { type SendingProfile } from "@/types/sendingProfile";

interface SendingProfileCardProps extends SendingProfile {
  onDelete?: () => void;
}

export default function SendingProfileCard({
  id,
  name,
  from_email,
  smtp_host,
  smtp_port,
  onDelete,
}: SendingProfileCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Como não temos cor na DB, usamos Azul por defeito para Profiles
  const bgClass = "from-blue-400 to-blue-600";
  const iconBg = "bg-blue-500";

  return (
    <Link
      to={`/sending-profiles/${id}` as any}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 block"
    >
      {/* Decoration Line */}
      <div className={`h-2 bg-gradient-to-r ${bgClass}`}></div>

      <div className="p-5">
        {/* Header with menu */}
        <div className="flex items-start justify-between mb-4">
          {/* Icon circle */}
          <div
            className={`h-12 w-12 rounded-full ${iconBg} bg-gradient-to-br ${bgClass} flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300`}
          >
            <Send className="h-6 w-6 text-white pl-1" />
          </div>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <Link
                  to={`/sending-profiles/${id}` as any}
                  className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
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
                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
          {name}
        </h3>

        {/* From Email */}
        <div className="flex items-center gap-1.5 text-gray-600 mb-2">
          <Mail className="h-3.5 w-3.5" />
          <span className="text-sm truncate">{from_email}</span>
        </div>

        {/* SMTP Info */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Server className="h-3 w-3" />
            <span>
              {smtp_host}:{smtp_port}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
