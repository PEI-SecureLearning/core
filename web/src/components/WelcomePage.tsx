import { useKeycloak } from "@react-keycloak/web";
import { motion } from "motion/react";
import {
    ShieldCheck,
    LayoutDashboard,
    FileText,
    Users,
    ArrowRight,
    Sparkles
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const WelcomePage = () => {
    const { keycloak } = useKeycloak();
    const username = keycloak.tokenParsed?.given_name || "User";
    const roles = keycloak.tokenParsed?.realm_access?.roles || [];
    const isAdmin = roles.includes("CUSTOM_ORG_ADMIN") || roles.includes("org_manager");

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
        <div className="min-h-full w-full bg-gray-50/50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
                            <Sparkles className="w-4 h-4" />
                            <span>Secure Learning Platform</span>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                            Welcome back, {username}
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">
                            Here's what's happening in your workspace today.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium shadow-sm"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                        {isAdmin && (
                            <Link
                                to="/admin"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-lg shadow-gray-900/20"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Admin Console
                            </Link>
                        )}
                    </div>
                </motion.div>

                {/* Quick Stats / Cards Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Campaigns</h3>
                        <p className="text-gray-500 mb-4">View and manage your ongoing phishing simulation campaigns.</p>
                        <Link to="/campaigns" className="text-blue-600 font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                            View Campaigns <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">User Groups</h3>
                        <p className="text-gray-500 mb-4">Manage your target groups and user assignments.</p>
                        <Link to="/usergroups" className="text-purple-600 font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Manage Groups <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                            <ShieldCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Status</h3>
                        <p className="text-gray-500 mb-4">Check your organization's overall security compliance score.</p>
                        <Link to="/statistics" className="text-green-600 font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                            View Report <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </motion.div>

            </div>
        </div>
    );
};
