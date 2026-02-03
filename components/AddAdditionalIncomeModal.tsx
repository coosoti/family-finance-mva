'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { db, generateId } from '@/lib/db';
import { AdditionalIncome } from '@/lib/types';
import { getCurrentMonth } from '@/lib/calculations';

interface AddAdditionalIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INCOME_SOURCES = [
  'Freelance Work',
  'Consulting',
  'Side Business',
  'Bonus',
  'Commission',
  'Rental Income',
  'Other',
];

export default function AddAdditionalIncomeModal({
  isOpen,
  onClose,
  onSuccess,
}: AddAdditionalIncomeModalProps) {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState(INCOME_SOURCES[0]);
  const [description, setDescription] = useState('');
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

    setIsSubmitting(true);

    try {
      const additionalIncome: AdditionalIncome = {
        id: generateId(),
        date: new Date(),
        amount: amountNum,
        source,
        description: description.trim() || undefined,
        month: getCurrentMonth(),
      };

      await db.saveAdditionalIncome(additionalIncome);

      // Reset form
      setAmount('');
      setSource(INCOME_SOURCES[0]);
      setDescription('');
      setError('');

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving additional income:', err);
      setError('Failed to save income');
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
          <h2 className="text-xl font-bold text-gray-900">Add Additional Income</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-green-50 p-3">
          <p className="text-sm text-green-800">
            💰 Track income from freelancing, side hustles, bonuses, and other sources
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Amount (KES)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="e.g. 15000"
              min="0"
              step="100"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="input"
            >
              {INCOME_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="e.g. Web design project for XYZ"
            />
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
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 bg-green-600 hover:bg-green-700">
              {isSubmitting ? 'Saving...' : 'Add Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}