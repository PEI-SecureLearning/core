import { Package } from "lucide-react";

export default function SelectedPhishingKitsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-slate-400 transition-all h-full gap-2">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
        <Package className="w-7 h-7 opacity-40 text-slate-400" />
      </div>
      <p className="text-sm text-center font-semibold text-slate-500">
        No phishing kits selected
      </p>
      <p className="text-[12px] text-center text-slate-400">
        Search and select kits using the bar above
      </p>
    </div>
  );
}
