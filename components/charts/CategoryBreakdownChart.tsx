'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { db } from '@/lib/db';
import { getCurrentMonth } from '@/lib/calculations';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  needs: '#ef4444',    // red
  wants: '#f59e0b',    // yellow/amber
  savings: '#10b981',  // green
  growth: '#3b82f6',   // blue
};

export default function CategoryBreakdownChart() {
  const [data, setData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCategoryData();
  }, []);

  const loadCategoryData = async () => {
    setIsLoading(true);
    try {
      const currentMonth = getCurrentMonth();
      const [categories, transactions] = await Promise.all([
        db.getBudgetCategories(),
        db.getTransactionsByMonth(currentMonth),
      ]);

      // Calculate spending per type
      const typeSpending: Record<string, number> = {
        needs: 0,
        wants: 0,
        savings: 0,
        growth: 0,
      };

      transactions
        .filter((t) => t.type === 'expense')
        .forEach((tx) => {
          const category = categories.find((c) => c.id === tx.categoryId);
          if (category) {
            typeSpending[category.type] += tx.amount;
          }
        });

      // Convert to chart data
      const chartData: CategoryData[] = Object.entries(typeSpending)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({
          name: formatCategoryName(key),
          value,
          color: COLORS[key as keyof typeof COLORS],
        }));

      setData(chartData);
      setTotal(chartData.reduce((sum, item) => sum + item.value, 0));
    } catch (error) {
      console.error('Error loading category data:', error);
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
        No spending data for current month
      </div>
    );
  }

  return (
    <div>
      {/* Pie Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => `KES ${value.toLocaleString()}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with amounts */}
      <div className="mt-6 space-y-3">
        {data.map((item) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">
                  KES {item.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">Total Spending</span>
          <span className="text-xl font-bold text-gray-900">
            KES {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function renderCustomizedLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label for very small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function formatCategoryName(type: string): string {
  const names: Record<string, string> = {
    needs: 'Needs (50%)',
    wants: 'Wants (30%)',
    savings: 'Savings (15%)',
    growth: 'Growth (5%)',
  };
  return names[type] || type;
}