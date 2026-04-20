import {
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

export default function RiskTrendChart() {
  const data = [
    { month: "JAN", value: 20 },
    { month: "FEB", value: 22 },
    { month: "MAR", value: 18 },
    { month: "APR", value: 25 },
    { month: "MAY", value: 38 },
    { month: "JUN", value: 28 },
    { month: "JUL", value: 12 },
    { month: "AUG", value: 55 },
    { month: "SEP", value: 52 },
    { month: "OCT", value: 75 },
    { month: "NOV", value: 95 },
    { month: "DEC", value: 96 }
  ];

  const latestValue = data.at(-1)?.value;
  const previousValue = data.at(-2)?.value;
  const trend = latestValue && previousValue ? latestValue - previousValue : 0;
  const formatTooltipValue = (
    value: ValueType | undefined,
    _name: NameType | undefined
  ): [string, NameType] => [`${value ?? 0}%`, "Risk Level"];

  return (
    <div className="w-full bg-background/60 backdrop-blur-xl rounded-2xl border-2 border-border/40 shadow-lg shadow-muted/50 p-6 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-primary shadow-lg shadow-primary/25">
            <TrendingUp size={20} className="text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground">
              Risk Trend
            </h3>
            <p className="text-[13px] text-muted-foreground wrap-break-word">
              Monthly security risk assessment
            </p>
          </div>
        </div>

        {/* Trend Indicator */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${trend >= 0 ? "bg-error/10" : "bg-success/10"}`}
        >
          <span
            className={`text-[13px] font-semibold ${trend >= 0 ? "text-error" : "text-success"}`}
          >
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
          <span className="text-[12px] text-muted-foreground">
            vs last month
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                padding: "12px 16px"
              }}
              labelStyle={{
                color: "var(--foreground)",
                fontWeight: 600,
                marginBottom: "4px"
              }}
              itemStyle={{ color: "var(--primary)" }}
              formatter={formatTooltipValue}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={3}
              fill="url(#riskGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
