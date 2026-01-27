'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db, generateId } from '@/lib/db';
import { SavingsGoal } from '@/lib/types';

interface AddSavingsGoalModalProps {
  isOpen: boolean;
  goal: SavingsGoal | null; // If editing
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSavingsGoalModal({
  isOpen,
  goal,
  onClose,
  onSuccess,
}: AddSavingsGoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (goal) {
      // Editing existing goal
      setName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
      setMonthlyContribution(goal.monthlyContribution.toString());
    } else {
      // Creating new goal
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setMonthlyContribution('');
    }
  }, [goal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a goal name');
      return;
    }

    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount || '0');
    const monthly = parseFloat(monthlyContribution);

    if (!target || target <= 0) {
      setError('Please enter a valid target amount');
      return;
    }

    if (current < 0) {
      setError('Current amount cannot be negative');
      return;
    }

    if (!monthly || monthly <= 0) {
      setError('Please enter a valid monthly contribution');
      return;
    }

    setIsSubmitting(true);

    try {
      const savingsGoal: SavingsGoal = {
        id: goal?.id || generateId(),
        name: name.trim(),
        targetAmount: target,
        currentAmount: current,
        monthlyContribution: monthly,
        createdAt: goal?.createdAt || new Date(),
      };

      await db.saveSavingsGoal(savingsGoal);

      // Reset form
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setMonthlyContribution('');
      setError('');

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving goal:', err);
      setError('Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {goal ? 'Edit Goal' : 'New Savings Goal'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Goal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g. Emergency Fund, Vacation, New Car"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Target Amount (KES)
            </label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="input"
              placeholder="e.g. 100000"
              min="0"
              step="100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Current Amount (KES)
            </label>
            <input
              type="number"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="input"
              placeholder="0"
              min="0"
              step="100"
            />
            <p className="mt-1 text-xs text-gray-500">
              How much have you already saved?
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Monthly Contribution (KES)
            </label>
            <input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              className="input"
              placeholder="e.g. 5000"
              min="0"
              step="100"
            />
            <p className="mt-1 text-xs text-gray-500">
              How much will you save each month?
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
              {isSubmitting ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}