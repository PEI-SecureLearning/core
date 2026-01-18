import { useRef, useState } from 'react'
import { Upload, Image } from 'lucide-react'

interface TenantFormLogoProps {
    logoPreviewUrl: string | null
    onLogoSelect: (file: File | null) => void
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']
const MAX_LOGO_BYTES = 2 * 1024 * 1024

export function TenantFormLogo({ logoPreviewUrl, onLogoSelect }: TenantFormLogoProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [error, setError] = useState<string | null>(null)

    const validateFile = (file: File) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return 'Invalid file type. Use PNG, JPG, or SVG.'
        }
        if (file.size > MAX_LOGO_BYTES) {
            return 'Logo exceeds 2MB limit.'
        }
        return null
    }

    const handleFile = (file: File | null) => {
        if (!file) return
        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            return
        }
        setError(null)
        onLogoSelect(file)
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null
        handleFile(file)
        if (event.target) {
            event.target.value = ''
        }
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        const file = event.dataTransfer.files?.[0] || null
        handleFile(file)
    }

    const handleClick = () => fileInputRef.current?.click()

    return (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 rounded-2xl border border-blue-100/50 flex flex-col h-full">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-200/50">
                    <Image className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Brand Logo</h3>
                    <p className="text-xs text-gray-500">Upload your organization's logo</p>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                className="hidden"
                onChange={handleInputChange}
            />
            <div
                className="flex-1 border-2 border-dashed border-blue-200/70 rounded-2xl flex flex-col items-center justify-center p-6 bg-white/60 backdrop-blur-sm cursor-pointer hover:bg-blue-50/50 hover:border-blue-300 transition-all duration-300 group min-h-[140px] overflow-hidden"
                onClick={handleClick}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
            >
                {logoPreviewUrl ? (
                    <img
                        src={logoPreviewUrl}
                        alt="Organization logo preview"
                        className="max-h-28 max-w-full object-contain"
                    />
                ) : (
                    <>
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-100/50">
                            <Upload className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 text-center">
                            Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1.5">
                            SVG, PNG, JPG (max. 2MB)
                        </p>
                    </>
                )}
            </div>

            {error && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
            )}

            {/* Tip */}
            <div className="mt-4 pt-4 border-t border-blue-100/50">
                <p className="text-xs text-gray-500">
                    <span className="font-medium text-blue-600">Tip:</span> Use a square logo with transparent background for best results
                </p>
            </div>
        </div>
    )
}
