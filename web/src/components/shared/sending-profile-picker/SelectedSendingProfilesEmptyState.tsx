import { Mail } from "lucide-react";

export default function SelectedSendingProfilesEmptyState() {
  return (
    <div className="flex flex-col items-center align-middle justify-center py-6 text-muted-foreground transition-all h-full gap-1">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Mail className="w-6 h-6 opacity-40 text-muted-foreground" />
      </div>
      <p className="text-sm text-center font-semibold text-foreground">
        No sending profiles selected
      </p>
      <p className="text-[12px] text-center text-muted-foreground">
        Search and select profiles using the bar above
      </p>
    </div>
  );
}
