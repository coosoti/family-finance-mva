'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { db } from '@/lib/db';
import { getCurrentMonth } from '@/lib/calculations';

interface ComparisonData {
  category: string;
  budgeted: number;
  actual: number;
  difference: number;
  type: string;
}

export default function BudgetComparisonChart() {
  const [data, setData] = useState<ComparisonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ budgeted: 0, actual: 0, difference: 0 });

  useEffect(() => {
    loadComparisonData();
  }, []);

  const loadComparisonData = async () => {
    setIsLoading(true);
    try {
      const currentMonth = getCurrentMonth();
      const [categories, transactions] = await Promise.all([
        db.getBudgetCategories(),
        db.getTransactionsByMonth(currentMonth),
      ]);

      // Calculate actual spending per category
      const categorySpending = new Map<string, number>();
      transactions
        .filter((t) => t.type === 'expense')
        .forEach((tx) => {
          const current = categorySpending.get(tx.categoryId) || 0;
          categorySpending.set(tx.categoryId, current + tx.amount);
        });

      // Group by type for better visualization
      const typeData: Record<string, { budgeted: number; actual: number }> = {
        needs: { budgeted: 0, actual: 0 },
        wants: { budgeted: 0, actual: 0 },
        savings: { budgeted: 0, actual: 0 },
        growth: { budgeted: 0, actual: 0 },
      };

      categories.forEach((cat) => {
        const actual = categorySpending.get(cat.id) || 0;
        typeData[cat.type].budgeted += cat.budgetedAmount;
        typeData[cat.type].actual += actual;
      });

      // Convert to chart data
      const chartData: ComparisonData[] = Object.entries(typeData).map(([type, values]) => ({
        category: formatTypeName(type),
        budgeted: values.budgeted,
        actual: values.actual,
        difference: values.budgeted - values.actual,
        type,
      }));

      setData(chartData);

      // Calculate summary
      const totalBudgeted = chartData.reduce((sum, d) => sum + d.budgeted, 0);
      const totalActual = chartData.reduce((sum, d) => sum + d.actual, 0);
      setSummary({
        budgeted: totalBudgeted,
        actual: totalActual,
        difference: totalBudgeted - totalActual,
      });
    } catch (error) {
      console.error('Error loading comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        No budget data available
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-blue-700">Budgeted</p>
          <p className="text-lg font-bold text-blue-900">
            {(summary.budgeted / 1000).toFixed(0)}k
          </p>
        </div>
        <div className="rounded-lg bg-purple-50 p-3">
          <p className="text-xs text-purple-700">Actual</p>
          <p className="text-lg font-bold text-purple-900">
            {(summary.actual / 1000).toFixed(0)}k
          </p>
        </div>
        <div
          className={`rounded-lg p-3 ${
            summary.difference >= 0 ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          <p className={`text-xs ${summary.difference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {summary.difference >= 0 ? 'Under Budget' : 'Over Budget'}
          </p>
          <p
            className={`text-lg font-bold ${
              summary.difference >= 0 ? 'text-green-900' : 'text-red-900'
            }`}
          >
            {(Math.abs(summary.difference) / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="category"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              width={100}
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
                  budgeted: 'Budgeted',
                  actual: 'Actual',
                };
                return [`KES ${value.toLocaleString()}`, labels[name] || name];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  budgeted: 'Budgeted',
                  actual: 'Actual Spent',
                };
                return labels[value] || value;
              }}
            />
            <Bar dataKey="budgeted" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            <Bar dataKey="actual" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.actual > entry.budgeted ? '#ef4444' : '#8b5cf6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed breakdown */}
      <div className="mt-6 space-y-2">
        {data.map((item) => {
          const percentage = item.budgeted > 0 ? (item.actual / item.budgeted) * 100 : 0;
          const isOverBudget = item.actual > item.budgeted;

          return (
            <div
              key={item.category}
              className={`rounded-lg p-3 ${
                isOverBudget ? 'bg-red-50' : 'bg-green-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{item.category}</span>
                <span
                  className={`text-sm font-semibold ${
                    isOverBudget ? 'text-red-700' : 'text-green-700'
                  }`}
                >
                  {percentage.toFixed(0)}% {isOverBudget ? 'over' : 'of'} budget
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
                <span>KES {item.actual.toLocaleString()} spent</span>
                <span>
                  {isOverBudget ? '+' : ''}
                  {Math.abs(item.difference).toLocaleString()} {isOverBudget ? 'over' : 'remaining'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTypeName(type: string): string {
  const names: Record<string, string> = {
    needs: 'Needs',
    wants: 'Wants',
    savings: 'Savings',
    growth: 'Growth',
  };
  return names[type] || type;
}