import { type SendingProfileDisplayInfo } from "@/types/sendingProfile";
import SendingProfileCard from "./SendingProfileCard";
import { Send } from "lucide-react";

type Props = {
  readonly profiles: SendingProfileDisplayInfo[];
  readonly isLoading?: boolean;
  readonly onDelete?: (id: number) => void;
};

export default function SendingProfilesGrid({
  profiles,
  isLoading,
  onDelete,
}: Props) {
  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading profiles...</div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="py-12 text-center">
        <Send className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3 pl-0.5" />
        <p className="text-[14px] font-medium text-muted-foreground">No profiles found</p>
        <p className="text-[13px] text-muted-foreground/70 mt-1">Create your first sending profile to get started</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {profiles.map((profile) => (
          <SendingProfileCard
            key={profile.id}
            {...profile}
            onDelete={() => onDelete?.(profile.id)}
          />
        ))}
      </div>
    </div>
  );
}
