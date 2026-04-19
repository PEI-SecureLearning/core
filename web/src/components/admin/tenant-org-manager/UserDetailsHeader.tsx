import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import RefreshButton from "@/components/shared/RefreshButton";

interface UserDetailsHeaderProps {
    displayName: string;
    isRefreshing: boolean;
    onRefresh: () => void;
}

export function UserDetailsHeader({ displayName, isRefreshing, onRefresh }: UserDetailsHeaderProps) {
    return (
        <div className="bg-background border-b border-border px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <Link to="/users" className="p-2 rounded-md hover:bg-muted transition-colors">
                        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold text-foreground truncate">{displayName}</h1>
                        <p className="text-sm text-muted-foreground truncate">User details</p>
                    </div>
                </div>

                <RefreshButton
                    onClick={onRefresh}
                    label="Refresh"
                    variant="outline"
                    className="shrink-0 rounded-full"
                    isRefreshing={isRefreshing}
                />
            </div>
        </div>
    );
}
