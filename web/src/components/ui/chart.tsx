import * as React from "react";
import {
    ResponsiveContainer,
    type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
    string,
    {
        label?: string;
        color?: string;
    }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
    const context = React.useContext(ChartContext);

    if (!context) {
        throw new Error("useChart must be used within a ChartContainer.");
    }

    return context;
}

interface ChartContainerProps {
    config: ChartConfig;
    className?: string;
    children: React.ReactNode;
}

export function ChartContainer({ config, className, children }: Readonly<ChartContainerProps>) {
    const chartId = React.useId().replaceAll(":", "");
    const contextValue = React.useMemo(() => ({ config }), [config]);

    return (
        <ChartContext.Provider value={contextValue}>
            <div data-chart={chartId} className={cn("w-full", className)}>
                <style>{`
          [data-chart="${chartId}"] {
            ${Object.entries(config)
                        .map(([key, value]) =>
                            value.color ? `--color-${key}: ${value.color};` : ""
                        )
                        .join("\n")}
          }
        `}</style>
                <ResponsiveContainer>{children}</ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
}

export { Tooltip as ChartTooltip } from "recharts";

interface ChartTooltipContentProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, keyof TooltipContentProps<ValueType, NameType>>,
    Partial<TooltipContentProps<ValueType, NameType>> {
    hideLabel?: boolean;
}

export function ChartTooltipContent({
    active,
    payload,
    label,
    hideLabel = false,
    className,
}: Readonly<ChartTooltipContentProps>) {
    const { config } = useChart();

    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div
            className={cn(
                "rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md",
                className
            )}
        >
            {!hideLabel && label ? (
                <p className="mb-1 text-muted-foreground">{String(label)}</p>
            ) : null}

            <div className="space-y-1">
                {payload.map((item: TooltipContentProps<ValueType, NameType>["payload"][number]) => {
                    const key = String(item.dataKey ?? item.name ?? "value");
                    const value = item.value;
                    const itemConfig = config[key];
                    const itemLabel = itemConfig?.label ?? String(item.name ?? key);

                    return (
                        <div key={key} className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">{itemLabel}</span>
                            <span className="font-medium text-foreground">{String(value ?? 0)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
