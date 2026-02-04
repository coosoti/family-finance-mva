'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Calendar, PieChart as PieChartIcon } from 'lucide-react';
import { db } from '@/lib/db';
import { UserProfile, MonthlySnapshot } from '@/lib/types';
import { getCurrentMonth, calculateNetWorth } from '@/lib/calculations';
import { updateCurrentMonthSnapshot } from '@/lib/snapshot-utils';
import BottomNav from '@/components/BottomNav';
import SpendingTrendsChart from '@/components/charts/SpendingTrendsChart';
import NetWorthGrowthChart from '@/components/charts/NetWorthGrowthChart';
import CategoryBreakdownChart from '@/components/charts/CategoryBreakdownChart';
import BudgetComparisonChart from '@/components/charts/BudgetComparisonChart';

type TimeRange = '3m' | '6m' | '12m' | 'all';

export default function AnalyticsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('6m');
  const [isLoading, setIsLoading] = useState(true);
  const [netWorth, setNetWorth] = useState(0);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const userProfile = await db.getUserProfile();
      if (!userProfile) {
        router.push('/setup');
        return;
      }
      setProfile(userProfile);

      // Load monthly snapshots
      const allSnapshots = await db.getAllMonthlySnapshots();
      setSnapshots(allSnapshots.sort((a, b) => a.month.localeCompare(b.month)));

      // Calculate current net worth
      const currentNetWorth = await calculateNetWorth();
      setNetWorth(currentNetWorth);

      // Ensure current month has a snapshot
      await updateCurrentMonthSnapshot();
      
      // Reload snapshots after update
      const updatedSnapshots = await db.getAllMonthlySnapshots();
      setSnapshots(updatedSnapshots.sort((a, b) => a.month.localeCompare(b.month)));
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredSnapshots = () => {
    if (timeRange === 'all') return snapshots;

    const months = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
    return snapshots.slice(-months);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const filteredSnapshots = getFilteredSnapshots();
  const hasData = filteredSnapshots.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
        <button onClick={() => router.push('/dashboard')} className="mb-4 flex items-center gap-2">
          <ArrowLeft size={20} />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-bold">Analytics</h1>
            <p className="text-purple-100">Financial trends & insights</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Net Worth</p>
            <p className="text-2xl font-bold">
              {netWorth >= 0 ? '' : '-'}KES {Math.abs(netWorth).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { value: '3m' as TimeRange, label: '3 Months' },
            { value: '6m' as TimeRange, label: '6 Months' },
            { value: '12m' as TimeRange, label: '12 Months' },
            { value: 'all' as TimeRange, label: 'All Time' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                timeRange === option.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 p-6">
        {!hasData ? (
          <div className="card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
              <PieChartIcon size={32} className="text-purple-600" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">No Data Yet</h3>
            <p className="text-sm text-gray-600">
              Start tracking your expenses and savings to see charts and trends
            </p>
          </div>
        ) : (
          <>
            {/* Net Worth Growth Chart */}
            <div className="card">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Net Worth Growth</h2>
              </div>
              <NetWorthGrowthChart snapshots={filteredSnapshots} />
            </div>

            {/* Spending Trends Chart */}
            <div className="card">
              <div className="mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Monthly Spending Trends</h2>
              </div>
              <SpendingTrendsChart snapshots={filteredSnapshots} />
            </div>

            {/* Category Breakdown */}
            <div className="card">
              <div className="mb-4 flex items-center gap-2">
                <PieChartIcon size={20} className="text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Spending by Category</h2>
              </div>
              <CategoryBreakdownChart />
            </div>

            {/* Budget vs Actual Comparison */}
            <div className="card">
              <div className="mb-4 flex items-center gap-2">
                <PieChartIcon size={20} className="text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">Budget vs Actual</h2>
              </div>
              <BudgetComparisonChart />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Avg Monthly Expenses"
                value={
                  filteredSnapshots.length > 0
                    ? Math.round(
                        filteredSnapshots.reduce((sum, s) => sum + s.totalExpenses, 0) /
                          filteredSnapshots.length
                      )
                    : 0
                }
                trend={calculateTrend(filteredSnapshots, 'totalExpenses')}
              />
              <StatCard
                label="Avg Monthly Savings"
                value={
                  filteredSnapshots.length > 0
                    ? Math.round(
                        filteredSnapshots.reduce((sum, s) => sum + s.totalSavings, 0) /
                          filteredSnapshots.length
                      )
                    : 0
                }
                trend={calculateTrend(filteredSnapshots, 'totalSavings')}
              />
            </div>

            {/* Insights */}
            {filteredSnapshots.length >= 2 && (
              <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
                <h3 className="mb-3 font-semibold text-gray-900">💡 Insights</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <InsightItem snapshots={filteredSnapshots} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: number;
  trend: number;
}) {
  const isPositive = trend >= 0;
  const trendColor = isPositive ? 'text-green-600' : 'text-red-600';

  return (
    <div className="card">
      <p className="mb-1 text-xs text-gray-600">{label}</p>
      <p className="mb-2 text-2xl font-bold text-gray-900">
        KES {value.toLocaleString()}
      </p>
      {trend !== 0 && (
        <p className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendingUp size={12} className={isPositive ? '' : 'rotate-180'} />
          {Math.abs(trend).toFixed(1)}% vs prev period
        </p>
      )}
    </div>
  );
}

function calculateTrend(
  snapshots: MonthlySnapshot[],
  field: keyof MonthlySnapshot
): number {
  if (snapshots.length < 2) return 0;

  const recent = snapshots.slice(-3);
  const previous = snapshots.slice(-6, -3);

  if (previous.length === 0) return 0;

  const recentAvg =
    recent.reduce((sum, s) => sum + (s[field] as number), 0) / recent.length;
  const previousAvg =
    previous.reduce((sum, s) => sum + (s[field] as number), 0) / previous.length;

  if (previousAvg === 0) return 0;

  return ((recentAvg - previousAvg) / previousAvg) * 100;
}

function InsightItem({ snapshots }: { snapshots: MonthlySnapshot[] }) {
  const latest = snapshots[snapshots.length - 1];
  const previous = snapshots[snapshots.length - 2];

  const expenseChange = latest.totalExpenses - previous.totalExpenses;
  const savingsChange = latest.totalSavings - previous.totalSavings;

  return (
    <>
      {expenseChange > 0 ? (
        <p>
          • Your expenses increased by KES {expenseChange.toLocaleString()} last month
        </p>
      ) : expenseChange < 0 ? (
        <p>
          • Great job! You saved KES {Math.abs(expenseChange).toLocaleString()} in expenses
          last month
        </p>
      ) : null}

      {savingsChange > 0 ? (
        <p>
          • Your savings increased by KES {savingsChange.toLocaleString()} - keep it up!
        </p>
      ) : savingsChange < 0 ? (
        <p>
          • Consider increasing your monthly savings to stay on track with your goals
        </p>
      ) : null}

      {latest.netWorth > previous.netWorth && (
        <p>
          • Your net worth grew by KES{' '}
          {(latest.netWorth - previous.netWorth).toLocaleString()} this month
        </p>
      )}
    </>
  );
}