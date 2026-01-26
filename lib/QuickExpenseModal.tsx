'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db, generateId } from '@/lib/db';
import { BudgetCategory, Transaction } from '@/lib/types';
import { getCurrentMonth } from '@/lib/calculations';

interface QuickExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickExpenseModal({ isOpen, onClose, onSuccess }: QuickExpenseModalProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const allCategories = await db.getBudgetCategories();
      // Filter to only needs and wants (expense categories)
      const expenseCategories = allCategories.filter(
        c => c.type === 'needs' || c.type === 'wants'
      );
      setCategories(expenseCategories);
      
      if (expenseCategories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(expenseCategories[0].id);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!selectedCategoryId) {
      setError('Please select a category');
      return;
    }

    setIsSubmitting(true);

    try {
      const transaction: Transaction = {
        id: generateId(),
        date: new Date(),
        categoryId: selectedCategoryId,
        amount: amountNum,
        type: 'expense',
        notes: notes.trim() || undefined,
        month: getCurrentMonth(),
      };

      await db.saveTransaction(transaction);
      
      // Reset form
      setAmount('');
      setNotes('');
      setError('');
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving expense:', err);
      setError('Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Expense</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Amount (KES)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="e.g. 2500"
              min="0"
              step="0.01"
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="input"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              placeholder="e.g. Groceries at Naivas"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-gray-300 bg-white p-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}