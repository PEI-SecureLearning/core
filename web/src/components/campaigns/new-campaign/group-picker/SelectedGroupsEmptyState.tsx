import { Users } from "lucide-react";

export default function SelectedGroupsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground transition-all h-full gap-2">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
        <Users className="w-7 h-7 opacity-40 text-muted-foreground" />
      </div>
      <p className="text-sm text-center font-semibold text-foreground">
        No groups selected
      </p>
      <p className="text-[12px] text-center text-muted-foreground">
        Search and select target groups above
      </p>
    </div>
  );
}
