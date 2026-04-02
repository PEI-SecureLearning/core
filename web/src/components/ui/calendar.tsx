import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: React.ComponentProps<typeof DayPicker>) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col gap-4 sm:flex-row",
                month: "space-y-4",
                caption: "relative flex items-center justify-center pt-1",
                caption_label: "text-sm font-medium",
                nav: "flex items-center gap-1",
                button_previous: cn(
                    buttonVariants({ variant: "outline", size: "icon-sm" }),
                    "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline", size: "icon-sm" }),
                    "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100"
                ),
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex",
                weekday:
                    "w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground",
                week: "mt-2 flex w-full",
                day: cn(
                    "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
                    "[&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50",
                    "[&:has([aria-selected].day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md",
                    "last:[&:has([aria-selected])]:rounded-r-md"
                ),
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),
                range_start: "day-range-start",
                range_end: "day-range-end",
                selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                today: "bg-accent text-accent-foreground",
                outside:
                    "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                disabled: "text-muted-foreground opacity-50",
                range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                PreviousMonthButton: ({ className: prevClassName, ...prevProps }) => (
                    <button className={cn(prevClassName)} {...prevProps}>
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                ),
                NextMonthButton: ({ className: nextClassName, ...nextProps }) => (
                    <button className={cn(nextClassName)} {...nextProps}>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                ),
            }}
            {...props}
        />
    )
}

export { Calendar }
