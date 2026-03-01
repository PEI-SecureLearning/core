import { motion } from 'framer-motion';
import { FileStack } from 'lucide-react';

const CONTENT = [
    {
        id: 1,
        title: "React Hooks Deep Dive",
        category: "Video",
        image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&auto=format&fit=crop&q=60",
        desc: "A comprehensive video walkthrough of all React hooks."
    },
    {
        id: 2,
        title: "CSS Grid Cheat Sheet",
        category: "Document",
        image: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&auto=format&fit=crop&q=60",
        desc: "Quick reference PDF for CSS Grid layout properties."
    },
    {
        id: 3,
        title: "TypeScript Best Practices",
        category: "Article",
        image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60",
        desc: "Guidelines for writing clean and maintainable TypeScript."
    },
    {
        id: 4,
        title: "Node.js Performance Tuning",
        category: "Video",
        image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&auto=format&fit=crop&q=60",
        desc: "Optimize your Node.js applications for maximum throughput."
    },
    {
        id: 5,
        title: "Design Tokens Guide",
        category: "Document",
        image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop&q=60",
        desc: "How to build and manage a design token system."
    },
    {
        id: 6,
        title: "Git Workflow Handbook",
        category: "Article",
        image: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&auto=format&fit=crop&q=60",
        desc: "Branching strategies and collaboration best practices."
    },
];


export function ContentDisplay() {
    const searchQuery = "";
    const sortBy: keyof (typeof CONTENT)[number] = "title";

    const filteredContent = CONTENT
        .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => (a[sortBy] > b[sortBy] ? 1 : -1));

    return (
        <motion.div
            animate={{ opacity: 1 }}
            className="w-full h-full"
        >

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto">
                {filteredContent.map((item) => (
                    <div key={item.id} className="shadow-black/40 group flex flex-col bg-white rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)]">
                        {/* Image Container */}
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

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-lg font-bold text-purple-900 mb-2 group-hover:text-white transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                                {item.desc}
                            </p>

                            <div className="mt-auto pt-4 border-t border-purple-500/10 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-xs text-purple-400">
                                    <FileStack className="w-3 h-3" />
                                    <span>3 Files</span>
                                </div>
                                <button className="text-xs font-bold text-purple-700 hover:text-purple-300 transition-colors">
                                    VIEW CONTENT →
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

            </div>
        </motion.div >
    );
}
