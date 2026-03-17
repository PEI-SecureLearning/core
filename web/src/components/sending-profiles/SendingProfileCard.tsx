import { Send, Server, MoreVertical, Trash2, Edit, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { type SendingProfileDisplayInfo } from "@/types/sendingProfile";

interface SendingProfileCardProps extends SendingProfileDisplayInfo {
  readonly onDelete?: () => void;
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

  return (
    <div className="relative bg-surface border border-border rounded-lg hover:border-primary/30 hover:shadow-sm transition-all duration-200">
      <div className="p-5">
        {/* Header with icon + menu */}
        <div className="flex items-start justify-between mb-4">
          <div className="h-10 w-10 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Send className="h-5 w-5 text-primary pl-0.5" />
          </div>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground/70 hover:text-foreground cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-36 bg-background rounded-md shadow-lg border border-border py-1 z-20">
                  <Link
                    to={`/sending-profiles/${id}` as any}
                    className="w-full px-3 py-2 text-sm text-foreground/90 hover:bg-surface-subtle flex items-center gap-2"
                    onClick={() => setShowMenu(false)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={() => {
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

        {/* Name */}
        <Link to={`/sending-profiles/${id}` as any}>
          <h3 className="font-semibold text-[15px] text-foreground mb-1 truncate hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>

        {/* From Email */}
        <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-[13px] truncate">{from_email}</span>
        </div>

        {/* SMTP Info */}
        <div className="flex items-center gap-1.5 text-muted-foreground/70 pt-3 border-t border-border/60">
          <Server className="h-3 w-3 flex-shrink-0" />
          <span className="text-[12px] truncate">
            {smtp_host}:{smtp_port}
          </span>
        </div>
      </div>
    </div>
  );
}
