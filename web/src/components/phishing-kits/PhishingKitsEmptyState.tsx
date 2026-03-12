import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhishingKitsEmptyStateProps {
  readonly hasTotalKits: boolean;
  readonly onCreateFirst: () => void;
}

export function PhishingKitsEmptyState({
  hasTotalKits,
  onCreateFirst,
}: PhishingKitsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Package size={28} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-700 mb-1">
        {hasTotalKits ? "No kits match your search" : "No phishing kits yet"}
      </h3>
      <p className="text-slate-400 text-sm max-w-sm">
        {hasTotalKits
          ? "Try a different search term."
          : "Create your first phishing kit to bundle email templates, landing pages, and sending profiles together."}
      </p>
      {!hasTotalKits && (
        <Button
          className="mt-6 inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-600"
          onClick={onCreateFirst}
        >
          <Plus size={16} />
          Create First Kit
        </Button>
      )}
    </div>
  );
}
