'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { db } from '@/lib/db';
import { SavingsGoal } from '@/lib/types';

interface AddSavingsContributionModalProps {
  isOpen: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSavingsContributionModal({
  isOpen,
  goal,
  onClose,
  onSuccess,
}: AddSavingsContributionModalProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!goal) {
      setError('No goal selected');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update goal with new contribution
      const updatedGoal: SavingsGoal = {
        ...goal,
        currentAmount: goal.currentAmount + amountNum,
      };

      await db.saveSavingsGoal(updatedGoal);

      // Reset form
      setAmount('');
      setError('');

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving contribution:', err);
      setError('Failed to save contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !goal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Contribution</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Goal Info */}
        <div className="mb-4 rounded-lg bg-green-50 p-3">
          <p className="text-sm font-medium text-green-900">{goal.name}</p>
          <p className="text-xs text-green-700">
            Current: KES {goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Contribution Amount (KES)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder={`e.g. ${goal.monthlyContribution}`}
              min="0"
              step="0.01"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              Suggested: KES {goal.monthlyContribution.toLocaleString()}
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-gray-300 bg-white p-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Saving...' : 'Add Contribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}