import { useRef, useEffect, type TextareaHTMLAttributes } from 'react'

/** A <textarea> that grows downward to fit its content instead of scrolling or expanding right. */
export function AutoResizeTextarea({
    value,
    onChange,
    className,
    ...rest
}: Readonly<TextareaHTMLAttributes<HTMLTextAreaElement>>) {
    const ref = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${el.scrollHeight}px`
    }, [value])

    return (
        <textarea
            ref={ref}
            value={value}
            onChange={onChange}
            rows={1}
            className={`resize-none overflow-hidden ${className ?? ''}`}
            {...rest}
        />
    )
}
