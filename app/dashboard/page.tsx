'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, DollarSign, PiggyBank, Wallet } from 'lucide-react';
import { db } from '@/lib/db';
import { UserProfile } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await db.getUserProfile();
      
      if (!userProfile) {
        // No profile found, redirect to setup
        router.push('/setup');
        return;
      }

      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!profile) {
    return null; // Will redirect to setup
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-600 p-6 text-white">
        <h1 className="mb-1 text-2xl font-bold">Welcome back, {profile.name}!</h1>
        <p className="text-blue-100">Here's your financial overview</p>
      </div>

      {/* Content */}
      <div className="space-y-6 p-6">
        {/* Net Worth Card */}
        <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <p className="mb-1 text-sm opacity-90">Current Net Worth</p>
          <p className="mb-4 text-4xl font-bold">KES 0</p>
          <div className="flex items-center text-sm">
            <TrendingUp size={16} className="mr-2" />
            <span>Start adding assets & liabilities</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Monthly Budget"
            value={`KES ${profile.monthlyIncome.toLocaleString()}`}
            subtitle="Ready to track"
          />
          <MetricCard
            title="Dependents"
            value={profile.dependents.toString()}
            subtitle={profile.dependents === 1 ? 'person' : 'people'}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="mb-3 font-semibold text-gray-800">Quick Actions</h3>
          <div className="space-y-2">
            <ActionCard
              icon={<DollarSign size={20} />}
              title="View Budget"
              subtitle="Track your spending"
              onClick={() => alert('Budget screen coming in Feature 5!')}
            />
            <ActionCard
              icon={<PiggyBank size={20} />}
              title="Savings & Pension"
              subtitle="Track contributions"
              onClick={() => alert('Savings screen coming in Feature 6!')}
            />
            <ActionCard
              icon={<Wallet size={20} />}
              title="Net Worth"
              subtitle="View assets & liabilities"
              onClick={() => alert('Net Worth screen coming in Feature 7!')}
            />
          </div>
        </div>

        {/* Success Message */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            <strong>🎉 Setup Complete!</strong> Your budget is ready. Start tracking your expenses 
            to see your progress.
          </p>
        </div>
      </div>

      {/* Bottom Navigation Placeholder */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-gray-200 bg-white p-2">
        <div className="flex justify-around">
          <NavButton icon={<DollarSign size={20} />} label="Dashboard" active />
          <NavButton icon={<PiggyBank size={20} />} label="Budget" />
          <NavButton icon={<TrendingUp size={20} />} label="Savings" />
          <NavButton icon={<Wallet size={20} />} label="Net Worth" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="card">
      <p className="mb-1 text-xs text-gray-600">{title}</p>
      <p className="mb-1 text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card flex w-full items-center justify-between transition-all hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          {icon}
        </div>
        <div className="text-left">
          <p className="font-medium text-gray-800">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function NavButton({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center px-4 py-2 ${active ? 'text-blue-600' : 'text-gray-500'}`}>
      {icon}
      <span className="mt-1 text-xs">{label}</span>
    </button>
  );
}