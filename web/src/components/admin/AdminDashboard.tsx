import { motion } from "motion/react";
import {
    Building2,
    Users,
    FileText,
    Activity,
    ArrowRight,
    Shield,
    Settings
} from "lucide-react";
import { Link } from "@tanstack/react-router";

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
        <div className="min-h-full w-full bg-gray-50/50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
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

                {/* Quick Stats */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    <motion.div variants={item} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">—</p>
                                <p className="text-sm text-gray-500">Active Tenants</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={item} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">—</p>
                                <p className="text-sm text-gray-500">Total Users</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={item} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">—</p>
                                <p className="text-sm text-gray-500">Active Campaigns</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={item} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">—</p>
                                <p className="text-sm text-gray-500">Events Today</p>
                            </div>
                        </div>
                    </motion.div>
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

                    <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                            <Activity className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">System Logs</h3>
                        <p className="text-gray-500 mb-4">View system activity, audit logs, and monitor platform health.</p>
                        <Link to="/admin/logs" className="text-green-600 font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                            View Logs <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

                    <motion.div variants={item} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms & Policies</h3>
                        <p className="text-gray-500 mb-4">Manage terms of service, privacy policies, and compliance documents.</p>
                        <Link to="/admin/terms" className="text-amber-600 font-medium inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Manage Terms <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>

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
