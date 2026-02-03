'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db, generateId } from '@/lib/db';
import { Investment } from '@/lib/types';

interface AddInvestmentModalProps {
  isOpen: boolean;
  investment: Investment | null;
  onClose: () => void;
  onSuccess: () => void;
}

const INVESTMENT_TYPES = [
  { value: 'money-market', label: 'Money Market Fund' },
  { value: 'unit-trust', label: 'Unit Trust' },
  { value: 'government-bond', label: 'Government Bond (M-Akiba, T-Bills)' },
  { value: 'stock', label: 'Stock (NSE)' },
  { value: 'sacco', label: 'SACCO' },
  { value: 'reit', label: 'REIT' },
  { value: 'other', label: 'Other' },
];

export default function AddInvestmentModal({
  isOpen,
  investment,
  onClose,
  onSuccess,
}: AddInvestmentModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('money-market');
  const [units, setUnits] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (investment) {
      setName(investment.name);
      setType(investment.type);
      setUnits(investment.units.toString());
      setPurchasePrice(investment.purchasePrice.toString());
      setCurrentPrice(investment.currentPrice.toString());
      setNotes(investment.notes || '');
    } else {
      setName('');
      setType('money-market');
      setUnits('');
      setPurchasePrice('');
      setCurrentPrice('');
      setNotes('');
    }
  }, [investment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Investment name is required');
      return;
    }

    const unitsNum = parseFloat(units);
    const purchasePriceNum = parseFloat(purchasePrice);
    const currentPriceNum = parseFloat(currentPrice);

    if (!unitsNum || unitsNum <= 0) {
      setError('Valid number of units is required');
      return;
    }

    if (!purchasePriceNum || purchasePriceNum <= 0) {
      setError('Valid purchase price is required');
      return;
    }

    if (!currentPriceNum || currentPriceNum <= 0) {
      setError('Valid current price is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const investmentData: Investment = {
        id: investment?.id || generateId(),
        name: name.trim(),
        type: type as Investment['type'],
        units: unitsNum,
        purchasePrice: purchasePriceNum,
        currentPrice: currentPriceNum,
        purchaseDate: investment?.purchaseDate || new Date(),
        lastUpdated: new Date(),
        notes: notes.trim() || undefined,
      };

      await db.saveInvestment(investmentData);

      // Reset form
      setName('');
      setType('money-market');
      setUnits('');
      setPurchasePrice('');
      setCurrentPrice('');
      setNotes('');
      setError('');

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving investment:', err);
      setError('Failed to save investment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const unitsNum = parseFloat(units) || 0;
  const purchasePriceNum = parseFloat(purchasePrice) || 0;
  const currentPriceNum = parseFloat(currentPrice) || 0;
  
  const invested = unitsNum * purchasePriceNum;
  const currentValue = unitsNum * currentPriceNum;
  const gain = currentValue - invested;
  const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {investment ? 'Edit Investment' : 'Add Investment'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Investment Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g. Sanlam Money Market Fund"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input"
            >
              {INVESTMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Number of Units/Shares
            </label>
            <input
              type="number"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="input"
              placeholder="e.g. 1000"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Purchase Price per Unit (KES)
            </label>
            <input
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="input"
              placeholder="e.g. 100"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Current Price per Unit (KES)
            </label>
            <input
              type="number"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              className="input"
              placeholder="e.g. 120"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          {/* Preview */}
          {invested > 0 && (
            <div className="rounded-lg bg-indigo-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-indigo-900">Preview</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-indigo-700">Invested:</span>
                  <span className="font-medium text-indigo-900">KES {invested.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-700">Current Value:</span>
                  <span className="font-medium text-indigo-900">KES {currentValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-indigo-200 pt-1">
                  <span className="text-indigo-700">Gain/Loss:</span>
                  <span className={`font-bold ${gain >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {gain >= 0 ? '+' : ''}KES {gain.toLocaleString()} ({gainPct.toFixed(2)}%)
                  </span>
                </div>
              </div>
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
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? 'Saving...' : investment ? 'Update' : 'Add Investment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}