export function PreviewPanelHeader() {
    return (
        <div className="bg-blue-50 rounded-t-xl p-6 border-b border-blue-100 h-20 flex items-center">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1 bg-purple-600 rounded">
                    <div className="w-4 h-4 border-2 border-white rounded-full" />
                </div>
                Preview
            </h3>
        </div>
    )
}
