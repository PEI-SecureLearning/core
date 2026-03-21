interface RequiredAsteriskProps {
    readonly isValid?: boolean;
    readonly className?: string;
}

export default function RequiredAsterisk({
    isValid = true,
    className = ""
}: Readonly<RequiredAsteriskProps>) {
    const colorClass = isValid ? "text-muted-foreground" : "text-red-600";
    const mergedClassName = `transition-colors ${colorClass} ${className}`;

    return <span className={mergedClassName}>*</span>;
}
