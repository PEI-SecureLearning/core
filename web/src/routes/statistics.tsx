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
    <div className="h-full w-full overflow-y-auto">
      <div className="h-1/12 w-full border-b flex items-center px-4 font-semibold text-lg">
        <StatsHeader />
      </div>
      <div className="p-6 flex flex-col w-full">
        <div className="flex flex-row items-center gap-6 w-full h-full">
          <RiskLevel />
          <AssignedTraining />
          <ThisWeek hours={5} modules={3} />
        </div>
        <div className="flex flex-row items-center gap-6 w-full h-full mt-6">
          <RiskTrendChart />
        </div>
        <div className="flex flex-row items-center gap-6 w-full h-full mt-6">
          <CertificatesList />
          <RecentCampaigns />
        </div>
      </div>
    </div>
  );
}
