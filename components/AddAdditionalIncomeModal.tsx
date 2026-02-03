'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db, generateId } from '@/lib/db';
import { AdditionalIncome } from '@/lib/types';
import { getCurrentMonth } from '@/lib/calculations';

interface AddAdditionalIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  income?: AdditionalIncome | null; // if provided, modal edits existing income
  onDelete?: (income: AdditionalIncome) => void;
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
  income,
}: AddAdditionalIncomeModalProps) {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState(INCOME_SOURCES[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && income) {
      setAmount(String(income.amount));
      setSource(income.source || INCOME_SOURCES[0]);
      setDescription(income.description || '');
    } else if (isOpen) {
      // reset when opening for new entry
      setAmount('');
      setSource(INCOME_SOURCES[0]);
      setDescription('');
    }
  }, [isOpen, income]);

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
        id: income?.id || generateId(),
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

    const handleDelete = async () => {
      if (!income) return;
      setIsSubmitting(true);
      try {
        const deletedIncome: AdditionalIncome = {
          ...income,
          deleted: true,
          // update timestamp
          date: new Date(),
        };

        await db.saveAdditionalIncome(deletedIncome);

        // Notify caller so it can show undo / trash UI
        onDelete?.(deletedIncome);
        onSuccess();
        onClose();
      } catch (err) {
        console.error('Error deleting income:', err);
        setError('Failed to delete income');
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
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">
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
              className="flex-1 rounded-lg border-2 border-gray-200 bg-white p-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            {income ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-red-600 p-3 font-semibold text-white hover:bg-red-700"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-yellow-600 p-3 font-semibold text-white hover:bg-yellow-700">
                {isSubmitting ? 'Saving...' : 'Add Income'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}