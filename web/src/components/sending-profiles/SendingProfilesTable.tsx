import {
  Send,
  Mail,
  Trash2,
  Edit,
  ChevronRight,
  Server,
} from "lucide-react";
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
  return (
    <tr className="hover:bg-surface-subtle/60 transition-colors border-b border-border/60 last:border-0">
      {/* Profile Name with Icon */}
      <td className="px-6 py-4">
        <Link
          to={`/sending-profiles/${profile.id}` as any}
          className="flex items-center gap-3 hover:text-primary transition-colors"
        >
          <div className="h-9 w-9 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Send className="h-4 w-4 text-primary pl-0.5" />
          </div>
          <div>
            <span className="font-medium text-[14px] text-foreground hover:text-primary block">
              {profile.name}
            </span>
            <span className="text-[12px] text-muted-foreground/70 md:hidden">
              {profile.from_email}
            </span>
          </div>
        </Link>
      </td>

      {/* From Email */}
      <td className="px-6 py-4 hidden md:table-cell">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span className="text-[14px]">{profile.from_email}</span>
        </div>
      </td>

      {/* SMTP Host */}
      <td className="px-6 py-4 hidden sm:table-cell">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Server className="h-4 w-4" />
          <span className="text-[14px]">
            {profile.smtp_host}:{profile.smtp_port}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/sending-profiles/${profile.id}` as any}
            className="p-2 text-muted-foreground/70 hover:text-primary hover:bg-primary/10 rounded-md transition-all"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <Link
            to={`/sending-profiles/${profile.id}` as any}
            className="p-2 text-muted-foreground/70 hover:text-primary hover:bg-primary/10 rounded-md transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <button
            onClick={() => onDelete?.(profile.id)}
            className="p-2 text-muted-foreground/70 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
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
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-subtle/80 border-b border-border/60">
              <th className="px-6 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Profile
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                From Email
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                SMTP Config
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
        <div className="px-6 py-12 text-center">
          <Send className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3 pl-1" />
          <p className="text-[14px] font-medium text-muted-foreground">No profiles found</p>
          <p className="text-[13px] text-muted-foreground/70 mt-1">
            Create your first sending profile
          </p>
        </div>
      )}
    </div>
  );
}


