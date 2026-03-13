import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { Plus } from 'lucide-react'
import UniversalFilters, { type GridCols } from '@/components/courses/UniversalFilters'
import { ModuleDisplay } from '@/components/content-manager/modules/ModuleDisplay'

type ModuleSortValue = 'newest' | 'oldest' | 'title_asc' | 'title_desc'

export const Route = createFileRoute('/content-manager/modules')({
    component: RouteComponent,
})



function RouteComponent() {
    const navigate = useNavigate()

    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<ModuleSortValue>('newest')
    const [cols, setCols] = useState<GridCols>(3)
    const [resultCount, setResultCount] = useState(0)

    const handleNewModule = () => {
        navigate({ to: '/content-manager/modules/new' as never })
    }

    return (
        <div className="w-full h-full py-4 px-6 bg-background flex flex-col relative">
            <div className="w-full h-auto mb-6 flex flex-col gap-6 relative z-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Modules</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create and manage learning modules to build your course content.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleNewModule}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 active:scale-[0.97]"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        New Module
                    </button>
                </div>

                <UniversalFilters<ModuleSortValue>
                    search={search}
                    onSearchChange={setSearch}
                    primaryFilterValue={sort}
                    primaryFilterOptions={['newest', 'oldest', 'title_asc', 'title_desc']}
                    onPrimaryFilterChange={setSort}
                    primaryLabel="Sort by"
                    secondaryFilterValue="All"
                    secondaryFilterOptions={['All']}
                    onSecondaryFilterChange={() => { }}
                    secondaryLabel="All Categories"
                    cols={cols}
                    onColsChange={setCols}
                    resultCount={resultCount}
                    entityName="module"
                />
            </div>

            <div className="flex-1 rounded-2xl p-8 relative overflow-hidden bg-surface z-10 border border-border overflow-y-auto">
                <ModuleDisplay search={search} sort={sort} cols={cols} onResultCountChange={setResultCount} />
            </div>

        </div>
    )
}
