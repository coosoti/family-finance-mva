'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Upload, Cloud, FileText, AlertCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { UserProfile } from '@/lib/types';
import { exportToJSON, importFromJSON, downloadBackup, getBackupSize } from '@/lib/backup';

export default function BackupPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [backupSize, setBackupSize] = useState<string>('');

  useEffect(() => {
    loadProfile();
    loadBackupInfo();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await db.getUserProfile();
      setProfile(userProfile || null);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadBackupInfo = () => {
    const lastBackup = localStorage.getItem('lastBackupDate');
    setLastBackupDate(lastBackup);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const jsonData = await exportToJSON();
      const size = getBackupSize(jsonData);
      setBackupSize(size);
      
      downloadBackup(jsonData);
      
      // Save last backup date
      const now = new Date().toISOString();
      localStorage.setItem('lastBackupDate', now);
      setLastBackupDate(now);
      
      alert('Backup downloaded successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to create backup. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('⚠️ Importing will replace ALL existing data. Continue?')) {
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      await importFromJSON(text);
      
      alert('✅ Data imported successfully! Refreshing...');
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Failed to import backup. Please check the file and try again.');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-blue-600 p-6 text-white">
        <button onClick={() => router.push('/dashboard')} className="mb-4 flex items-center gap-2">
          <ArrowLeft size={20} />
          <span>Dashboard</span>
        </button>

        <h1 className="mb-1 text-2xl font-bold">Backup & Restore</h1>
        <p className="text-blue-100">Protect your financial data</p>
      </div>

      {/* Content */}
      <div className="space-y-6 p-6">
        {/* Info Card */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="mb-2 font-medium">Your data stays private</p>
              <p>
                All data is stored locally on your device. Backups are downloaded to your device 
                and can be manually uploaded to your preferred cloud storage.
              </p>
            </div>
          </div>
        </div>

        {/* Last Backup Info */}
        {lastBackupDate && (
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <FileText size={24} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Last Backup</p>
                <p className="text-sm text-gray-600">
                  {new Date(lastBackupDate).toLocaleDateString('en-KE', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Export Section */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Export Data</h2>
          
          <div className="card">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Download size={24} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-gray-900">Download Backup</h3>
                <p className="text-sm text-gray-600">
                  Export all your data to a JSON file. Keep this file safe!
                </p>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting || !profile}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Download size={20} />
              {isExporting ? 'Creating Backup...' : 'Download Backup File'}
            </button>

            {backupSize && (
              <p className="mt-2 text-center text-xs text-gray-500">
                Last backup size: {backupSize}
              </p>
            )}
          </div>
        </div>

        {/* Import Section */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Import Data</h2>
          
          <div className="card">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Upload size={24} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-gray-900">Restore from Backup</h3>
                <p className="text-sm text-gray-600">
                  Import data from a backup file. This will replace all existing data.
                </p>
              </div>
            </div>

            <div className="mb-3 rounded-lg border-2 border-orange-200 bg-orange-50 p-3">
              <p className="text-sm font-medium text-orange-900">⚠️ Warning</p>
              <p className="text-xs text-orange-800">
                Importing will permanently delete all current data and replace it with the backup.
              </p>
            </div>

            <label className="btn-primary flex cursor-pointer items-center justify-center gap-2">
              <Upload size={20} />
              {isImporting ? 'Importing...' : 'Choose Backup File'}
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Manual Cloud Upload Instructions */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Cloud Storage</h2>
          
          <div className="card">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Cloud size={24} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-gray-900">Save to Cloud</h3>
                <p className="text-sm text-gray-600">
                  After downloading your backup, you can manually upload it to:
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Google Drive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Dropbox</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>OneDrive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>iCloud Drive</span>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-600">
                <strong>💡 Tip:</strong> Set a reminder to backup your data monthly. 
                Keep multiple backups in different locations for extra safety.
              </p>
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="card">
          <h3 className="mb-3 font-semibold text-gray-900">What's Included in Backups</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
              <span>User profile and settings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
              <span>Budget categories and allocations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
              <span>All transactions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
              <span>Savings goals</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
              <span>IPP pension account</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
              <span>Assets and liabilities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
              <span>Monthly snapshots</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}