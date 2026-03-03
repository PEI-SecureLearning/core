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
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
          Loading profiles...
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            No profiles found
          </h3>
          <p className="text-gray-500 mt-1">
            Create your first sending profile to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {profiles.map((profile) => (
            <SendingProfileCard
              key={profile.id}
              {...profile}
              onDelete={() => onDelete?.(profile.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
