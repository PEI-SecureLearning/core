import { BookOpen, Blocks, FileStack } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

const hover_transition = {
    type: "spring" as const,
    duration: 0.5,
    stiffness: 300,
    damping: 22,
};

const transition = {
    type: "spring" as const,
    duration: 0.5,
    stiffness: 150,
    damping: 22,
};

// 1. Update your Props interface (assuming it's defined nearby)
interface DashCardProps {
    title: string;
    subtitle: string;
    gradient: string;
    shadowColor: string;
    Icon?: React.ElementType | null; // Allow it to be optional or null
    to: string;
}

export function DashCard({ title, subtitle, gradient, shadowColor, Icon, to }: DashCardProps) {
    const [hovered, setHovered] = useState(false);
    // const navigate = useNavigate(); // See note below about double navigation

    return (
        <Link to={to} className="block h-full">
            <motion.div
                layoutId={`card-${title}`}
                className="h-full rounded-lg p-4 flex flex-col overflow-hidden cursor-pointer"
                style={{
                    background: gradient,
                    boxShadow: `0 20px 50px -8px ${shadowColor}8c, 0 8px 20px -4px ${shadowColor}4d`,
                }}
                animate={{ y: hovered ? -10 : 0, scale: hovered ? 1.02 : 1 }}
                transition={transition}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
            >
                <motion.div
                    className="h-[50%]"
                    animate={{ opacity: hovered ? 1 : 0.78 }}
                    transition={hover_transition}
                >
                    <motion.h1 layoutId={`title-${title}`} className="text-6xl font-bold text-white">{title}</motion.h1>
                    <motion.h1 layoutId={`subtitle-${title}`} className="text-2xl font-bold text-white">{subtitle}</motion.h1>
                </motion.div>

                {/* 2. Conditional Rendering for the Icon container */}
                {Icon && (
                    <motion.div
                        layoutId={`icon-${title}`}
                        className="h-[50%] flex items-end justify-end rotate-12 translate-x-15 translate-y-10"
                        animate={{ opacity: hovered ? 1 : 0.72 }}
                        transition={hover_transition}
                    >
                        <Icon className="w-96 h-96 text-white scale-[1.2]" />
                    </motion.div>
                )}
            </motion.div>
        </Link>
    );
}

function ContManDashboard() {
    return (
        <div className="w-full h-full bg-gray-50/50">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-[10%] px-8 py-4 flex flex-col md:flex-row justify-between items-start gap-4"
            >
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 mb-2">
                        <span>Content Manager</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Manage courses, modules, and content.
                    </p>
                </div >

            </motion.div >

            <div className="w-full h-[85%] px-5 p-14 flex flex-row gap-8 justify-center mt-5 ">
                <DashCard
                    title="Courses"
                    subtitle="See the existing courses"
                    gradient="linear-gradient(130deg, hsla(24, 100%, 70%, 1.00) 8%, #ff8000ff 70%, #f49e1dff 100%)"
                    shadowColor="#ff8000"
                    Icon={BookOpen}
                    to="/content-manager/courses"
                />
                <DashCard
                    title="Modules"
                    subtitle="Browse recent modules"
                    gradient="linear-gradient(130deg, hsla(210, 100%, 70%, 1.00) 8%, #1a7fffff 70%, #1d9af4ff 100%)"
                    shadowColor="#1a7fff"
                    Icon={Blocks}
                    to="/content-manager/modules"
                />
                <DashCard
                    title="Content"
                    subtitle="Manage media content"
                    gradient="linear-gradient(130deg, hsla(145, 70%, 55%, 1.00) 8%, #16a34aff 70%, #1dd47aff 100%)"
                    shadowColor="#16a34a"
                    Icon={FileStack}
                    to="/content-manager/content"
                />
            </div>
        </div >
    );
}

export default ContManDashboard;