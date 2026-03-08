import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { PageTitle } from '@/components/content-manager/shared/PageTitle'
import { ToolbarModules, type ModuleSortValue } from '@/components/content-manager/modules/ToolBarModules'
import { ModuleDisplay } from '@/components/content-manager/modules/ModuleDisplay'

export const Route = createFileRoute('/content-manager/modules')({
    component: RouteComponent,
})

const transition = { type: 'spring' as const, stiffness: 300, damping: 40, mass: 1 }

function RouteComponent() {
    const navigate = useNavigate()

    const [search, setSearch] = useState('')
    const [sort,   setSort]   = useState<ModuleSortValue>('newest')

    const handleNewModule = () => {
        navigate({ to: '/content-manager/modules/new' as never })
    }

    return (
        <motion.div
            layoutId="card-Modules"
            transition={transition}
            className="w-full h-full py-4 px-6 bg-gray-50/50 flex flex-col relative"
        >
            <div className="w-full h-[8%] flex flex-row items-center relative z-10">
                <PageTitle title="Modules" />
                <div className="w-[70%] flex flex-row gap-4 items-center justify-end">
                    <ToolbarModules
                        searchValue={search}
                        onSearchChange={setSearch}
                        sortValue={sort}
                        onSortChange={setSort}
                    />
                    <button
                        type="button"
                        onClick={handleNewModule}
                        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white border border-purple-600 rounded-lg py-2 px-4 text-sm font-semibold transition-colors shadow-sm shadow-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        New Module
                    </button>
                </div>
            </div>

            <div className="w-full h-[92%] rounded-lg p-10 relative overflow-y-auto bg-gray-100 z-10 border border-gray-200">
                <ModuleDisplay search={search} sort={sort} />
            </div>

            <motion.div layoutId="icon-Modules" transition={transition} />
        </motion.div>
    )
}
