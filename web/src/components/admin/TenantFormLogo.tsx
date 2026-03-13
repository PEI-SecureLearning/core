import { useRef, useState } from 'react'
import { Upload, Image } from 'lucide-react'

type TenantFormLogoProps = Readonly<{
    logoPreviewUrl: string | null
    onLogoSelect: (file: File | null) => void
}>

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

    const handleDrop = (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault()
        const file = event.dataTransfer.files?.[0] || null
        handleFile(file)
    }

    const handleClick = () => fileInputRef.current?.click()
    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleClick()
        }
    }

    return (
        <div className="translate-y-5 max-w-80 bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 rounded-2xl border border-blue-100/50 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow shadow-blue-200/50">
                    <Image className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                    <h3 className="text-xs font-bold text-foreground">Brand Logo</h3>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                className="hidden"
                onChange={handleInputChange}
            />
            <button
                type="button"
                className="flex-1 border-2 border-dashed border-blue-200/70 rounded-xl flex flex-col items-center justify-center p-4 bg-background/60 backdrop-blur-sm cursor-pointer hover:bg-blue-50/50 hover:border-blue-300 transition-all duration-300 group min-h-[120px] overflow-hidden"
                onClick={handleClick}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                onKeyDown={handleKeyDown}
                aria-label="Upload tenant logo"
            >
                {logoPreviewUrl ? (
                    <img
                        src={logoPreviewUrl}
                        alt="Organization logo preview"
                        className="max-h-23 max-w-full object-contain"
                    />
                ) : (
                    <>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow shadow-blue-100/50">
                            <Upload className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-xs font-semibold text-foreground/90 text-center">
                            Upload Logo
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                            SVG, PNG, JPG (max. 2MB)
                        </p>
                    </>
                )}
            </button>

            {error && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
            )}

        </div>
    )
}
