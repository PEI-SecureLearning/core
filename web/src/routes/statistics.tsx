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
    <div className="h-full w-full overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-purple-50/30 animate-[fadeIn_0.5s_ease-out]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="h-[8%] w-full border-b border-slate-200/60 flex items-center px-6 backdrop-blur-sm bg-white/40">
        <StatsHeader />
      </div>

      {/* Main Content */}
      <div className="p-6 flex flex-col w-full space-y-6">
        {/* Top Row - Stats Cards */}
        <div className="flex flex-row gap-6 w-full">
          <RiskLevel />
          <AssignedTraining />
          <ThisWeek hours={5} modules={3} />
        </div>

        {/* Middle Row - Chart */}
        <div className="flex flex-row w-full">
          <RiskTrendChart />
        </div>

        {/* Bottom Row - Lists */}
        <div className="flex flex-row gap-6 w-full">
          <CertificatesList />
          <RecentCampaigns />
        </div>
      </div>
    </div>
  );
}
