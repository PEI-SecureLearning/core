import { useNavigate } from "@tanstack/react-router";
import { LoadingGrid } from "@/components/templates/LoadingGrid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePhishingKits } from "./usePhishingKits";
import { PhishingKitCard } from "./PhishingKitCard";
import { PhishingKitsEmptyState } from "./PhishingKitsEmptyState";
import { PhishingKitsHeader } from "./PhishingKitsHeader";
import { PhishingKitsTable } from "./PhishingKitsTable";

export default function PhishingKitsPage() {
  const navigate = useNavigate();
  const {
    kits,
    filteredKits,
    isLoading,
    isFetching,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    refetch,
    handleDelete,
    isDeleting,
  } = usePhishingKits();

  const Header = (
    <div className="px-8 pt-8 pb-4">
      <PhishingKitsHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        onNewKit={() => navigate({ to: "/phishing-kits/new" })}
        refetch={refetch}
        isFetching={isFetching}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        {Header}
        <ScrollArea className="flex-1 px-8 pb-8">
          <LoadingGrid />
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {Header}

      <ScrollArea className="flex-1 px-8 pb-8">
        <div className="space-y-6">
          {filteredKits.length === 0 && (
            <PhishingKitsEmptyState
              hasTotalKits={kits.length > 0}
              onCreateFirst={() => navigate({ to: "/phishing-kits/new" })}
            />
          )}

          {filteredKits.length > 0 && viewMode === "grid" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredKits.map((kit) => (
                <PhishingKitCard
                  key={kit.id}
                  kit={kit}
                  onEdit={(id) =>
                    navigate({
                      to: "/phishing-kits/$id",
                      params: { id: String(id) },
                    })
                  }
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          )}

          {filteredKits.length > 0 && viewMode === "table" && (
            <PhishingKitsTable
              kits={filteredKits}
              onEdit={(id) =>
                navigate({
                  to: "/phishing-kits/$id",
                  params: { id: String(id) },
                })
              }
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
