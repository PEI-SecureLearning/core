
import { motion } from "motion/react";

export function CourseTitle() {
    return (
        <div className="translate-y-[-10%]">
            <motion.h1 layoutId="title-Courses" className="text-2xl font-bold text-slate-900">Courses</motion.h1>
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-500 text-xl max-w-1xl"
            >
                Detailed list of all available courses and their management options.
            </motion.p>
        </div>
    )
}
