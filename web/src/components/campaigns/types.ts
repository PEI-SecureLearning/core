// Campaign types based on PhishingCampaign entity
export interface Campaign {
    id: string;
    name: string;
    description: string;
    begin_date: string;
    end_date: string;
    time_between_sending: number;
    status: CampaignStatus;
    sending_profile_id: string;
    email_template_id: string;
    landing_page_template_id: string;
    tenant_id: string;
    creator_id: string;
    stats: CampaignStats;
}

export interface CampaignStats {
    sent: number;
    opened: number;
    clicked: number;
}

export type CampaignStatus = "active" | "completed" | "scheduled" | "paused" | "failed";

// Mock data for development
export const mockCampaigns: Campaign[] = [
    {
        id: "1",
        name: "Q4 Security Awareness",
        description: "End of year security training campaign targeting all employees",
        begin_date: "2024-10-01",
        end_date: "2024-12-31",
        time_between_sending: 24,
        status: "active",
        sending_profile_id: "sp-1",
        email_template_id: "et-1",
        landing_page_template_id: "lp-1",
        tenant_id: "tenant-1",
        creator_id: "user-1",
        stats: { sent: 450, opened: 280, clicked: 45 }
    },
    {
        id: "2",
        name: "Phishing Simulation - IT Department",
        description: "Targeted phishing test for IT staff",
        begin_date: "2024-11-15",
        end_date: "2024-11-30",
        time_between_sending: 48,
        status: "completed",
        sending_profile_id: "sp-2",
        email_template_id: "et-2",
        landing_page_template_id: "lp-2",
        tenant_id: "tenant-1",
        creator_id: "user-1",
        stats: { sent: 85, opened: 72, clicked: 12 }
    },
    {
        id: "3",
        name: "New Employee Onboarding",
        description: "Security awareness for new hires",
        begin_date: "2024-12-01",
        end_date: "2025-01-15",
        time_between_sending: 72,
        status: "scheduled",
        sending_profile_id: "sp-1",
        email_template_id: "et-3",
        landing_page_template_id: "lp-1",
        tenant_id: "tenant-1",
        creator_id: "user-2",
        stats: { sent: 0, opened: 0, clicked: 0 }
    },
    {
        id: "4",
        name: "Executive Team Test",
        description: "High-priority phishing simulation for C-suite",
        begin_date: "2024-09-01",
        end_date: "2024-09-15",
        time_between_sending: 24,
        status: "paused",
        sending_profile_id: "sp-3",
        email_template_id: "et-4",
        landing_page_template_id: "lp-3",
        tenant_id: "tenant-1",
        creator_id: "user-1",
        stats: { sent: 15, opened: 14, clicked: 3 }
    },
    {
        id: "5",
        name: "Finance Department Audit",
        description: "Quarterly security audit for finance team",
        begin_date: "2024-08-01",
        end_date: "2024-08-31",
        time_between_sending: 48,
        status: "failed",
        sending_profile_id: "sp-2",
        email_template_id: "et-5",
        landing_page_template_id: "lp-2",
        tenant_id: "tenant-1",
        creator_id: "user-3",
        stats: { sent: 120, opened: 95, clicked: 28 }
    },
];
