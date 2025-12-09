import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function RiskTrendChart() {
  const data = [
    { month: 'JAN', value: 20 },
    { month: 'FEB', value: 22 },
    { month: 'MAR', value: 18 },
    { month: 'APR', value: 25 },
    { month: 'MAY', value: 38 },
    { month: 'JUN', value: 28 },
    { month: 'JUL', value: 12 },
    { month: 'AUG', value: 55 },
    { month: 'SEP', value: 52 },
    { month: 'OCT', value: 75 },
    { month: 'NOV', value: 95 },
    { month: 'DEC', value: 96 }
  ];

  const latestValue = data[data.length - 1].value;
  const previousValue = data[data.length - 2].value;
  const trend = latestValue - previousValue;

  return (
    <div className="w-full bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg shadow-slate-200/50 p-6 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/25">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Risk Trend</h3>
            <p className="text-[13px] text-slate-500">Monthly security risk assessment</p>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${trend >= 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
          <span className={`text-[13px] font-semibold ${trend >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-[12px] text-slate-500">vs last month</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              padding: '12px 16px',
            }}
            labelStyle={{ color: '#1e293b', fontWeight: 600, marginBottom: '4px' }}
            itemStyle={{ color: '#8b5cf6' }}
            formatter={(value: number) => [`${value}%`, 'Risk Level']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            strokeWidth={3}
            fill="url(#riskGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}