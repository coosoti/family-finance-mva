'use client';

import { useState } from 'react';
import { X, Database, Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { getMigrationInstance } from '@/lib/migration/migrate-to-supabase';

interface MigrationProgress {
  step: string;
  current: number;
  total: number;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  error?: string;
}

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function MigrationModal({ isOpen, onClose, onComplete }: MigrationModalProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress>({
    step: 'Ready to migrate',
    current: 0,
    total: 10,
    status: 'pending',
  });

  const handleMigrate = async () => {
    setIsMigrating(true);
    
    const migration = getMigrationInstance((prog) => {
      setProgress(prog);
    });

    const result = await migration.migrateAllData();

    if (result.success) {
      // Wait a bit to show success message
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      setIsMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Database size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Migrate Your Data</h2>
              <p className="text-sm text-gray-600">Move to cloud-based storage</p>
            </div>
          </div>
          {!isMigrating && (
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Info Card */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="mb-2 font-medium">What will be migrated:</p>
              <ul className="space-y-1 text-xs">
                <li>• Your profile and settings</li>
                <li>• Budget categories and allocations</li>
                <li>• All transactions and expenses</li>
                <li>• Savings goals and IPP account</li>
                <li>• Assets, liabilities, and investments</li>
                <li>• Monthly snapshots and analytics data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        {isMigrating && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{progress.step}</span>
              <span className="text-sm text-gray-600">
                {progress.current}/{progress.total}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4 h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress.status === 'error'
                    ? 'bg-red-500'
                    : progress.status === 'completed'
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>

            {/* Status Icon */}
            <div className="flex items-center justify-center">
              {progress.status === 'in-progress' && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader size={20} className="animate-spin" />
                  <span className="text-sm font-medium">Migrating...</span>
                </div>
              )}
              {progress.status === 'completed' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  <span className="text-sm font-medium">Migration Complete!</span>
                </div>
              )}
              {progress.status === 'error' && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={20} />
                  <span className="text-sm font-medium">
                    Error: {progress.error || 'Migration failed'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isMigrating ? (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-gray-300 bg-white p-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleMigrate}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 p-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Upload size={20} />
              Start Migration
            </button>
          </div>
        ) : (
          progress.status === 'error' && (
            <button
              onClick={handleMigrate}
              className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Retry Migration
            </button>
          )
        )}

        {/* Warning */}
        {!isMigrating && (
          <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-xs text-yellow-800">
              <strong>⚠️ Important:</strong> After migration, your local data will remain as a
              backup. You can clear it manually from settings if needed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}