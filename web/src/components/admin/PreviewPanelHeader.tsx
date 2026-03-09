import { Eye } from 'lucide-react'

export function PreviewPanelHeader() {
    return (
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-700 tracking-tight uppercase">
                        Tenant Preview
                    </h3>
                </div>
            </div>
            <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                ))}
            </div>
        </div>
    )
}
