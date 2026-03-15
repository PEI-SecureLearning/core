import { motion } from "motion/react";
import {
    ArrowRight,
    Shield,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { adminLinks } from "../../lib/navigation";

export function AdminDashboard() {
    const dashboardLinksKey = adminLinks.map((link) => link.href).join("|");
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
        <div className="min-h-full w-full bg-surface-subtle/50">
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
                        <h1 className="text-4xl font-bold text-foreground tracking-tight">
                            Admin Console
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Manage tenants, users, and platform settings.
                        </p>
                    </div>
                </motion.div>

                {/* Action Cards Grid */}
                <motion.div
                    key={dashboardLinksKey}
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {adminLinks.map((link) => {
                        const Icon = link.icon;

                        return (
                            <motion.div
                                key={link.href}
                                variants={item}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-background p-6 rounded-xl shadow-sm border border-border/40 hover:shadow-md transition-shadow"
                            >
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <Icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">{link.label}</h3>
                                <p className="text-muted-foreground mb-4">
                                    {link.description ?? `Open ${link.label.toLowerCase()}.`}
                                </p>
                                <Link
                                    to={link.href}
                                    className="text-primary font-medium inline-flex items-center gap-1 hover:gap-2 transition-all"
                                >
                                    Open {link.label} <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}
