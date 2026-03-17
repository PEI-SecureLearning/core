import { Outlet } from '@tanstack/react-router'

export function AdminLayout() {
    return (
        <div className="flex h-full w-full bg-surface-subtle">
            <div className="flex-1 overflow-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
