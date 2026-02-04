'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { MonthlySnapshot } from '@/lib/types';

interface NetWorthGrowthChartProps {
  snapshots: MonthlySnapshot[];
}

export default function NetWorthGrowthChart({ snapshots }: NetWorthGrowthChartProps) {
  if (snapshots.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        No data available
      </div>
    );
  }

  // Prepare data for chart
  const chartData = snapshots.map((snapshot) => ({
    month: formatMonth(snapshot.month),
    netWorth: snapshot.netWorth,
    income: snapshot.income,
    expenses: snapshot.totalExpenses,
  }));

  // Calculate growth percentage
  const firstValue = snapshots[0].netWorth;
  const lastValue = snapshots[snapshots.length - 1].netWorth;
  const growth = lastValue - firstValue;
  const growthPercentage = firstValue !== 0 ? (growth / firstValue) * 100 : 0;

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gradient-to-r from-green-50 to-green-100 p-3">
          <p className="text-xs text-green-700">Total Growth</p>
          <p className="text-xl font-bold text-green-900">
            {growth >= 0 ? '+' : ''}KES {growth.toLocaleString()}
          </p>
          <p className="text-xs text-green-700">
            {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 p-3">
          <p className="text-xs text-blue-700">Current Net Worth</p>
          <p className="text-xl font-bold text-blue-900">
            KES {lastValue.toLocaleString()}
          </p>
          <p className="text-xs text-blue-700">
            {formatMonth(snapshots[snapshots.length - 1].month)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Net Worth']}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="#10b981"
              strokeWidth={3}
              fill="url(#netWorthGradient)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span>Net Worth Trend</span>
        </div>
      </div>
    </div>
  );
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}