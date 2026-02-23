import { motion, type Variants } from "motion/react";
import {
    Building2,
    Users,
    Activity,
    ArrowRight,
    Shield,
    Settings,
    AlertCircle,
    CheckCircle,
    Info,
    Loader2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiClient } from "../../lib/api-client";

interface LogEntry {
    id: string;
    timestamp: number;
    level: "info" | "warning" | "error" | "success";
    message: string;
    source: string;
}

const levelDot: Record<LogEntry["level"], string> = {
    error: "bg-red-500",
    warning: "bg-yellow-400",
    success: "bg-green-500",
    info: "bg-blue-400",
};

const levelIcon = (level: LogEntry["level"]) => {
    const cls = "w-3.5 h-3.5 flex-shrink-0";
    switch (level) {
        case "error": return <AlertCircle className={`${cls} text-red-500`} />;
        case "warning": return <AlertCircle className={`${cls} text-yellow-500`} />;
        case "success": return <CheckCircle className={`${cls} text-green-500`} />;
        default: return <Info className={`${cls} text-blue-400`} />;
    }
};

function relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function SystemLogsCard({ item }: { item: Variants }) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient
            .get<{ logs: LogEntry[] }>("/logs?max_results=5")
            .then((res) => setLogs((res.logs ?? []).slice(0, 5)))
            .catch(() => setLogs([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <motion.div
            variants={item}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
                </div>
            </div>

            <div className="flex-1 space-y-2 mb-4 min-h-[120px]">
                {loading ? (
                    <div className="flex items-center gap-2 text-gray-400 py-4 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading…</span>
                    </div>
                ) : logs.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">No recent events.</p>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-2 text-sm">
                            <span
                                className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${levelDot[log.level]}`}
                            />
                            <span className="flex-1 text-gray-700 truncate">{log.message}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                                {levelIcon(log.level)}
                                {relativeTime(log.timestamp)}
                            </span>
                        </div>
                    ))
                )}
            </div>

            <Link
                to="/admin/logs"
                className="text-green-600 font-medium inline-flex items-center gap-1 hover:gap-2 transition-all text-sm mt-auto"
            >
                View all logs <ArrowRight className="w-4 h-4" />
            </Link>
        </motion.div>
    );
}

export function AdminDashboard() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-full w-full bg-gray-50/50">
            <div className="max-w-6xl mx-auto space-y-8 ">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 mb-2">
                            <Shield className="w-4 h-4" />
                            <span>Platform Administration</span>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                            Admin Console
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">
                            Manage tenants, users, and platform settings.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to="/admin/tenants"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-600/20"
                        >
                            <Building2 className="w-4 h-4" />
                            Manage Tenants
                        </Link>
                    </div>
                </motion.div>

                {/* Action Cards Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tenant Management</h3>
                        <p className="text-gray-500 mb-4">Create and manage organizations, configure features and access controls.</p>
                        <Link to="/admin/tenants" className="text-blue-600 font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                            View Tenants <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">User Administration</h3>
                        <p className="text-gray-500 mb-4">Manage platform users, roles, and permissions across all tenants.</p>
                        <Link to="/admin/users" className="text-purple-600 font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Manage Users <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    <SystemLogsCard item={item} />

                    <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                            <Settings className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform Settings</h3>
                        <p className="text-gray-500 mb-4">Configure global platform settings, integrations, and defaults.</p>
                        <span className="text-gray-400 font-medium inline-flex items-center gap-1">
                            Coming Soon
                        </span>
                    </motion.div>

                    <motion.div variants={item} className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-white">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Create New Tenant</h3>
                        <p className="text-white/80 mb-4">Set up a new organization with custom configuration and features.</p>
                        <Link to="/admin/tenants/new-tenant" className="text-white font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Get Started <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
