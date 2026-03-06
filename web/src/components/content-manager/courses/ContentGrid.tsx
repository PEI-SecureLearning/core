import type { LucideIcon } from "lucide-react"

interface ContentItem {
    id: number
    title: string
    category: string
    image: string
    desc: string
}

interface ContentGridProps {
    readonly items: ContentItem[]
    readonly footerIcon: LucideIcon
    readonly footerLabel: string
    readonly viewLabel: string
}

export function ContentGrid({ items, footerIcon: FooterIcon, footerLabel, viewLabel }: ContentGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto">
            {items.map((item) => (
                <div key={item.id} className="shadow-black/40 group flex flex-col bg-white rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)]">
                    <div className="relative h-48 w-full overflow-hidden bg-white">
                        <div className="absolute inset-0 bg-purple-900/20 z-10 group-hover:bg-transparent transition-colors duration-500" />
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute top-3 left-3 z-20">
                            <span className="px-3 py-1 bg-white/85 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-purple-800 border border-purple-500/30">
                                {item.category}
                            </span>
                        </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                        <h3 className="text-lg font-bold text-purple-900 mb-2 group-hover:text-white transition-colors">
                            {item.title}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                            {item.desc}
                        </p>
                        <div className="mt-auto pt-4 border-t border-purple-500/10 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-xs text-purple-400">
                                <FooterIcon className="w-3 h-3" />
                                <span>{footerLabel}</span>
                            </div>
                            <button type="button" className="text-xs font-bold text-purple-700 hover:text-purple-300 transition-colors">
                                {viewLabel} →
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
