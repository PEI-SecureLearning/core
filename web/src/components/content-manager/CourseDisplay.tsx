import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SortAsc, BookOpen, Plus } from 'lucide-react';

const COURSES = [
    {
        id: 1,
        title: "Advanced React Patterns",
        category: "Development",
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
        desc: "Master hooks, render props, and performance optimization."
    },
    {
        id: 2,
        title: "UI/UX Design Systems",
        category: "Design",
        image: "https://images.unsplash.com/photo-1586717791821-3f44a563dc4c?w=800&auto=format&fit=crop&q=60",
        desc: "Build scalable design languages for modern applications."
    },
    {
        id: 3,
        title: "Data Science Fundamentals",
        category: "Data",
        image: "https://images.unsplash.com/photo-1551288049-bbbda536339a?w=800&auto=format&fit=crop&q=60",
        desc: "Learn Python, Pandas, and visualization techniques."
    },
];


export function Toolbar() {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between" >
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input
                    type="text"
                    placeholder="Search courses..."
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-purple-900/30 border border-purple-500/30 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-purple-100 placeholder:text-purple-400/50"
                />
            </div>

            <div className="relative flex flex-row space-x-4">
                <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
                <select
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-purple-900/30 border border-purple-500/30 rounded-lg py-2 pl-10 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
                >
                    <option value="title">Sort by Name</option>
                    <option value="id">Newest First</option>
                </select>
                <button className="bg-purple-900/30 border border-purple-500/30 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div >
    )
}

export function CourseDisplay() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("title");

    const filteredCourses = COURSES
        .filter(course => course.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => (a[sortBy] > b[sortBy] ? 1 : -1));

    return (
        <motion.div
            animate={{ opacity: 1 }}
            className="w-full h-full"
        >


            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                    <div key={course.id} className="group flex flex-col bg-[#13111C] rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.15)]">
                        {/* Image Container */}
                        <div className="relative h-48 w-full overflow-hidden bg-slate-800">
                            <div className="absolute inset-0 bg-purple-900/20 z-10 group-hover:bg-transparent transition-colors duration-500" />
                            <img
                                src={course.image}
                                alt={course.title}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute top-3 left-3 z-20">
                                <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-purple-300 border border-purple-500/30">
                                    {course.category}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-lg font-bold text-purple-100 mb-2 group-hover:text-white transition-colors">
                                {course.title}
                            </h3>
                            <p className="text-sm text-purple-100/60 line-clamp-2 mb-4">
                                {course.desc}
                            </p>

                            <div className="mt-auto pt-4 border-t border-purple-500/10 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-xs text-purple-300">
                                    <BookOpen className="w-3 h-3" />
                                    <span>12 Lessons</span>
                                </div>
                                <button className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
                                    VIEW COURSE →
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

            </div>
        </motion.div >
    );
}