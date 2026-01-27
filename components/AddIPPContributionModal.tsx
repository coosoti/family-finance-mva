'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { db } from '@/lib/db';
import { IPPAccount } from '@/lib/types';

interface AddIPPContributionModalProps {
  isOpen: boolean;
  ippAccount: IPPAccount | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddIPPContributionModal({
  isOpen,
  ippAccount,
  onClose,
  onSuccess,
}: AddIPPContributionModalProps) {
  const [amount, setAmount] = useState('');
  const [realizedGrowth, setRealizedGrowth] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid contribution amount');
      return;
    }

    const growthNum = realizedGrowth ? parseFloat(realizedGrowth) : 0;
    if (realizedGrowth && growthNum < 0) {
      setError('Growth cannot be negative');
      return;
    }

    if (!ippAccount) {
      setError('No IPP account found');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update IPP account
      const updatedIPP: IPPAccount = {
        ...ippAccount,
        currentBalance: ippAccount.currentBalance + amountNum + growthNum,
        totalContributions: ippAccount.totalContributions + amountNum,
        realizedValue: ippAccount.realizedValue + growthNum,
        lastUpdated: new Date(),
      };

      await db.saveIPPAccount(updatedIPP);

      // Reset form
      setAmount('');
      setRealizedGrowth('');
      setError('');

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving IPP contribution:', err);
      setError('Failed to save contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !ippAccount) return null;

  const taxRelief = parseFloat(amount || '0') * ippAccount.taxReliefRate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Log IPP Contribution</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* IPP Info */}
        <div className="mb-4 rounded-lg bg-blue-50 p-3">
          <p className="text-sm font-medium text-blue-900">Current Balance</p>
          <p className="text-xl font-bold text-blue-900">
            KES {ippAccount.currentBalance.toLocaleString()}
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
              placeholder={`e.g. ${ippAccount.monthlyContribution}`}
              min="0"
              step="0.01"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              Suggested: KES {ippAccount.monthlyContribution.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Realized Growth (Optional)
            </label>
            <input
              type="number"
              value={realizedGrowth}
              onChange={(e) => setRealizedGrowth(e.target.value)}
              className="input"
              placeholder="e.g. 500"
              min="0"
              step="0.01"
            />
            <p className="mt-1 text-xs text-gray-500">
              Actual investment returns you've received
            </p>
          </div>

          {amount && (
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-sm font-medium text-green-900">Tax Relief (30%)</p>
              <p className="text-lg font-bold text-green-900">
                KES {taxRelief.toLocaleString()}
              </p>
              <p className="text-xs text-green-700">
                You'll save this on your taxes
              </p>
            </div>
          )}

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
              {isSubmitting ? 'Saving...' : 'Log Contribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}