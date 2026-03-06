import { motion } from 'motion/react'
import { PageTitle } from './PageTitle'
import { Toolbar } from './ToolBar'

const transition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 40,
    mass: 1,
}

interface ContentPageLayoutProps {
    readonly title: string
    readonly children: React.ReactNode
    readonly onNew?: () => void
}

export function ContentPageLayout({ title, children, onNew }: ContentPageLayoutProps) {
    const newType = title.endsWith('s') ? title.slice(0, -1) : title

    return (
        <motion.div
            layoutId={`card-${title}`}
            transition={transition}
            className="w-full h-full py-4 px-6 bg-gray-50/50 flex flex-col relative"
        >
            <div className="w-full h-[8%] flex flex-row relative z-10">
                <PageTitle title={title} />
                <div className="w-[70%] flex flex-row gap-4 justify-end">
                    <Toolbar newType={newType} onAddClick={onNew} />
                </div>
            </div>

            <div className="w-full h-[92%] rounded-lg p-10 relative overflow-y-auto bg-gray-100 z-10 border border-gray-200">
                {children}
            </div>

            <motion.div layoutId={`icon-${title}`} transition={transition} />
        </motion.div>
    )
}
