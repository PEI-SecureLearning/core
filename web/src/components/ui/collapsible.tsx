import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

function Collapsible({
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
    return <CollapsiblePrimitive.Root {...props} />
}
Collapsible.displayName = "Collapsible"

function CollapsibleTrigger({
    className,
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
    return (
        <CollapsiblePrimitive.Trigger
            data-slot="collapsible-trigger"
            className={className}
            {...props}
        />
    )
}
CollapsibleTrigger.displayName = "CollapsibleTrigger"

function CollapsibleContent({
    className,
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content>) {
    return (
        <CollapsiblePrimitive.Content
            data-slot="collapsible-content"
            className={className}
            {...props}
        />
    )
}
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
