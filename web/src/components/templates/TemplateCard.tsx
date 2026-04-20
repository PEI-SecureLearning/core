import { Edit2, Eye, Trash2, Layout, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Template } from './types'

function ActionButton({
    onClick,
    icon: Icon,
    title,
    variant = 'default',
    disabled = false
}: {
    onClick: () => void,
    icon: any,
    title: string,
    variant?: 'default' | 'danger',
    disabled?: boolean
}) {
    return (
        <button
            disabled={disabled}
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={cn(
                "p-1.5 rounded-lg border border-border/50 text-muted-foreground transition-all shadow-sm bg-background",
                variant === 'danger'
                    ? "hover:text-red-500 hover:bg-red-50 hover:border-red-200"
                    : "hover:text-primary hover:bg-primary/5 hover:border-primary/20",
                disabled && "opacity-50 cursor-not-allowed hover:bg-background hover:border-border/50 hover:text-muted-foreground"
            )}
            title={title}
        >
            <Icon size={14} />
        </button>
    )
}

interface Props {
  readonly template: Template;
  readonly isEmail?: boolean;
  readonly layout?: 'grid' | 'list';
  readonly onPreview?: () => void;
  readonly onEdit?: () => void;
  readonly onDelete?: () => void;
  readonly deleting?: boolean;
}

export function TemplateCard({ template, isEmail = true, layout = 'grid', onPreview, onEdit, onDelete, deleting = false }: Props) {
    const isList = layout === 'list'
    const updatedDate = new Date(template.updated_at).toLocaleDateString()

    return (
        <div
            className={cn(
                "group relative flex bg-background border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300",
                isList ? "flex-row flex-wrap sm:flex-nowrap items-center min-h-[5rem]" : "flex-col",
            )}
        >
            {/* Content Section */}
            <div className={cn("flex flex-col flex-1 gap-2 min-w-0 w-full", isList ? "px-5 py-3" : "p-5")}>
                <div className={cn("flex justify-between items-start", isList && "items-center")}>
                    <div className="flex items-center gap-3 w-full">
                        {isList && (
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 hidden sm:flex">
                                {isEmail ? <Mail className="h-5 w-5 text-primary/70" /> : <Layout className="h-5 w-5 text-primary/70" />}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h3 className={cn(
                                "font-semibold text-foreground group-hover:text-primary transition-colors leading-snug",
                                isList ? "text-base truncate" : "text-sm line-clamp-1"
                            )}>
                                {template.name}
                            </h3>
                        </div>
                    </div>
                    {/* Category Badge */}
                    {!isList && template.category && (
                        <span className="px-2 py-0.5 bg-primary/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 ml-2 shrink-0">
                            {template.category}
                        </span>
                    )}
                </div>

                <p className={cn(
                    "text-muted-foreground leading-relaxed flex-1 mt-1",
                    isList ? "text-sm truncate" : "text-xs line-clamp-3"
                )}>
                    {template.description || "No description provided."}
                </p>

                {/* Footer: Metadata & Actions */}
                <div className={cn(
                    "flex items-center justify-between",
                    !isList && "pt-3 border-t border-border/40 mt-auto",
                    isList && "mt-1 w-full sm:w-auto"
                )}>
                    {/* Metadata Row */}
                    <div className="flex items-center gap-4 text-muted-foreground/70">
                        <div className="flex items-center gap-1 text-[11px] whitespace-nowrap">
                            Updated {updatedDate}
                        </div>
                        {isList && template.category && (
                            <span className="px-2 py-0.5 bg-primary/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 hidden sm:inline-block truncate">
                                {template.category}
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    {(onEdit || onPreview || onDelete) && (
                        <div className="flex items-center gap-1.5 ml-auto">
                            {onPreview && <ActionButton onClick={onPreview} icon={Eye} title="Preview" />}
                            {onEdit && <ActionButton onClick={onEdit} icon={Edit2} title="Edit" />}
                            {onDelete && <ActionButton onClick={onDelete} icon={Trash2} title="Delete" variant="danger" disabled={deleting} />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
