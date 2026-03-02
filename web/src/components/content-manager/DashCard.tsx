import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import "../../css/dashcardmask.css";

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

interface DashCardProps {
    readonly title: string;
    readonly subtitle: string;
    readonly gradient: string;
    readonly shadowColor: string;
    readonly Icon?: React.ElementType | null;
    readonly to: string;
}


export function DashCard({ title, subtitle, gradient, shadowColor, Icon, to }: DashCardProps) {
    const [hovered, setHovered] = useState(false);
    const [plusHovered, setPlusHovered] = useState(false);

    return (
        <Link to={to} className="block h-full relative">

            <motion.div
                className="rounded-lg absolute bottom-1 right-1.5 w-[35%] h-[23.5%] z-20 p-4 flex items-center justify-center overflow-hidden"
                style={{
                    background: gradient,
                    boxShadow: `0 12px 24px -6px ${shadowColor}b3, 0 4px 12px -4px ${shadowColor}80`,
                }}
                animate={{
                    y: plusHovered ? -2 : -5,
                    scale: plusHovered ? 1.1 : 1
                }}
                transition={hover_transition}
                onHoverStart={() => setPlusHovered(true)}
                onHoverEnd={() => setPlusHovered(false)}
            >

                <motion.div
                    className="absolute inset-2 rounded-md border-solid pointer-events-none"
                    animate={{
                        borderWidth: plusHovered ? 4 : 2,
                        borderColor: plusHovered ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)'
                    }}
                    transition={hover_transition}
                />

                <motion.div className="relative z-10 flex flex-col items-center justify-center text-white"
                    animate={{ opacity: plusHovered ? 1 : 0.7 }}
                    transition={hover_transition}
                >
                    <Plus className="w-14 h-14 mb-1" strokeWidth={2.5} />

                </motion.div>

            </motion.div>

            <motion.div
                className="h-full"
                animate={{ y: hovered ? -10 : 0, scale: hovered ? 1.02 : 1 }}
                transition={transition}
                style={{
                    filter: `drop-shadow(0 20px 30px ${shadowColor}66) drop-shadow(0 8px 12px ${shadowColor}4d)`,
                }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
            >
                <motion.div
                    layoutId={`card-${title}`}
                    className="h-full rounded-lg p-4 flex flex-col overflow-hidden cursor-pointer dash-card-mask"

                    style={{
                        background: gradient,
                    }}
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
            </motion.div>
        </Link>
    );
}
