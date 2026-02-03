'use client';

import CategoryDetailModal from '@/components/CategoryDetailModal';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import { db } from '@/lib/db';
import { BudgetCategory, Transaction, UserProfile } from '@/lib/types';
import { getBudgetVsActual, getCurrentMonth, getDaysLeftInMonth } from '@/lib/calculations';
import QuickExpenseModal from '@/lib/QuickExpenseModal';
import BottomNav from '@/components/BottomNav';
import AddAdditionalIncomeModal from '@/components/AddAdditionalIncomeModal';
import type { AdditionalIncome } from '@/lib/types';



interface CategoryWithSpending extends BudgetCategory {
  spent: number;
  remaining: number;
  percentage: number;
}

export default function BudgetPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<CategoryWithSpending[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'needs' | 'wants' | 'savings' | 'growth'>('all');
  const [totalBudgeted, setTotalBudgeted] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [additionalIncome, setAdditionalIncome] = useState<AdditionalIncome[]>([]);
  const [showIncomeModal, setShowIncomeModal] = useState(false);

  useEffect(() => {
    loadBudget();
  }, []);

    const loadBudget = async () => {
      setIsLoading(true);
      try {
        const userProfile = await db.getUserProfile();
        if (!userProfile) {
          router.push('/setup');
          return;
        }
        setProfile(userProfile);
    
        const currentMonth = getCurrentMonth();
        const [allCategories, transactions, extraIncome] = await Promise.all([
          db.getBudgetCategories(),
          db.getTransactionsByMonth(currentMonth),
          db.getAdditionalIncomeByMonth(currentMonth),
        ]);
    
        // Calculate spending per category
        const categorySpending = new Map<string, number>();
        transactions
          .filter(t => t.type === 'expense')
          .forEach(tx => {
            const current = categorySpending.get(tx.categoryId) || 0;
            categorySpending.set(tx.categoryId, current + tx.amount);
          });
    
        // Enhance categories with spending data
        const enhancedCategories: CategoryWithSpending[] = allCategories.map(cat => {
          const spent = categorySpending.get(cat.id) || 0;
          const remaining = cat.budgetedAmount - spent;
          const percentage = cat.budgetedAmount > 0 ? (spent / cat.budgetedAmount) * 100 : 0;
    
          return {
            ...cat,
            spent,
            remaining,
            percentage,
          };
        });
    
        setCategories(enhancedCategories);
        setAdditionalIncome(extraIncome);
    
        // Calculate totals
        const budgeted = enhancedCategories.reduce((sum, c) => sum + c.budgetedAmount, 0);
        const spent = enhancedCategories.reduce((sum, c) => sum + c.spent, 0);
        setTotalBudgeted(budgeted);
        setTotalSpent(spent);
      } catch (error) {
        console.error('Error loading budget:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleExpenseAdded = () => {
      loadBudget();
  };

  const filteredCategories = selectedType === 'all'
    ? categories
    : categories.filter(c => c.type === selectedType);

  const groupedByType = {
    needs: categories.filter(c => c.type === 'needs'),
    wants: categories.filter(c => c.type === 'wants'),
    savings: categories.filter(c => c.type === 'savings'),
    growth: categories.filter(c => c.type === 'growth'),
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const daysLeft = getDaysLeftInMonth();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-600 p-6 text-white">
        <button onClick={() => router.push('/dashboard')} className="mb-4 flex items-center gap-2">
          <ArrowLeft size={20} />
          <span>Dashboard</span>
        </button>

        <h1 className="mb-1 text-2xl font-bold">Monthly Budget</h1>
        <p className="text-blue-100">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary Card */}
      <div className="p-6">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-3xl font-bold text-gray-900">
                KES {totalSpent.toLocaleString()} / {totalBudgeted.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar size={14} />
                <span>{daysLeft} days left</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2 h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all ${
                overallPercentage > 100
                  ? 'bg-red-500'
                  : overallPercentage > 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{overallPercentage.toFixed(1)}% used</span>
            <span className={`font-medium ${totalBudgeted - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalBudgeted - totalSpent >= 0 ? '' : '-'}KES {Math.abs(totalBudgeted - totalSpent).toLocaleString()} remaining
            </span>
          </div>
        </div>

        {/* Add Expense Button */}
        <button
          onClick={() => setShowExpenseModal(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 p-4 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Expense
        </button>

        {/* Additional Income Section */}
        {additionalIncome.length > 0 && (
          <div className="card bg-gradient-to-r from-green-50 to-green-100">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-green-900">Additional Income This Month</h3>
              <span className="text-lg font-bold text-green-700">
                +KES {additionalIncome.reduce((sum, inc) => sum + inc.amount, 0).toLocaleString()}
              </span>
            </div>
            <div className="space-y-2">
              {additionalIncome.map((inc) => (
                <div key={inc.id} className="flex items-center justify-between text-sm">
                  <span className="text-green-800">{inc.source}</span>
                  <span className="font-medium text-green-900">
                    +KES {inc.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Income Button */}
        <button
          onClick={() => setShowIncomeModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-green-600 bg-white p-3 font-semibold text-green-600 transition-colors hover:bg-green-50"
        >
          <Plus size={20} />
          Add Additional Income
        </button>
      </div>

      {/* Budget Breakdown */}
      {/* Needs */}
      <BudgetSection
          title="Needs (50%)"
          color="red"
          categories={groupedByType.needs}
          onCategoryClick={setSelectedCategoryId}
        />

        {/* Wants */}
        <BudgetSection
          title="Wants (30%)"
          color="yellow"
          categories={groupedByType.wants}
          onCategoryClick={setSelectedCategoryId}
        />

        {/* Savings */}
        <BudgetSection
          title="Savings (15%)"
          color="green"
          categories={groupedByType.savings}
          onCategoryClick={setSelectedCategoryId}
        />

        {/* Growth */}
        <BudgetSection
          title="Growth (5%)"
          color="blue"
          categories={groupedByType.growth}
          onCategoryClick={setSelectedCategoryId}
        />

      {/* Quick Expense Modal */}
      <QuickExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={handleExpenseAdded}
      />

      {/* Category Detail Modal */}
      <CategoryDetailModal
        isOpen={selectedCategoryId !== null}
        categoryId={selectedCategoryId}
        onClose={() => setSelectedCategoryId(null)}
        onUpdate={loadBudget}
      />
        {/* Additional Income Modal */}
      <AddAdditionalIncomeModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onSuccess={loadBudget}
      />
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

function BudgetSection({
    title,
    color,
    categories,
    onCategoryClick,
  }: {
    title: string;
    color: 'red' | 'yellow' | 'green' | 'blue';
    categories: CategoryWithSpending[];
    onCategoryClick: (categoryId: string) => void;
  }) {
    const colorMap = {
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
    };
  
    const totalBudgeted = categories.reduce((sum, c) => sum + c.budgetedAmount, 0);
    const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className="text-sm text-gray-600">
            KES {totalSpent.toLocaleString()} / {totalBudgeted.toLocaleString()}
          </span>
        </div>
  
        <div className="space-y-2">
          {categories.map(category => (
            <CategoryRow
              key={category.id}
              category={category}
              color={colorMap[color]}
              onCategoryClick={onCategoryClick}
            />
          ))}
        </div>
      </div>
    );
  }

function CategoryRow({
    category,
    color,
    onCategoryClick,
  }: {
    category: CategoryWithSpending;
    color: string;
    onCategoryClick: (categoryId: string) => void;
  }) {
    const isOverBudget = category.spent > category.budgetedAmount;
    const progressColor = isOverBudget
      ? 'bg-red-500'
      : category.percentage > 80
      ? 'bg-yellow-500'
      : 'bg-green-500';
  
    return (
      <button
        onClick={() => onCategoryClick(category.id)}
        className="card w-full text-left transition-all hover:shadow-md"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-1 rounded ${color}`}></div>
            <span className="font-medium text-gray-800">{category.name}</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {category.spent.toLocaleString()} / {category.budgetedAmount.toLocaleString()}
          </span>
        </div>
  
        <div className="mb-1 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all ${progressColor}`}
            style={{ width: `${Math.min(category.percentage, 100)}%` }}
          ></div>
        </div>
  
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">{category.percentage.toFixed(0)}% used</span>
          <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-gray-600'}>
            {isOverBudget ? (
              <>
                <TrendingUp size={12} className="inline" /> Over by {Math.abs(category.remaining).toLocaleString()}
              </>
            ) : (
              <>
                <TrendingDown size={12} className="inline" /> {category.remaining.toLocaleString()} left
              </>
            )}
          </span>
        </div>
      </button>
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
      className={`flex flex-col items-center px-4 py-2 ${active ? 'text-blue-600' : 'text-gray-500'}`}
    >
      {icon}
      <span className="mt-1 text-xs">{label}</span>
    </button>
  );
}