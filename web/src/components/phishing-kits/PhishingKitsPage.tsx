import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plus, RefreshCcw, Trash2, Pencil, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchPhishingKits, deletePhishingKit } from "@/services/phishingKitsApi";
import type { PhishingKitDisplayInfo } from "@/types/phishingKit";

export default function PhishingKitsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery<
    PhishingKitDisplayInfo[]
  >({
    queryKey: ["phishing-kits"],
    queryFn: fetchPhishingKits,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePhishingKit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["phishing-kits"] }),
  });

  const kits = data ?? [];

  const filteredKits = useMemo(() => {
    if (!searchQuery.trim()) return kits;
    const q = searchQuery.toLowerCase();
    return kits.filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        (k.description || "").toLowerCase().includes(q)
    );
  }, [kits, searchQuery]);

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Delete phishing kit "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gradient-to-br from-slate-50 via-white to-purple-50/40">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            Phishing Kits
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Bundle email templates, landing pages, and sending profiles into
            reusable phishing scenarios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-600 transition-colors"
            onClick={() => navigate({ to: "/phishing-kits/new" })}
          >
            <Plus size={16} />
            New Kit
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2"
            disabled={isFetching}
          >
            <RefreshCcw
              size={16}
              className={cn("transition", isFetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
          style={{
            background: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
          }}
          placeholder="Search kits by name or description..."
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl animate-pulse"
              style={{
                background: "rgba(148, 163, 184, 0.08)",
                border: "1px solid rgba(148, 163, 184, 0.15)",
              }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredKits.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Package size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-1">
            {kits.length === 0 ? "No phishing kits yet" : "No kits match your search"}
          </h3>
          <p className="text-slate-400 text-sm max-w-sm">
            {kits.length === 0
              ? "Create your first phishing kit to bundle email templates, landing pages, and sending profiles together."
              : "Try a different search term."}
          </p>
          {kits.length === 0 && (
            <Button
              className="mt-6 inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-600"
              onClick={() => navigate({ to: "/phishing-kits/new" })}
            >
              <Plus size={16} />
              Create First Kit
            </Button>
          )}
        </div>
      )}

      {/* Kit Cards Grid */}
      {!isLoading && filteredKits.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredKits.map((kit) => (
            <div
              key={kit.id}
              className="group relative p-5 rounded-xl transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
              }}
            >
              {/* Actions */}
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() =>
                    navigate({ to: "/phishing-kits/$id", params: { id: String(kit.id) } })
                  }
                  className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                  title="Edit kit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(kit.id, kit.name)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete kit"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Kit Icon */}
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-3 border border-purple-100">
                <Package size={18} className="text-purple-600" />
              </div>

              {/* Kit Info */}
              <h3 className="text-[15px] font-semibold text-slate-800 mb-1 pr-16">
                {kit.name}
              </h3>
              {kit.description && (
                <p className="text-[12px] text-slate-500 mb-3 line-clamp-2">
                  {kit.description}
                </p>
              )}

              {/* Linked Resources */}
              <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="text-slate-400 font-medium w-24 shrink-0">
                    Email
                  </span>
                  <span className="text-slate-600 truncate">
                    {kit.email_template_name || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="text-slate-400 font-medium w-24 shrink-0">
                    Landing Page
                  </span>
                  <span className="text-slate-600 truncate">
                    {kit.landing_page_template_name || "—"}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-[12px]">
                  <span className="text-slate-400 font-medium w-24 shrink-0">
                    Profiles
                  </span>
                  <span className="text-slate-600">
                    {kit.sending_profile_names.length > 0
                      ? kit.sending_profile_names.join(", ")
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
