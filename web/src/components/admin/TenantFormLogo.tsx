import { Upload } from 'lucide-react'

export function TenantFormLogo() {
    return (
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col h-full">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 h-6">Upload logo</h3>
            <div className="flex-1 border-2 border-dashed border-blue-200 rounded-lg flex flex-col items-center justify-center p-6 bg-white cursor-pointer hover:bg-blue-50 transition-colors min-h-[160px]">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-sm text-center text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-center text-gray-400 mt-1">SVG, PNG, JPG (max. 2MB)</p>
            </div>
        </div>
    )
}
