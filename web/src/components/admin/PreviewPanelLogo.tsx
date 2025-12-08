export function PreviewPanelLogo() {
    return (
        <div className="flex flex-col items-center py-8 border-b border-blue-100">
            <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg opacity-50" />
            </div>
            <p className="text-sm text-gray-500">Organization Logo</p>
        </div>
    )
}
