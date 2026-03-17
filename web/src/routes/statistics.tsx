import { createFileRoute } from "@tanstack/react-router";
import { RiskLevel } from "../components/statistics/RiskLevel";
import AssignedTraining from "../components/statistics/AssignedTraining";
import ThisWeek from "../components/statistics/ThisWeek";
import StatsHeader from "../components/statistics/StatsHeader";
import RiskTrendChart from "@/components/statistics/RiskTrendGraph";
import CertificatesList from "@/components/statistics/Certificates";
import RecentCampaigns from "@/components/statistics/CampaignsList";

export const Route = createFileRoute("/statistics")({
  component: RouteComponent
});

function RouteComponent() {
  return (
    <div className="h-full w-full overflow-y-auto bg-surface-subtle/50">
      {/* Header */}
      <div className="w-full border-b border-border flex items-center px-4 sm:px-6 py-3 sm:py-4 bg-background">
        <StatsHeader />
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 flex flex-col w-full space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Top Row - Lists */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 w-full">
          <CertificatesList />
          <RecentCampaigns />
        </div>

        {/* Middle Row - Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 w-full">
          <RiskLevel />
          <AssignedTraining />
          <ThisWeek hours={5} modules={3} />
        </div>

        {/* Bottom Row - Chart */}
        <div className="w-full">
          <RiskTrendChart />
        </div>
      </div>
    </div>
  );
}
