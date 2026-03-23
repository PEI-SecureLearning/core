import { useCallback, useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { ChevronDown } from "lucide-react";

import { useCampaign } from "@/components/campaigns/new-campaign/CampaignContext";
import { fetchPhishingKits } from "@/services/phishingKitsApi";
import { fetchSendingProfiles } from "@/services/sendingProfilesApi";
import { userGroupsApi } from "@/services/userGroupsApi";
import type { PhishingKitDisplayInfo } from "@/types/phishingKit";
import type { SendingProfileDisplayInfo } from "@/types/sendingProfile";

interface CampaignTargetGroup {
    id: string;
    name: string;
    path?: string;
}

function formatDateTime(isoDate: string | null) {
    if (!isoDate) return "Not set";
    const date = new Date(isoDate);
    if (!Number.isFinite(date.getTime())) return "Not set";
    return date.toLocaleString();
}

function formatInterval(seconds: number) {
    const totalSeconds = Math.max(0, seconds || 0);
    const minutes = Math.floor(totalSeconds / 60);
    const remSeconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remSeconds).padStart(2, "0")}`;
}

function formatDuration(beginDate: string | null, endDate: string | null) {
    if (!beginDate || !endDate) return "Not set";

    const start = new Date(beginDate).getTime();
    const end = new Date(endDate).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return "Invalid date range";
    }

    const totalMinutes = Math.floor((end - start) / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

    return parts.join(" ");
}

function ExpandableSection({
    title,
    count,
    metaLabel,
    open,
    onToggle,
    children
}: {
    readonly title: string;
    readonly count: number;
    readonly metaLabel?: string;
    readonly open: boolean;
    readonly onToggle: () => void;
    readonly children: React.ReactNode;
}) {
    return (
        <div>
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-2 text-left"
                aria-expanded={open}
            >
                <div className="flex items-center gap-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {title}
                    </p>
                    <span className="px-2 py-0.5 text-[10px] uppercase bg-muted rounded-full text-muted-foreground">
                        {count}
                    </span>
                    {metaLabel ? (
                        <span className="px-2 py-0.5 text-[10px] uppercase bg-muted rounded-full text-muted-foreground">
                            {metaLabel}
                        </span>
                    ) : null}
                </div>
                <ChevronDown
                    className={`h-4 w-4 text-primary transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
                />
            </button>

            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-80 opacity-100 mt-2" : "max-h-0 opacity-0"}`}
            >
                {children}
            </div>
        </div>
    );
}

export default function CampaignSummary() {
    const { data } = useCampaign();
    const { keycloak } = useKeycloak();

    const [openSection, setOpenSection] = useState<
        "groups" | "kits" | "profiles" | null
    >(null);

    const [allGroups, setAllGroups] = useState<CampaignTargetGroup[]>([]);
    const [allKits, setAllKits] = useState<PhishingKitDisplayInfo[]>([]);
    const [allProfiles, setAllProfiles] = useState<SendingProfileDisplayInfo[]>([]);
    const [totalUsers, setTotalUsers] = useState<number>(0);
    const [countingUsers, setCountingUsers] = useState(false);

    const realm = useMemo(() => {
        const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
        if (!iss) return null;
        const parts = iss.split("/realms/");
        return parts[1] ?? null;
    }, [keycloak.tokenParsed]);

    const selectedGroups = useMemo(
        () => allGroups.filter((group) => data.user_group_ids.includes(group.id)),
        [allGroups, data.user_group_ids]
    );
    const selectedKits = useMemo(
        () => allKits.filter((kit) => data.phishing_kit_ids.includes(kit.id)),
        [allKits, data.phishing_kit_ids]
    );
    const selectedProfiles = useMemo(
        () =>
            allProfiles.filter((profile) =>
                data.sending_profile_ids.includes(profile.id)
            ),
        [allProfiles, data.sending_profile_ids]
    );

    useEffect(() => {
        let cancelled = false;

        const loadSummaryData = async () => {
            try {
                const [kits, profiles] = await Promise.all([
                    fetchPhishingKits(),
                    fetchSendingProfiles("", keycloak.token || undefined)
                ]);

                if (!cancelled) {
                    setAllKits(kits);
                    setAllProfiles(profiles);
                }
            } catch {
                if (!cancelled) {
                    setAllKits([]);
                    setAllProfiles([]);
                }
            }
        };

        void loadSummaryData();

        return () => {
            cancelled = true;
        };
    }, [keycloak.token]);

    useEffect(() => {
        let cancelled = false;

        const loadGroups = async () => {
            if (!realm) {
                setAllGroups([]);
                return;
            }

            try {
                const response = await userGroupsApi.getGroups(realm);
                if (!cancelled) {
                    const groups = (response.groups || [])
                        .filter((group) => !!group.id && !!group.name)
                        .map((group) => ({
                            id: group.id!,
                            name: group.name!,
                            path: group.path
                        }));
                    setAllGroups(groups);
                }
            } catch {
                if (!cancelled) {
                    setAllGroups([]);
                }
            }
        };

        void loadGroups();

        return () => {
            cancelled = true;
        };
    }, [keycloak.token, realm]);

    const loadTotalUsers = useCallback(async () => {
        if (!realm || data.user_group_ids.length === 0) {
            setTotalUsers(0);
            return;
        }

        setCountingUsers(true);

        try {
            const membersPerGroup = await Promise.all(
                data.user_group_ids.map((groupId) =>
                    userGroupsApi.getGroupMembers(realm, groupId)
                )
            );

            const uniqueUserIds = new Set<string>();
            for (const groupMembers of membersPerGroup) {
                for (const member of groupMembers.members || []) {
                    if (member.id) {
                        uniqueUserIds.add(member.id);
                    }
                }
            }

            setTotalUsers(uniqueUserIds.size);
        } catch {
            setTotalUsers(0);
        } finally {
            setCountingUsers(false);
        }
    }, [data.user_group_ids, keycloak.token, realm]);

    useEffect(() => {
        void loadTotalUsers();
    }, [loadTotalUsers]);

    return (
        <div className="flex flex-col flex-1 h-full min-h-0 p-5 rounded-2xl" style={{
            background: "color-mix(in srgb, var(--surface) 90%, transparent)",
            border: "1px solid var(--border)"
        }}>
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[15px] font-medium text-foreground/90 tracking-tight">
                    Campaign Summary
                </h2>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
                <div className="rounded-xl p-4" style={{
                    background: "color-mix(in srgb, var(--surface) 94%, transparent)",
                    border: "1px solid var(--border)"
                }}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                    <p className="mt-1 text-sm text-foreground font-medium">
                        {data.name.trim() || "No name set"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                        {data.description.trim() || "No description"}
                    </p>
                </div>

                <div className="rounded-xl p-4 space-y-3" style={{
                    background: "color-mix(in srgb, var(--surface) 94%, transparent)",
                    border: "1px solid var(--border)"
                }}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Targets</p>


                    <ExpandableSection
                        title="User Groups"
                        count={selectedGroups.length}
                        metaLabel={countingUsers ? "Users: ..." : `Users: ${totalUsers}`}
                        open={openSection === "groups"}
                        onToggle={() =>
                            setOpenSection((prev) =>
                                prev === "groups" ? null : "groups"
                            )
                        }
                    >
                        <div className="rounded-md bg-muted/35 px-3 py-2 border-dashed border">
                            {selectedGroups.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No groups selected.</p>
                            ) : (
                                <ul className="list-none pl-0 space-y-1 text-sm text-foreground">
                                    {selectedGroups.map((group) => (
                                        <li key={group.id} className="break-all">
                                            <span className="font-medium">{group.name}</span>
                                            {group.path ? (
                                                <span className="text-muted-foreground"> ({group.path})</span>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </ExpandableSection>

                    <ExpandableSection
                        title="Phishing Kits"
                        count={selectedKits.length}
                        open={openSection === "kits"}
                        onToggle={() =>
                            setOpenSection((prev) =>
                                prev === "kits" ? null : "kits"
                            )
                        }
                    >
                        <div className="rounded-md bg-muted/35 px-3 py-2 border-dashed border">
                            {selectedKits.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No phishing kits selected.</p>
                            ) : (
                                <ul className="list-none pl-0 space-y-1 text-sm text-foreground">
                                    {selectedKits.map((kit) => (
                                        <li key={kit.id} className="break-all">
                                            {kit.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </ExpandableSection>

                    <ExpandableSection
                        title="Sending Profiles"
                        count={selectedProfiles.length}
                        open={openSection === "profiles"}
                        onToggle={() =>
                            setOpenSection((prev) =>
                                prev === "profiles" ? null : "profiles"
                            )
                        }
                    >
                        <div className="rounded-md bg-muted/35 px-3 py-2 border-dashed border">
                            {selectedProfiles.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No sending profiles selected.</p>
                            ) : (
                                <ul className="list-none pl-0 space-y-1 text-sm text-foreground">
                                    {selectedProfiles.map((profile) => (
                                        <li key={profile.id} className="break-all">
                                            {profile.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </ExpandableSection>
                </div>

                <div className="rounded-xl p-4" style={{
                    background: "color-mix(in srgb, var(--surface) 94%, transparent)",
                    border: "1px solid var(--border)"
                }}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Schedule</p>

                    <div className="mt-2 space-y-1 text-sm text-foreground">
                        <p>
                            <span className="font-medium">Start:</span> {formatDateTime(data.begin_date)}
                        </p>
                        <p>
                            <span className="font-medium">End:</span> {formatDateTime(data.end_date)}
                        </p>
                        <p>
                            <span className="font-medium">Sending interval:</span>{" "}
                            {formatInterval(data.sending_interval_seconds)}
                        </p>
                        <p>
                            <span className="font-medium">Total duration:</span>{" "}
                            {formatDuration(data.begin_date, data.end_date)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
