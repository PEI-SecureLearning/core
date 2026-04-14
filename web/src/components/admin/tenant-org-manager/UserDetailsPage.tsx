import { useMemo } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useKeycloak } from "@react-keycloak/web";
import { ArrowLeft, Mail, User, Shield } from "lucide-react";

export function UserDetailsPage() {
    const params = useParams({ from: "/users/$id" });
    const userId = params.id;
    const { keycloak } = useKeycloak();

    const realm = useMemo(() => {
        const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
        if (!iss) return "";
        const parts = iss.split("/realms/");
        return parts[1] ?? "";
    }, [keycloak.tokenParsed]);

    return (
        <div className="h-full w-full flex flex-col bg-surface-subtle animate-fade-in">
            <div className="bg-background border-b border-border px-4 sm:px-6 py-4">
                <div className="flex items-center gap-3">
                    <Link
                        to="/users"
                        className="p-2 rounded-md hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">User details</h1>
                        <p className="text-sm text-muted-foreground">Simple overview for this user</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-2xl mx-auto bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <User className="h-4 w-4" />
                        <span>User ID</span>
                    </div>
                    <p className="text-foreground font-medium break-all">{userId}</p>

                    <div className="h-px bg-border" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="bg-surface-subtle border border-border/60 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Shield className="h-4 w-4" />
                                Realm
                            </div>
                            <p className="text-foreground font-medium break-all">{realm || "Unknown"}</p>
                        </div>

                        <div className="bg-surface-subtle border border-border/60 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Mail className="h-4 w-4" />
                                Contact
                            </div>
                            <p className="text-muted-foreground">Email data can be shown here in the next iteration.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}