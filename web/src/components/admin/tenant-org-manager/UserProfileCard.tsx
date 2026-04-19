import { CheckCircle2 } from "lucide-react";
import type { TenantUserDetailDto } from "@/types/tenantOrgManager";

interface UserProfileCardProps {
    user: TenantUserDetailDto | null;
    displayName: string;
}

export function UserProfileCard({ user, displayName }: UserProfileCardProps) {
    const isActive = user?.active !== false;

    return (
        <section className="bg-background border border-border/60 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-foreground wrap-break-word">{displayName}</h2>
                    <p className="text-sm text-muted-foreground break-all mt-1">{user?.email || "No email available"}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                            isActive
                                ? "border-success/20 bg-success/10 text-success"
                                : "border-warning/20 bg-warning/10 text-warning"
                        }`}
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isActive ? "Active" : "Inactive"}
                    </span>
                </div>
            </div>
        </section>
    );
}
