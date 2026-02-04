'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MonthlySnapshot } from '@/lib/types';

interface SpendingTrendsChartProps {
  snapshots: MonthlySnapshot[];
}

export default function SpendingTrendsChart({ snapshots }: SpendingTrendsChartProps) {
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
    income: snapshot.income,
    expenses: snapshot.totalExpenses,
    savings: snapshot.totalSavings,
    surplus: snapshot.income - snapshot.totalExpenses,
  }));

  // Calculate averages
  const avgIncome = Math.round(
    snapshots.reduce((sum, s) => sum + s.income, 0) / snapshots.length
  );
  const avgExpenses = Math.round(
    snapshots.reduce((sum, s) => sum + s.totalExpenses, 0) / snapshots.length
  );
  const avgSavings = Math.round(
    snapshots.reduce((sum, s) => sum + s.totalSavings, 0) / snapshots.length
  );

  return (
    <div>
      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-green-50 p-3">
          <p className="text-xs text-green-700">Avg Income</p>
          <p className="text-lg font-bold text-green-900">
            {(avgIncome / 1000).toFixed(0)}k
          </p>
        </div>
        <div className="rounded-lg bg-red-50 p-3">
          <p className="text-xs text-red-700">Avg Expenses</p>
          <p className="text-lg font-bold text-red-900">
            {(avgExpenses / 1000).toFixed(0)}k
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-blue-700">Avg Savings</p>
          <p className="text-lg font-bold text-blue-900">
            {(avgSavings / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
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
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  income: 'Income',
                  expenses: 'Expenses',
                  savings: 'Savings',
                };
                return [`KES ${value.toLocaleString()}`, labels[name] || name];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  income: 'Income',
                  expenses: 'Expenses',
                  savings: 'Savings',
                };
                return labels[value] || value;
              }}
            />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="savings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Savings Rate */}
      <div className="mt-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Average Savings Rate</p>
            <p className="text-xs text-gray-600">
              Amount saved vs total income
            </p>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {avgIncome > 0 ? ((avgSavings / avgIncome) * 100).toFixed(1) : 0}%
          </p>
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