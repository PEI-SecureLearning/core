import { Eye } from 'lucide-react'

export function PreviewPanelHeader() {
    return (
        <div className="bg-surface-subtle/50 p-6 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div>
                    <h3 className="text-lg font-bold text-foreground/90 tracking-tight uppercase">
                        Tenant Preview
                    </h3>
                </div>
            </div>
            <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted/60" />
                ))}
            </div>
        </div>
    )
}
