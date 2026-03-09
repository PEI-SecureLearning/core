import { Check, Shield, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface PreviewPanelDetailsProps {
    realmName: string
    features: { phishing: boolean; lms: boolean }
}

export function PreviewPanelDetails({
    realmName,
    features
}: PreviewPanelDetailsProps) {
    const enabledCount = [features.phishing, features.lms].filter(Boolean).length

    return (
        <div className="p-6 space-y-6">
            {/* Tenant Name Section */}
            <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Organization</span>
                <div className="bg-white p-4 rounded-sm border border-slate-100 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-slate-200/60">
                    <p className="text-lg font-bold text-slate-800 tracking-tight truncate leading-tight">
                        {realmName || 'New Tenant'}
                    </p>
                </div>
            </div>

            {/* Enabled Modules Section */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Modules</span>
                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                        {enabledCount} / 2
                    </span>
                </div>

                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {features.phishing && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:bg-slate-50"
                            >
                                <div className="w-8 h-8 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-slate-800">Phishing Engine</p>
                                </div>
                                <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center shadow-sm shadow-purple-200">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            </motion.div>
                        )}

                        {features.lms && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:bg-slate-50"
                            >
                                <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-slate-800">LMS Engine</p>
                                </div>
                                <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center shadow-sm shadow-purple-200">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            </motion.div>
                        )}

                        {!features.phishing && !features.lms && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-2"
                            >
                                <p className="text-[11px] text-slate-400 font-medium italic">No engines deployed yet</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
