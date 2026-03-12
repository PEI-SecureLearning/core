import { Mail } from "lucide-react";

export default function SelectedSendingProfilesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-slate-400 transition-all h-full gap-1">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <Mail className="w-6 h-6 opacity-40 text-slate-400" />
      </div>
      <p className="text-sm text-center font-semibold text-slate-500">
        No sending profiles selected
      </p>
      <p className="text-[12px] text-center text-slate-400">
        Search and select profiles using the bar above
      </p>
    </div>
  );
}
