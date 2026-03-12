export function ViewTabToggle({ view, setView, mainCount, refreshCount }: {
    readonly view: 'module' | 'refresh'
    readonly setView: (v: 'module' | 'refresh') => void
    readonly mainCount: number
    readonly refreshCount: number
}) {
    return (
        <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <button
                type="button"
                onClick={() => setView('module')}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold transition-all ${
                    view === 'module'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
            >
                Module
                {mainCount > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${
                        view === 'module' ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                        {mainCount}
                    </span>
                )}
            </button>
            <div className="w-px bg-slate-200 self-stretch shrink-0" />
            <button
                type="button"
                onClick={() => setView('refresh')}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold transition-all ${
                    view === 'refresh'
                        ? 'bg-teal-500 text-white'
                        : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-teal-600'
                }`}
            >
                Refresh
                {refreshCount > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none ${
                        view === 'refresh' ? 'bg-teal-400 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                        {refreshCount}
                    </span>
                )}
            </button>
        </div>
    )
}
