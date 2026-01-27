'use client';

import { useEffect, useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { BudgetCategory, Transaction } from '@/lib/types';
import { getCurrentMonth } from '@/lib/calculations';

interface CategoryDetailModalProps {
  isOpen: boolean;
  categoryId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function CategoryDetailModal({
  isOpen,
  categoryId,
  onClose,
  onUpdate,
}: CategoryDetailModalProps) {
  const [category, setCategory] = useState<BudgetCategory | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (isOpen && categoryId) {
      loadCategoryDetail();
    }
  }, [isOpen, categoryId]);

  const loadCategoryDetail = async () => {
    if (!categoryId) return;

    setIsLoading(true);
    try {
      const allCategories = await db.getBudgetCategories();
      const cat = allCategories.find(c => c.id === categoryId);

      if (!cat) {
        onClose();
        return;
      }

      setCategory(cat);

      const currentMonth = getCurrentMonth();
      const allTransactions = await db.getTransactionsByMonth(currentMonth);
      const categoryTransactions = allTransactions
        .filter(t => t.categoryId === categoryId && t.type === 'expense')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(categoryTransactions);

      const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      setTotalSpent(spent);
    } catch (error) {
      console.error('Error loading category detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Delete this transaction?')) return;

    try {
      await db.deleteTransaction(transactionId);
      await loadCategoryDetail();
      onUpdate(); // Refresh parent component
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  if (!isOpen || !category) return null;

  const percentage = category.budgetedAmount > 0 ? (totalSpent / category.budgetedAmount) * 100 : 0;
  const remaining = category.budgetedAmount - totalSpent;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="p-6">
            {/* Summary */}
            <div className="card mb-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Budget Status</p>
                <p className="text-3xl font-bold text-gray-900">
                  KES {totalSpent.toLocaleString()} / {category.budgetedAmount.toLocaleString()}
                </p>
              </div>

              <div className="mb-2 h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{percentage.toFixed(0)}% used</span>
                <span className={`font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {remaining >= 0 ? 'KES ' : '-KES '}
                  {Math.abs(remaining).toLocaleString()} {remaining >= 0 ? 'remaining' : 'over budget'}
                </span>
              </div>
            </div>

            {/* Transactions */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Transactions ({transactions.length})
              </h3>

              {transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.id} className="card">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">KES {tx.amount.toLocaleString()}</p>
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <span>
                              {new Date(tx.date).toLocaleDateString('en-KE', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            {tx.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate">{tx.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Plus size={32} className="text-gray-400" />
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-900">No expenses yet</h3>
                  <p className="text-sm text-gray-600">
                    Expenses for this category will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}