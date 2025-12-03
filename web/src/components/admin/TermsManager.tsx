import { useState } from 'react'
import { FileText, Upload, Download, Trash2, Eye } from 'lucide-react'

interface TermsFile {
    id: string
    name: string
    version: string
    date: string
    status: 'active' | 'archived'
    size: string
}

const MOCK_FILES: TermsFile[] = [
    { id: '1', name: 'Terms_of_Service_v2.pdf', version: '2.0', date: '2024-03-15', status: 'active', size: '2.4 MB' },
    { id: '2', name: 'Privacy_Policy_v1.pdf', version: '1.0', date: '2024-01-01', status: 'active', size: '1.1 MB' },
    { id: '3', name: 'Terms_of_Service_v1.pdf', version: '1.0', date: '2023-06-20', status: 'archived', size: '2.4 MB' },
]

export function TermsManager() {
    const [files] = useState(MOCK_FILES)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
                    <p className="text-gray-500 mt-1">Manage legal documents and agreements</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Upload size={18} />
                    Upload New Version
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-6">
                        {files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-red-500 shadow-sm">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            {file.name}
                                            {file.status === 'active' && (
                                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                    Active
                                                </span>
                                            )}
                                        </h3>
                                        <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                                            <span>Version {file.version}</span>
                                            <span>•</span>
                                            <span>Uploaded {file.date}</span>
                                            <span>•</span>
                                            <span>{file.size}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                                        <Eye size={20} />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download">
                                        <Download size={20} />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
