import { motion } from "motion/react"

export function PageTitle({ title }: { readonly title: string }) {
    return (
        <div className="w-[30%] translate-y-[-10%] flex items-center">
            <motion.h1 layoutId={`title-${title}`} className="text-3xl font-bold text-slate-900">
                {title}
            </motion.h1>
        </div>
    )
}
