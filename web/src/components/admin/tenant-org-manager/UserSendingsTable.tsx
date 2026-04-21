import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import type { CampaignUserSending } from "@/services/campaignsApi";
import { getStatusBadgeVariant, getMostRecentStatusDate } from "./userDetailsUtils";

interface UserSendingsTableProps {
    readonly sendings: CampaignUserSending[];
    readonly loading: boolean;
    readonly error: string | null;
}

function SendingsTableBody({ sendings, loading, error }: UserSendingsTableProps) {
    if (loading) {
        return (
            <tr>
                <td colSpan={3} className="p-4 text-muted-foreground">
                    Loading email sendings...
                </td>
            </tr>
        );
    }

    if (error) {
        return (
            <tr>
                <td colSpan={3} className="p-4 text-error">
                    {error}
                </td>
            </tr>
        );
    }

    if (sendings.length === 0) {
        return (
            <tr>
                <td colSpan={3} className="p-4 text-muted-foreground">
                    No email sendings found for this user.
                </td>
            </tr>
        );
    }

    return (
        <>
            {sendings.map((sending, index) => (
                <tr key={`${sending.user_id}-${sending.email}-${index}`}>
                    <td className="p-3 text-foreground capitalize">
                        <Badge
                            variant={getStatusBadgeVariant(sending.status)}
                            className="capitalize text-sm px-3 py-1"
                        >
                            {sending.status}
                        </Badge>
                    </td>
                    <td className="p-3 text-foreground">{getMostRecentStatusDate(sending)}</td>
                    <td className="p-3 text-foreground">
                        {sending.campaign_id ? (
                            <Link
                                to="/campaigns/$id"
                                params={{ id: sending.campaign_id.toString() }}
                                className="text-primary hover:underline"
                            >
                                {sending.campaign_name || "View campaign"}
                            </Link>
                        ) : (
                            <span className="text-muted-foreground">
                                {sending.campaign_name || "No campaign"}
                            </span>
                        )}
                    </td>
                </tr>
            ))}
        </>
    );
}

export function UserSendingsTable({ sendings, loading, error }: UserSendingsTableProps) {
    return (
        <section className="rounded-xl border border-border/60 bg-background shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-surface-subtle text-muted-foreground">
                        <tr>
                            <th className="text-left font-medium p-3">Status</th>
                            <th className="text-left font-medium p-3">Date</th>
                            <th className="text-left font-medium p-3">Campaign</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        <SendingsTableBody sendings={sendings} loading={loading} error={error} />
                    </tbody>
                </table>
            </div>
        </section>
    );
}
