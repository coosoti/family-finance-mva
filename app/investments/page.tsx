'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { db } from '@/lib/db';
import { Investment, UserProfile } from '@/lib/types';
import AddInvestmentModal from '@/lib/AddInvestmentModal';

export default function InvestmentsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    setIsLoading(true);
    try {
      const userProfile = await db.getUserProfile();
      if (!userProfile) {
        router.push('/setup');
        return;
      }
      setProfile(userProfile);

      const allInvestments = await db.getAllInvestments();
      setInvestments(allInvestments);
    } catch (error) {
      console.error('Error loading investments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (investment: Investment) => {
    setSelectedInvestment(investment);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this investment?')) return;

    try {
      await db.deleteInvestment(id);
      loadInvestments();
    } catch (error) {
      console.error('Error deleting investment:', error);
      alert('Failed to delete investment');
    }
  };

  const handleInvestmentSaved = () => {
    setSelectedInvestment(null);
    loadInvestments();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Calculate portfolio metrics
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.units * inv.purchasePrice), 0);
  const currentValue = investments.reduce((sum, inv) => sum + (inv.units * inv.currentPrice), 0);
  const totalGain = currentValue - totalInvested;
  const gainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <button onClick={() => router.push('/dashboard')} className="mb-4 flex items-center gap-2">
          <ArrowLeft size={20} />
          <span>Dashboard</span>
        </button>

        <h1 className="mb-1 text-2xl font-bold">Investments</h1>
        <p className="text-indigo-100">Track your portfolio performance</p>
      </div>

      {/* Content */}
      <div className="space-y-6 p-6">
        {/* Portfolio Summary */}
        <div className="card bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <p className="mb-1 text-sm opacity-90">Portfolio Value</p>
          <p className="mb-4 text-4xl font-bold">KES {currentValue.toLocaleString()}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="opacity-90">Invested</p>
              <p className="text-lg font-semibold">KES {totalInvested.toLocaleString()}</p>
            </div>
            <div>
              <p className="opacity-90">Gain/Loss</p>
              <p className={`text-lg font-semibold flex items-center gap-1 ${totalGain >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {totalGain >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {totalGain >= 0 ? '+' : ''}KES {totalGain.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between border-t border-white border-opacity-20 pt-4">
            <span>Total Return</span>
            <span className={`text-xl font-bold ${gainPercentage >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {gainPercentage >= 0 ? '+' : ''}{gainPercentage.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Add Investment Button */}
        <button
          onClick={() => {
            setSelectedInvestment(null);
            setShowAddModal(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 p-4 font-semibold text-white hover:bg-indigo-700"
        >
          <Plus size={20} />
          Add Investment
        </button>

        {/* Investments List */}
        {investments.length > 0 ? (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Holdings</h2>
            <div className="space-y-3">
              {investments.map(investment => {
                const invested = investment.units * investment.purchasePrice;
                const current = investment.units * investment.currentPrice;
                const gain = current - invested;
                const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

                return (
                  <InvestmentCard
                    key={investment.id}
                    investment={investment}
                    invested={invested}
                    current={current}
                    gain={gain}
                    gainPercentage={gainPct}
                    onEdit={() => handleEdit(investment)}
                    onDelete={() => handleDelete(investment.id)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
              <DollarSign size={32} className="text-indigo-600" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">No investments yet</h3>
            <p className="mb-4 text-sm text-gray-600">
              Start tracking your investments to see your portfolio grow
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AddInvestmentModal
        isOpen={showAddModal}
        investment={selectedInvestment}
        onClose={() => {
          setShowAddModal(false);
          setSelectedInvestment(null);
        }}
        onSuccess={handleInvestmentSaved}
      />
    </div>
  );
}

function InvestmentCard({
  investment,
  invested,
  current,
  gain,
  gainPercentage,
  onEdit,
  onDelete,
}: {
  investment: Investment;
  invested: number;
  current: number;
  gain: number;
  gainPercentage: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeLabels: Record<string, string> = {
    'money-market': 'Money Market',
    'unit-trust': 'Unit Trust',
    'government-bond': 'Government Bond',
    'stock': 'Stock',
    'sacco': 'SACCO',
    'reit': 'REIT',
    'other': 'Other',
  };

  return (
    <div className="card">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{investment.name}</h3>
          <p className="text-xs text-gray-500">{typeLabels[investment.type]}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Units</p>
          <p className="font-semibold">{investment.units.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-600">Current Price</p>
          <p className="font-semibold">KES {investment.currentPrice.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-3 text-sm">
        <div>
          <p className="text-gray-600">Invested</p>
          <p className="font-semibold text-gray-900">KES {invested.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-600">Current Value</p>
          <p className="font-semibold text-gray-900">KES {current.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 p-3">
        <span className="text-sm font-medium text-gray-700">Gain/Loss</span>
        <div className="text-right">
          <p className={`font-bold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {gain >= 0 ? '+' : ''}KES {Math.abs(gain).toLocaleString()}
          </p>
          <p className={`text-sm ${gainPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {gainPercentage >= 0 ? '+' : ''}{gainPercentage.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}