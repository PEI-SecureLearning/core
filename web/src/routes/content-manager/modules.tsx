import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { BookOpen } from 'lucide-react'


export const Route = createFileRoute('/content-manager/modules')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <motion.div
            layoutId="card-Modules"
            className="w-full h-full p-10"
            style={{ background: 'linear-gradient(130deg, ...)' }}
        >
            <div className="flex justify-between">
                <div>
                    <motion.h1 layoutId="title-Modules" className="text-6xl font-bold text-white">Modules</motion.h1>
                    <motion.p layoutId="sub-Modules" className="text-white">Detailed list of modules...</motion.p>
                </div>

                {/* The icon will fly to this new position */}
                <motion.div layoutId="icon-Modules" className="opacity-20">
                    <BookOpen className="w-40 h-40" />
                </motion.div>
            </div>

            {/* Rest of your page content fades in */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <h1>modules</h1>
            </motion.div>
        </motion.div>
    )
}
