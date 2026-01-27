'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db, generateId } from '@/lib/db';
import { Asset } from '@/lib/types';

interface AddAssetModalProps {
  isOpen: boolean;
  type: 'asset' | 'liability';
  item: Asset | null; // If editing
  onClose: () => void;
  onSuccess: () => void;
}

const ASSET_CATEGORIES = [
  { value: 'cash', label: 'Cash' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'pension', label: 'Pension/IPP' },
  { value: 'investments', label: 'Investments' },
  { value: 'property', label: 'Property' },
  { value: 'other', label: 'Other' },
];

const LIABILITY_CATEGORIES = [
  { value: 'loan', label: 'Personal Loan' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'mobile-loan', label: 'Mobile Loan' },
  { value: 'other', label: 'Other' },
];

export default function AddAssetModal({
  isOpen,
  type,
  item,
  onClose,
  onSuccess,
}: AddAssetModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = type === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;

  useEffect(() => {
    if (item) {
      setName(item.name);
      setAmount(item.amount.toString());
      setCategory(item.category);
    } else {
      setName('');
      setAmount('');
      setCategory(categories[0].value);
    }
  }, [item, isOpen, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    setIsSubmitting(true);

    try {
      const asset: Asset = {
        id: item?.id || generateId(),
        name: name.trim(),
        amount: amountNum,
        type,
        category,
        lastUpdated: new Date(),
      };

      await db.saveAsset(asset);

      // Reset form
      setName('');
      setAmount('');
      setCategory(categories[0].value);
      setError('');

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving asset:', err);
      setError('Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isAsset = type === 'asset';
  const title = item
    ? `Edit ${isAsset ? 'Asset' : 'Liability'}`
    : `Add ${isAsset ? 'Asset' : 'Liability'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
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
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder={isAsset ? 'e.g. Emergency Fund' : 'e.g. Car Loan'}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Amount (KES)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="e.g. 50000"
              min="0"
              step="100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
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
            <button
              type="submit"
              disabled={isSubmitting}
              className={`btn-primary flex-1 ${isAsset ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isSubmitting ? 'Saving...' : item ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}