
import { motion } from "motion/react";

export function ModuleTitle() {
    return (
        <div className="w-[30%] translate-y-[-10%] flex items-center">
            <motion.h1 layoutId="title-Modules" className="text-3xl font-bold text-slate-900">Modules</motion.h1>

        </div>
    )
}
