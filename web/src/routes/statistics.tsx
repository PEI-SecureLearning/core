import { createFileRoute } from "@tanstack/react-router";
import { RiskLevel } from "../components/statistics/RiskLevel";
import AssignedTraining from "../components/statistics/AssignedTraining";
import ThisWeek from "../components/statistics/ThisWeek";
import StatsHeader from "../components/statistics/StatsHeader";
import RiskTrendChart from "@/components/statistics/RiskTrendGraph";
import CertificatesList from "@/components/statistics/Certificates";
import RecentCampaigns from "@/components/statistics/CampaignsList";

export const Route = createFileRoute("/statistics")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="h-full w-full overflow-y-auto bg-gray-50/50">
      {/* Header */}
      <div className="h-[8%] w-full border-b border-gray-200 flex items-center px-6 bg-white">
        <StatsHeader />
      </div>

      {/* Main Content */}
      <div className="p-6 flex flex-col w-full space-y-6">
        {/* Top Row - Lists */}
        <div className="flex flex-row gap-6 w-full">
          <CertificatesList />
          <RecentCampaigns />
        </div>

        {/* Middle Row - Stats Cards */}
        <div className="flex flex-row gap-6 w-full">
          <RiskLevel />
          <AssignedTraining />
          <ThisWeek hours={5} modules={3} />
        </div>

        {/* Bottom Row - Chart */}
        <div className="flex flex-row w-full">
          <RiskTrendChart />
        </div>
      </div>
    </div>
  );
}
