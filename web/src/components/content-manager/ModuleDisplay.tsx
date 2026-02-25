import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Blocks } from 'lucide-react';

const MODULES = [
    {
        id: 1,
        title: "Introduction to Python",
        category: "Programming",
        image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60",
        desc: "Learn the basics of Python programming from scratch."
    },
    {
        id: 2,
        title: "RESTful API Design",
        category: "Backend",
        image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60",
        desc: "Design robust and scalable REST APIs with best practices."
    },
    {
        id: 3,
        title: "Database Modeling",
        category: "Data",
        image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60",
        desc: "Master relational database design and normalization techniques."
    },
    {
        id: 4,
        title: "Authentication & Security",
        category: "Security",
        image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60",
        desc: "Implement secure authentication flows and authorization patterns."
    },
    {
        id: 5,
        title: "State Management",
        category: "Frontend",
        image: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&auto=format&fit=crop&q=60",
        desc: "Explore modern state management solutions for complex UIs."
    },
    {
        id: 6,
        title: "Cloud Deployment",
        category: "DevOps",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60",
        desc: "Deploy and manage applications on cloud infrastructure."
    },
];


export function ModuleDisplay() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("title");

    const filteredModules = MODULES
        .filter(module => module.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => (a[sortBy as keyof typeof a] > b[sortBy as keyof typeof b] ? 1 : -1));

    return (
        <motion.div
            animate={{ opacity: 1 }}
            className="w-full h-full"
        >

            {/* Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto">
                {filteredModules.map((module) => (
                    <div key={module.id} className="shadow-black/40 group flex flex-col bg-white rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)]">
                        {/* Image Container */}
                        <div className="relative h-48 w-full overflow-hidden bg-white">
                            <div className="absolute inset-0 bg-purple-900/20 z-10 group-hover:bg-transparent transition-colors duration-500" />
                            <img
                                src={module.image}
                                alt={module.title}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute top-3 left-3 z-20">
                                <span className="px-3 py-1 bg-white/85 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-purple-800 border border-purple-500/30">
                                    {module.category}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-lg font-bold text-purple-900 mb-2 group-hover:text-white transition-colors">
                                {module.title}
                            </h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                                {module.desc}
                            </p>

                            <div className="mt-auto pt-4 border-t border-purple-500/10 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-xs text-purple-400">
                                    <Blocks className="w-3 h-3" />
                                    <span>8 Units</span>
                                </div>
                                <button className="text-xs font-bold text-purple-700 hover:text-purple-300 transition-colors">
                                    VIEW MODULE →
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

            </div>
        </motion.div >
    );
}
