'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, TrendingUp, Target, Coins } from 'lucide-react';
import { db } from '@/lib/db';
import { SavingsGoal, IPPAccount, UserProfile } from '@/lib/types';
import { getIPPSummary } from '@/lib/calculations';
import AddSavingsContributionModal from '@/components/AddSavingsContributionModal';
import AddIPPContributionModal from '@/components/AddIPPContributionModal';
import AddSavingsGoalModal from '@/components/AddSavingsGoalModal';

export default function SavingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [ippAccount, setIppAccount] = useState<IPPAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showIPPModal, setShowIPPModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  useEffect(() => {
    loadSavingsData();
  }, []);

  const loadSavingsData = async () => {
    setIsLoading(true);
    try {
      const userProfile = await db.getUserProfile();
      if (!userProfile) {
        router.push('/setup');
        return;
      }
      setProfile(userProfile);

      const [goals, ipp] = await Promise.all([
        db.getAllSavingsGoals(),
        db.getIPPAccount(),
      ]);

      setSavingsGoals(goals);
      setIppAccount(ipp || null);
    } catch (error) {
      console.error('Error loading savings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContributionAdded = () => {
    loadSavingsData();
  };

  const handleGoalAdded = () => {
    loadSavingsData();
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setShowAddGoalModal(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Delete this savings goal?')) return;

    try {
      await db.deleteSavingsGoal(goalId);
      loadSavingsData();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSavingsCurrent = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalSavingsTarget > 0 ? (totalSavingsCurrent / totalSavingsTarget) * 100 : 0;

  const taxRelief = ippAccount ? ippAccount.monthlyContribution * ippAccount.taxReliefRate : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
        <button onClick={() => router.push('/dashboard')} className="mb-4 flex items-center gap-2">
          <ArrowLeft size={20} />
          <span>Dashboard</span>
        </button>

        <h1 className="mb-1 text-2xl font-bold">Savings & Pension</h1>
        <p className="text-green-100">Track your wealth building progress</p>
      </div>

      {/* Content */}
      <div className="space-y-6 p-6">
        {/* Total Savings Summary */}
        <div className="card bg-gradient-to-r from-green-600 to-green-700 text-white">
          <p className="mb-1 text-sm opacity-90">Total Saved</p>
          <p className="mb-4 text-4xl font-bold">KES {totalSavingsCurrent.toLocaleString()}</p>
          <div className="flex items-center justify-between text-sm">
            <span>{overallProgress.toFixed(0)}% of target</span>
            <span>Target: KES {totalSavingsTarget.toLocaleString()}</span>
          </div>
        </div>

        {/* Savings Goals Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Savings Goals</h2>
            <button
              onClick={() => {
                setSelectedGoal(null);
                setShowAddGoalModal(true);
              }}
              className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              <Plus size={16} />
              Add Goal
            </button>
          </div>

          {savingsGoals.length > 0 ? (
            <div className="space-y-3">
              {savingsGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => handleEditGoal(goal)}
                  onDelete={() => handleDeleteGoal(goal.id)}
                  onAddContribution={() => {
                    setSelectedGoal(goal);
                    setShowSavingsModal(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Target size={32} className="text-green-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">No savings goals yet</h3>
              <p className="mb-4 text-sm text-gray-600">
                Create a goal to start tracking your savings progress
              </p>
              <button
                onClick={() => {
                  setSelectedGoal(null);
                  setShowAddGoalModal(true);
                }}
                className="mx-auto rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700"
              >
                Add Your First Goal
              </button>
            </div>
          )}
        </div>

        {/* IPP Section */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Pension (IPP)</h2>

          {ippAccount ? (
            <div className="card">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="text-3xl font-bold text-gray-900">
                    KES {ippAccount.currentBalance.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Monthly Contribution</p>
                  <p className="text-xl font-semibold text-blue-600">
                    KES {ippAccount.monthlyContribution.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Contributions</span>
                  <span className="font-medium text-gray-900">
                    KES {ippAccount.totalContributions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Realized Growth</span>
                  <span className="font-medium text-green-600">
                    KES {ippAccount.realizedValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax Relief (30%)</span>
                  <span className="font-medium text-green-600">
                    KES {taxRelief.toLocaleString()} /month
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowIPPModal(true)}
                className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Log Contribution
              </button>
            </div>
          ) : (
            <div className="card text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Coins size={32} className="text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">No IPP Account</h3>
              <p className="text-sm text-gray-600">
                IPP account will be created during setup
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-gray-200 bg-white p-2">
        <div className="flex justify-around">
          <NavButton
            icon={<span className="text-lg">🏠</span>}
            label="Dashboard"
            onClick={() => router.push('/dashboard')}
          />
          <NavButton
            icon={<span className="text-lg">💰</span>}
            label="Budget"
            onClick={() => router.push('/budget')}
          />
          <NavButton icon={<span className="text-lg">🐷</span>} label="Savings" active />
          <NavButton
            icon={<span className="text-lg">📊</span>}
            label="Net Worth"
            onClick={() => alert('Coming in Feature 7!')}
          />
        </div>
      </div>

      {/* Modals */}
      <AddSavingsContributionModal
        isOpen={showSavingsModal}
        goal={selectedGoal}
        onClose={() => {
          setShowSavingsModal(false);
          setSelectedGoal(null);
        }}
        onSuccess={handleContributionAdded}
      />

      <AddIPPContributionModal
        isOpen={showIPPModal}
        ippAccount={ippAccount}
        onClose={() => setShowIPPModal(false)}
        onSuccess={handleContributionAdded}
      />

      <AddSavingsGoalModal
        isOpen={showAddGoalModal}
        goal={selectedGoal}
        onClose={() => {
          setShowAddGoalModal(false);
          setSelectedGoal(null);
        }}
        onSuccess={handleGoalAdded}
      />
    </div>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onAddContribution,
}: {
  goal: SavingsGoal;
  onEdit: () => void;
  onDelete: () => void;
  onAddContribution: () => void;
}) {
  const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = goal.targetAmount - goal.currentAmount;
  const monthsToTarget = goal.monthlyContribution > 0 ? Math.ceil(remaining / goal.monthlyContribution) : 0;

  return (
    <div className="card">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{goal.name}</h3>
          <p className="text-sm text-gray-600">+KES {goal.monthlyContribution.toLocaleString()}/month</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-gray-600">KES {goal.currentAmount.toLocaleString()}</span>
          <span className="text-gray-600">KES {goal.targetAmount.toLocaleString()}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{percentage.toFixed(0)}% complete</p>
          {percentage < 100 && monthsToTarget > 0 && (
            <p className="text-xs text-gray-500">
              {monthsToTarget} {monthsToTarget === 1 ? 'month' : 'months'} to target
            </p>
          )}
        </div>
        <button
          onClick={onAddContribution}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          Add Contribution
        </button>
      </div>
    </div>
  );
}

function NavButton({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center px-4 py-2 ${active ? 'text-green-600' : 'text-gray-500'}`}
    >
      {icon}
      <span className="mt-1 text-xs">{label}</span>
    </button>
  );
}