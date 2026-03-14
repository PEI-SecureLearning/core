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
        <div className="min-h-full w-full bg-surface-subtle/50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                    <div>
                        <h1 className="text-4xl font-bold text-foreground tracking-tight">
                            Welcome back, {username}
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Here's what's happening in your workspace today.
                        </p>
                    </div>
                    <div className="flex gap-3">

                        {isAdmin && (
                            <Link
                                to="/admin"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors font-medium shadow-lg shadow-purple-500/20"
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
                    <motion.div variants={item} className="bg-background p-6 rounded-xl shadow-sm border border-border/40 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Active Campaigns</h3>
                        <p className="text-muted-foreground mb-4">View and manage your ongoing phishing simulation campaigns.</p>
                        <Link to="/campaigns" className="text-primary font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                            View Campaigns <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    <motion.div variants={item} className="bg-background p-6 rounded-xl shadow-sm border border-border/40 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">User Groups</h3>
                        <p className="text-muted-foreground mb-4">Manage your target groups and user assignments.</p>
                        <Link to="/usergroups" className="text-primary font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Manage Groups <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    <motion.div variants={item} className="bg-background p-6 rounded-xl shadow-sm border border-border/40 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Security Status</h3>
                        <p className="text-muted-foreground mb-4">Check your organization's overall security compliance score.</p>
                        <Link to="/statistics" className="text-primary font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                            View Report <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </motion.div>

            </div>
        </div>
    );
};
