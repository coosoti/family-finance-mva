'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  TrendingUp,
  PiggyBank,
  Wallet,
  DollarSign,
  ArrowRight,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { dbService } from '@/lib/supabase/db-service';
import { UserProfile } from '@/lib/types';
import { getBudgetVsActual, calculateNetWorth } from '@/lib/calculations';
import { updateCurrentMonthSnapshot } from '@/lib/snapshot-utils';
import BottomNav from '@/components/BottomNav';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRealtimeSync } from '@/lib/hooks/useRealtimeSync';

function DashboardContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [netWorth, setNetWorth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time sync for transactions
  useRealtimeSync('transactions', () => {
    loadDashboard();
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const userProfile = await dbService.getUserProfile();
      if (!userProfile) {
        router.push('/setup');
        return;
      }
      setProfile(userProfile);

      const [summary, worth] = await Promise.all([
        getBudgetVsActual(),
        calculateNetWorth(),
      ]);

      setBudgetSummary(summary);
      setNetWorth(worth);

      // Update current month snapshot in background
      updateCurrentMonthSnapshot().catch(console.error);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hello, {profile?.name}!</h1>
            <p className="text-blue-100">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/settings')}
              className="rounded-full bg-white bg-opacity-20 p-2 hover:bg-opacity-30"
            >
              <Settings size={24} />
            </button>
            <button
              onClick={handleSignOut}
              className="rounded-full bg-white bg-opacity-20 p-2 hover:bg-opacity-30"
              title="Sign Out"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>

        {/* Net Worth Card */}
        <div className="rounded-xl bg-white bg-opacity-10 p-4 backdrop-blur">
          <p className="mb-1 text-sm text-blue-100">Total Net Worth</p>
          <p className="text-3xl font-bold">
            {netWorth >= 0 ? '' : '-'}KES {Math.abs(netWorth).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-blue-100">Synced • {user?.email}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6">
        {/* Analytics Quick Access */}
        <button
          onClick={() => router.push('/analytics')}
          className="mb-6 flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white shadow-lg transition-transform hover:scale-[1.02]"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white bg-opacity-20 p-2">
              <BarChart3 size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold">View Analytics</p>
              <p className="text-sm text-purple-100">Charts & spending insights</p>
            </div>
          </div>
          <ArrowRight size={20} />
        </button>

        {/* Existing Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <QuickActionCard
            title="Budget"
            subtitle={`${budgetSummary?.percentageUsed.toFixed(0)}% used`}
            icon={<PiggyBank size={24} />}
            color="blue"
            onClick={() => router.push('/budget')}
          />
          <QuickActionCard
            title="Savings"
            subtitle="Goals & IPP"
            icon={<TrendingUp size={24} />}
            color="green"
            onClick={() => router.push('/savings')}
          />
          <QuickActionCard
            title="Net Worth"
            subtitle="Assets & Debts"
            icon={<Wallet size={24} />}
            color="purple"
            onClick={() => router.push('/networth')}
          />
          <QuickActionCard
            title="More"
            subtitle="Settings & Backup"
            icon={<DollarSign size={24} />}
            color="gray"
            onClick={() => router.push('/settings')}
          />
        </div>

        {/* Budget Overview */}
        {budgetSummary && (
          <div className="card mt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              This Month's Budget
            </h2>
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">
                  KES {budgetSummary.totalSpent.toLocaleString()}
                </span>
                <span className="text-gray-600">
                  KES {budgetSummary.totalBudgeted.toLocaleString()}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    budgetSummary.percentageUsed > 100
                      ? 'bg-red-500'
                      : budgetSummary.percentageUsed > 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min(budgetSummary.percentageUsed, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {budgetSummary.percentageUsed.toFixed(0)}% used
              </span>
              <span
                className={`font-medium ${
                  budgetSummary.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                KES {Math.abs(budgetSummary.remaining).toLocaleString()}{' '}
                {budgetSummary.remaining >= 0 ? 'left' : 'over'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

function QuickActionCard({
  title,
  subtitle,
  icon,
  color,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    gray: 'from-gray-500 to-gray-600',
  };

  return (
    <button
      onClick={onClick}
      className={`card bg-gradient-to-br ${colorMap[color]} text-white transition-transform hover:scale-105`}
    >
      <div className="mb-2">{icon}</div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-xs opacity-90">{subtitle}</p>
    </button>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}