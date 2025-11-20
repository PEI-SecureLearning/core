import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

//this component shows a line chart representing risk trends over the months

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full h-full p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" vertical={false} />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            ticks={[0, 20, 40, 60, 80, 100]}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#6366f1" 
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}