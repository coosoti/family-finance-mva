'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, DollarSign, PiggyBank, Wallet, Plus, Calendar, Download, Settings } from 'lucide-react';
import { db } from '@/lib/db';
import { UserProfile, Transaction, BudgetCategory } from '@/lib/types';
import {
  calculateNetWorth,
  getBudgetVsActual,
  getDaysLeftInMonth,
  getSavingsProgress,
  getRecentTransactions,
  createMonthlySnapshot,
  getCurrentMonth,
} from '@/lib/calculations';
import QuickExpenseModal from '@/lib/QuickExpenseModal';
import BottomNav from '@/components/BottomNav';

interface DashboardMetrics {
  netWorth: number;
  budgetUsed: number;
  budgetTotal: number;
  budgetRemaining: number;
  savingsProgress: number;
  daysLeft: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const userProfile = await db.getUserProfile();

      if (!userProfile) {
        router.push('/setup');
        return;
      }

      setProfile(userProfile);

      // Load all metrics
      const [netWorth, budgetData, savingsData, transactions, allCategories] = await Promise.all([
        calculateNetWorth(),
        getBudgetVsActual(),
        getSavingsProgress(),
        getRecentTransactions(5),
        db.getBudgetCategories(),
      ]);

      setMetrics({
        netWorth,
        budgetUsed: budgetData.totalSpent,
        budgetTotal: budgetData.totalBudgeted,
        budgetRemaining: budgetData.remaining,
        savingsProgress: savingsData.percentageComplete,
        daysLeft: getDaysLeftInMonth(),
      });

      setRecentTransactions(transactions);
      setCategories(allCategories);

      // Check if we need to create this month's snapshot
      const currentMonth = getCurrentMonth();
      const existingSnapshot = await db.getMonthlySnapshot(currentMonth);
      if (!existingSnapshot && budgetData.totalSpent > 0) {
        await createMonthlySnapshot(currentMonth);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpenseAdded = () => {
    loadDashboard(); // Refresh dashboard data
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!profile || !metrics) {
    return null;
  }

  const budgetPercentage = (metrics.budgetUsed / metrics.budgetTotal) * 100;
  const budgetColor = budgetPercentage > 100 ? 'red' : budgetPercentage > 80 ? 'yellow' : 'green';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="relative bg-blue-600 p-6 text-white">
        <h1 className="mb-1 text-2xl font-bold">Welcome back, {profile.name}!</h1>
        <p className="text-blue-100">Here's your financial overview</p>
        
        {/* Settings Button */}
        <button
          onClick={() => router.push('/settings')}
          className="absolute right-4 top-4 rounded-full bg-white bg-opacity-20 p-2 hover:bg-opacity-30 transition-all"
          aria-label="Settings"
        >
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6 p-6">
        {/* Net Worth Card */}
        <button
          type="button"
          onClick={() => router.push('/networth')}
          className="card w-full bg-gradient-to-r from-blue-600 to-blue-700 text-left text-white transition-shadow hover:shadow-md"
        >
          <p className="mb-1 text-sm opacity-90">Current Net Worth</p>
          <p className="mb-4 text-4xl font-bold">
            KES {metrics.netWorth.toLocaleString()}
          </p>
          <div className="flex items-center text-sm">
            <TrendingUp size={16} className="mr-2" />
            <span>
              {metrics.netWorth > 0 ? 'Building wealth' : 'Start adding assets'}
            </span>
          </div>
        </button>

        {/* Budget Overview */}
        <button
          type="button"
          onClick={() => router.push('/budget')}
          className="card w-full text-left transition-shadow hover:shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">This Month's Budget</h3>
              <p className="text-2xl font-bold text-gray-900">
                KES {metrics.budgetUsed.toLocaleString()} / {metrics.budgetTotal.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                <Calendar size={12} className="inline" /> {metrics.daysLeft} days left
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2 h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all ${
                budgetColor === 'red'
                  ? 'bg-red-500'
                  : budgetColor === 'yellow'
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{budgetPercentage.toFixed(0)}% used</span>
            <span className={`font-medium ${metrics.budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.budgetRemaining >= 0 ? 'KES ' : '-KES '}
              {Math.abs(metrics.budgetRemaining).toLocaleString()} remaining
            </span>
          </div>
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="card flex flex-col items-center justify-center py-6 transition-all hover:shadow-md"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Plus size={24} className="text-blue-600" />
            </div>
            <span className="font-medium text-gray-900">Add Expense</span>
          </button>

          <button
            onClick={() => router.push('/budget')}
            className="card flex flex-col items-center justify-center py-6 transition-all hover:shadow-md"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <span className="font-medium text-gray-900">View Budget</span>
          </button>

          <button
            onClick={() => router.push('/backup')}
            className="card flex w-full items-center justify-between transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Download size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">Backup Data</p>
                <p className="text-xs text-gray-500">Export & restore</p>
              </div>
            </div>
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={<PiggyBank size={20} />}
            title="Savings Goal"
            value={`${metrics.savingsProgress.toFixed(0)}%`}
            subtitle="On track"
            color="green"
            onClick={() => router.push('/savings')}
          />
          <StatCard
            icon={<Wallet size={20} />}
            title="Monthly Income"
            value={`KES ${profile.monthlyIncome.toLocaleString()}`}
            subtitle="Net income"
            color="blue"
            onClick={() => router.push('/budget')}
          />
        </div>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div className="card">
            <h3 className="mb-4 font-semibold text-gray-900">Recent Activity</h3>
            <div className="space-y-3">
              {recentTransactions.map((tx) => {
                const category = categories.find((c) => c.id === tx.categoryId);
                return (
                  <div key={tx.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-gray-900">{category?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.date).toLocaleDateString('en-KE', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {tx.notes && ` • ${tx.notes}`}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900">
                      -KES {tx.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {recentTransactions.length === 0 && (
          <div className="card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <DollarSign size={32} className="text-gray-400" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">No transactions yet</h3>
            <p className="mb-4 text-sm text-gray-600">
              Start tracking your expenses by clicking "Add Expense" above
            </p>
            <button
              type="button"
              onClick={() => setShowExpenseModal(true)}
              className="mx-auto rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Add Expense
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Quick Expense Modal */}
      <QuickExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={handleExpenseAdded}
      />
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: 'green' | 'blue';
  onClick?: () => void;
}) {
  const colorClass = color === 'green' ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100';

  const clickable = !!onClick;

  const content = (
    <>
      <div className={`mb-2 inline-flex rounded-full p-2 ${colorClass}`}>{icon}</div>
      <p className="mb-1 text-xs text-gray-600">{title}</p>
      <p className="mb-1 text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </>
  );

  if (!clickable) {
    return <div className="card">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="card w-full text-left transition-shadow hover:shadow-md"
    >
      {content}
    </button>
  );
}