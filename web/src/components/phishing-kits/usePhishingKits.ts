import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@/lib/use-query";
import { fetchPhishingKits, deletePhishingKit } from "@/services/phishingKitsApi";
import { useConfirm } from "@/components/ui/confirm-modal";
import type { PhishingKitDisplayInfo } from "@/types/phishingKit";

export function usePhishingKits() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    const saved = localStorage.getItem("phishing-kits-view-mode");
    return (saved as "grid" | "table") || "grid";
  });

  const handleSetViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("phishing-kits-view-mode", mode);
  };

  const { data, isLoading, isFetching, refetch } = useQuery<
    PhishingKitDisplayInfo[]
  >({
    queryKey: ["phishing-kits"],
    queryFn: fetchPhishingKits,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePhishingKit(id),
    onSuccess: () => qc.invalidateQueries(),
  });

  const kits = data ?? [];

  const filteredKits = useMemo(() => {
    if (!searchQuery.trim()) return kits;
    const q = searchQuery.toLowerCase();
    return kits.filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        (k.description || "").toLowerCase().includes(q),
    );
  }, [kits, searchQuery]);

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({
      title: "Delete Phishing Kit",
      message: `Are you sure you want to delete "${name}"? This cannot be undone.`,
      variant: "danger",
      confirmText: "Delete",
    });

    if (ok) {
      deleteMutation.mutate(id);
    }
  };

  return {
    kits,
    filteredKits,
    isLoading,
    isFetching,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode: handleSetViewMode,
    refetch,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  };
}
