
import { motion } from "motion/react";

export function ContentTitle() {
    return (
        <div className="w-[30%] translate-y-[-10%] flex items-center">
            <motion.h1 layoutId="title-Content" className="text-3xl font-bold text-slate-900">Content</motion.h1>

        </div>
    )
}
