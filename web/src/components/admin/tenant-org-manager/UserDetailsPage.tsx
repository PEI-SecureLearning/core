import { useEffect, useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useKeycloak } from "@react-keycloak/web";
import { Loader2 } from "lucide-react";

import { SectionSeparator } from "@/components/shared/SectionSeparator";
import { userApi } from "@/services/userApi";
import type { CampaignUserSending } from "@/services/campaignsApi";
import type { TenantUserDetailDto, UserCertificateDto } from "@/types/tenantOrgManager";

import { UserDetailsHeader } from "./UserDetailsHeader";
import { UserProfileCard } from "./UserProfileCard";
import { UserDetailsGrid } from "./UserDetailsGrid";
import { UserSendingsTable } from "./UserSendingsTable";
import { UserCertificatesList } from "./UserCertificatesList";

export function UserDetailsPage() {
    const params = useParams({ from: "/users/$id" });
    const userId = params.id;
    const { keycloak } = useKeycloak();

    const [user, setUser] = useState<TenantUserDetailDto | null>(null);
    const [sendings, setSendings] = useState<CampaignUserSending[]>([]);
    const [certificates, setCertificates] = useState<UserCertificateDto[]>([]);

    const [loading, setLoading] = useState(true);
    const [loadingSendings, setLoadingSendings] = useState(true);
    const [loadingCertificates, setLoadingCertificates] = useState(true);

    const [error, setError] = useState<string | null>(null);
    const [sendingsError, setSendingsError] = useState<string | null>(null);
    const [certificatesError, setCertificatesError] = useState<string | null>(null);

    const [refreshCount, setRefreshCount] = useState(0);

    const realm = useMemo(() => {
        const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
        if (!iss) return "";
        const parts = iss.split("/realms/");
        return parts[1] ?? "";
    }, [keycloak.tokenParsed]);

    useEffect(() => {
        const loadUser = async () => {
            if (!realm || !userId) return;

            setLoading(true);
            setError(null);

            try {
                const details = await userApi.getUser(realm, userId);
                setUser(details);
            } catch (err) {
                console.error("Failed to load user details", err);
                setError("Failed to load user details.");
            } finally {
                setLoading(false);
            }
        };

        void loadUser();
    }, [realm, userId, keycloak.token, refreshCount]);

    useEffect(() => {
        const loadSendings = async () => {
            if (!realm || !userId) return;

            setLoadingSendings(true);
            setSendingsError(null);

            try {
                const details = await userApi.getUserSendings(realm, userId);
                setSendings(details);
            } catch (err) {
                console.error("Failed to load user sendings", err);
                setSendingsError("Failed to load email sendings.");
            } finally {
                setLoadingSendings(false);
            }
        };

        void loadSendings();
    }, [realm, userId, keycloak.token, refreshCount]);

    useEffect(() => {
        const loadCertificates = async () => {
            if (!userId) return;

            setLoadingCertificates(true);
            setCertificatesError(null);

            try {
                const details = await userApi.getUserCertificates(userId, true);
                setCertificates(details);
            } catch (err) {
                console.error("Failed to load user certificates", err);
                setCertificatesError("Failed to load certificates.");
            } finally {
                setLoadingCertificates(false);
            }
        };

        void loadCertificates();
    }, [userId, keycloak.token, refreshCount]);

    const handleRefresh = () => {
        setRefreshCount((c) => c + 1);
    };

    const displayName =
        [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.username || userId;

    const detailRows = [
        { label: "Username", value: user?.username },
        { label: "Email", value: user?.email },
        { label: "Role", value: user?.role },
        { label: "Realm", value: user?.realm || realm },
    ];

    return (
        <div className="h-full w-full flex flex-col bg-surface-subtle animate-fade-in">
            <UserDetailsHeader
                displayName={displayName}
                isRefreshing={loading || loadingSendings || loadingCertificates}
                onRefresh={handleRefresh}
            />

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {loading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background p-3 rounded-md border border-border/40 shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            Loading user details...
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-error bg-error/10 border border-error/20 rounded-md px-3 py-2">
                            {error}
                        </div>
                    )}

                    <UserProfileCard user={user} displayName={displayName} />

                    <SectionSeparator title="Details" />

                    <UserDetailsGrid user={user} detailRows={detailRows} />

                    <SectionSeparator title="Email sendings" />

                    <UserSendingsTable
                        sendings={sendings}
                        loading={loadingSendings}
                        error={sendingsError}
                    />

                    <SectionSeparator title="Certificates" />

                    <UserCertificatesList
                        certificates={certificates}
                        loading={loadingCertificates}
                        error={certificatesError}
                    />
                </div>
            </div>
        </div>
    );
}