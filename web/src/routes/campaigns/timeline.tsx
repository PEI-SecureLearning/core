import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { TimelineView } from "../../components/campaigns/timeline";

// Types - matching the local Campaign type from index.tsx
interface Campaign {
    id: string;
    name: string;
    description: string;
    begin_date: string;
    end_date: string;
    status: "active" | "completed" | "scheduled" | "paused" | "failed";
    stats: { sent: number; opened: number; clicked: number };
}

// Mock data - same as campaigns index
const mockCampaigns: Campaign[] = [
    {
        id: "1",
        name: "Q4 Security Awareness",
        description: "End of year security training campaign",
        begin_date: "2024-10-01",
        end_date: "2024-12-31",
        status: "active",
        stats: { sent: 450, opened: 280, clicked: 45 }
    },
    {
        id: "2",
        name: "Phishing Simulation - IT Department",
        description: "Targeted phishing test for IT staff",
        begin_date: "2024-11-15",
        end_date: "2024-11-30",
        status: "completed",
        stats: { sent: 85, opened: 72, clicked: 12 }
    },
    {
        id: "3",
        name: "New Employee Onboarding",
        description: "Security awareness for new hires",
        begin_date: "2024-12-01",
        end_date: "2025-01-15",
        status: "scheduled",
        stats: { sent: 0, opened: 0, clicked: 0 }
    },
    {
        id: "4",
        name: "Executive Team Test",
        description: "High-priority phishing simulation",
        begin_date: "2024-09-01",
        end_date: "2024-09-15",
        status: "paused",
        stats: { sent: 15, opened: 14, clicked: 3 }
    },
    {
        id: "5",
        name: "Finance Department Audit",
        description: "Quarterly security audit",
        begin_date: "2024-08-01",
        end_date: "2024-08-31",
        status: "failed",
        stats: { sent: 120, opened: 95, clicked: 28 }
    },
];

export const Route = createFileRoute("/campaigns/timeline")({
    component: TimelinePage,
});

function TimelinePage() {
    return (
        <div className="w-full p-6 flex flex-col h-full font-[Inter,system-ui,sans-serif] bg-gradient-to-br from-slate-50 via-white to-purple-50/30 animate-[fadeIn_0.5s_ease-out]">
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            {/* Header with Back Button */}
            <div className="h-[6%] flex items-center gap-4 mb-4 flex-shrink-0">
                <Link
                    to="/campaigns"
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Campaign Timeline</h1>
                    <p className="text-slate-500 mt-0.5 text-[14px] font-normal">View scheduled campaigns across time</p>
                </div>
            </div>

            {/* Timeline View - Full Height */}
            <div className="h-[90%] flex-1 min-h-0">
                <TimelineView campaigns={mockCampaigns} />
            </div>
        </div>
    );
}
