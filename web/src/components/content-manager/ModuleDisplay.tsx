import { motion } from 'framer-motion'
import { Blocks } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { PLACEHOLDER_MODULES } from './module-creation/placeholderModules'

export function ModuleDisplay() {
    return (
        <motion.div animate={{ opacity: 1 }} className="w-full h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto">
                {PLACEHOLDER_MODULES.map((mod) => (
                    <Link
                        key={mod.id}
                        to="/content-manager/modules/$moduleId"
                        params={{ moduleId: mod.id }}
                        className="shadow-black/40 group flex flex-col bg-white rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)] no-underline"
                    >
                        {/* Cover image */}
                        <div className="relative h-48 w-full overflow-hidden bg-white">
                            <div className="absolute inset-0 bg-purple-900/20 z-10 group-hover:bg-transparent transition-colors duration-500" />
                            <img
                                src={mod.image}
                                alt={mod.title}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute top-3 left-3 z-20">
                                <span className="px-3 py-1 bg-white/85 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-purple-800 border border-purple-500/30">
                                    {mod.category}
                                </span>
                            </div>
                            <div className="absolute top-3 right-3 z-20">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${mod.difficulty === 'Easy' ? 'bg-green-100/90  text-green-700  border-green-300' :
                                        mod.difficulty === 'Medium' ? 'bg-yellow-100/90 text-yellow-700 border-yellow-300' :
                                            'bg-red-100/90    text-red-700    border-red-300'
                                    }`}>
                                    {mod.difficulty}
                                </span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-lg font-bold text-purple-900 mb-2 group-hover:text-purple-700 transition-colors">
                                {mod.title}
                            </h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                                {mod.description}
                            </p>
                            <div className="mt-auto pt-4 border-t border-purple-500/10 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-xs text-purple-400">
                                    <Blocks className="w-3 h-3" />
                                    <span>{mod.unitCount} Units · {mod.estimatedTime}</span>
                                </div>
                                <span className="text-xs font-bold text-purple-700 group-hover:text-purple-500 transition-colors">
                                    VIEW MODULE →
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </motion.div>
    )
}
