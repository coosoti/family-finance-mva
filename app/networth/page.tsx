'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { db } from '@/lib/db';
import { Asset, UserProfile } from '@/lib/types';
import { calculateNetWorth } from '@/lib/calculations';
import AddAssetModal from '@/components/AddAssetModal';
import BottomNav from '@/components/BottomNav';

export default function NetWorthPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Asset[]>([]);
  const [netWorth, setNetWorth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'asset' | 'liability'>('asset');
  const [selectedItem, setSelectedItem] = useState<Asset | null>(null);

  useEffect(() => {
    loadNetWorthData();
  }, []);

  const loadNetWorthData = async () => {
    setIsLoading(true);
    try {
      const userProfile = await db.getUserProfile();
      if (!userProfile) {
        router.push('/setup');
        return;
      }
      setProfile(userProfile);

      const [allAssets, calculatedNetWorth] = await Promise.all([
        db.getAllAssets(),
        calculateNetWorth(),
      ]);

      const assetsList = allAssets.filter(a => a.type === 'asset');
      const liabilitiesList = allAssets.filter(a => a.type === 'liability');

      setAssets(assetsList);
      setLiabilities(liabilitiesList);
      setNetWorth(calculatedNetWorth);
    } catch (error) {
      console.error('Error loading net worth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAsset = () => {
    setSelectedItem(null);
    setModalType('asset');
    setShowAddModal(true);
  };

  const handleAddLiability = () => {
    setSelectedItem(null);
    setModalType('liability');
    setShowAddModal(true);
  };

  const handleEditItem = (item: Asset) => {
    setSelectedItem(item);
    setModalType(item.type);
    setShowAddModal(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return;

    try {
      await db.deleteAsset(itemId);
      loadNetWorthData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleItemSaved = () => {
    loadNetWorthData();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
  const isPositive = netWorth >= 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className={`p-6 text-white ${isPositive ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-red-600 to-red-700'}`}>
        <button onClick={() => router.push('/dashboard')} className="mb-4 flex items-center gap-2">
          <ArrowLeft size={20} />
          <span>Dashboard</span>
        </button>

        <h1 className="mb-1 text-2xl font-bold">Net Worth</h1>
        <p className={isPositive ? 'text-green-100' : 'text-red-100'}>
          Your financial position
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6 p-6">
        {/* Net Worth Card */}
        <div className={`card text-white ${isPositive ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-red-600 to-red-700'}`}>
          <p className="mb-1 text-sm opacity-90">Total Net Worth</p>
          <p className="mb-4 text-4xl font-bold">
            {isPositive ? '' : '-'}KES {Math.abs(netWorth).toLocaleString()}
          </p>
          <div className="flex items-center text-sm">
            {isPositive ? (
              <>
                <TrendingUp size={16} className="mr-2" />
                <span>Building wealth</span>
              </>
            ) : (
              <>
                <TrendingDown size={16} className="mr-2" />
                <span>Focus on reducing debt</span>
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <p className="mb-1 text-xs text-gray-600">Assets</p>
            <p className="text-2xl font-bold text-gray-900">
              KES {totalAssets.toLocaleString()}
            </p>
          </div>

          <div className="card">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <p className="mb-1 text-xs text-gray-600">Liabilities</p>
            <p className="text-2xl font-bold text-gray-900">
              KES {totalLiabilities.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Assets Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Assets</h2>
            <button
              onClick={handleAddAsset}
              className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              <Plus size={16} />
              Add Asset
            </button>
          </div>

          {assets.length > 0 ? (
            <div className="space-y-2">
              {assets.map(asset => (
                <AssetCard
                  key={asset.id}
                  item={asset}
                  onEdit={() => handleEditItem(asset)}
                  onDelete={() => handleDeleteItem(asset.id)}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Wallet size={32} className="text-green-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">No assets yet</h3>
              <p className="mb-4 text-sm text-gray-600">
                Add your cash, savings, investments, and other assets
              </p>
              <button
                onClick={handleAddAsset}
                className="mx-auto rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700"
              >
                Add Your First Asset
              </button>
            </div>
          )}
        </div>

        {/* Liabilities Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Liabilities</h2>
            <button
              onClick={handleAddLiability}
              className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <Plus size={16} />
              Add Liability
            </button>
          </div>

          {liabilities.length > 0 ? (
            <div className="space-y-2">
              {liabilities.map(liability => (
                <AssetCard
                  key={liability.id}
                  item={liability}
                  onEdit={() => handleEditItem(liability)}
                  onDelete={() => handleDeleteItem(liability.id)}
                  isLiability
                />
              ))}
            </div>
          ) : (
            <div className="card text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <TrendingDown size={32} className="text-gray-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">No liabilities</h3>
              <p className="text-sm text-gray-600">
                Great! You have no recorded debts or liabilities
              </p>
            </div>
          )}
        </div>

        {/* Info Card */}
        {assets.length > 0 || liabilities.length > 0 ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Update your assets and liabilities regularly to track your net worth growth over time.
            </p>
          </div>
        ) : null}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Add/Edit Modal */}
      <AddAssetModal
        isOpen={showAddModal}
        type={modalType}
        item={selectedItem}
        onClose={() => {
          setShowAddModal(false);
          setSelectedItem(null);
        }}
        onSuccess={handleItemSaved}
      />
    </div>
  );
}

function AssetCard({
  item,
  onEdit,
  onDelete,
  isLiability = false,
}: {
  item: Asset;
  onEdit: () => void;
  onDelete: () => void;
  isLiability?: boolean;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
            <p className={`text-lg font-bold ${isLiability ? 'text-red-600' : 'text-green-600'}`}>
              {isLiability && '-'}KES {item.amount.toLocaleString()}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-gray-500 capitalize">{item.category}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">
              Updated {new Date(item.lastUpdated).toLocaleDateString('en-KE', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}