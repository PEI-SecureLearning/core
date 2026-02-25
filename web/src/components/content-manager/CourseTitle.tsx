
import { motion } from "motion/react";

export function CourseTitle() {
    return (
        <div className="w-[30%] translate-y-[-10%] flex items-center">
            <motion.h1 layoutId="title-Courses" className="text-3xl font-bold text-slate-900">Courses</motion.h1>

        </div>
    )
}
