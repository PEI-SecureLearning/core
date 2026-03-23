export function ViewTabToggle({ view, setView, mainCount, refreshCount }: {
    readonly view: 'module' | 'refresh'
    readonly setView: (v: 'module' | 'refresh') => void
    readonly mainCount: number
    readonly refreshCount: number
}) {
    return (
        <div className="inline-flex rounded-lg border border-border overflow-hidden shadow-sm">
            <button
                type="button"
                onClick={() => setView('module')}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold transition-all ${view === 'module'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-foreground'
                    }`}
            >
                Module
                {mainCount > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${view === 'module' ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted-foreground'
                        }`}>
                        {mainCount}
                    </span>
                )}
            </button>
            <div className="w-px bg-border self-stretch shrink-0" />
            <button
                type="button"
                onClick={() => setView('refresh')}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold transition-all ${view === 'refresh'
                        ? 'bg-accent-secondary text-primary-foreground'
                        : 'bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-accent-secondary'
                    }`}
            >
                Refresh
                {refreshCount > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${view === 'refresh' ? 'bg-accent-secondary/80 text-primary-foreground' : 'bg-surface text-muted-foreground'
                        }`}>
                        {refreshCount}
                    </span>
                )}
            </button>
        </div>
    )
}
