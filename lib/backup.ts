import { db } from './db';
import type {
  UserProfile,
  BudgetCategory,
  Transaction,
  SavingsGoal,
  IPPAccount,
  Asset,
  MonthlySnapshot,
} from './types';

export interface BackupData {
  version: string;
  exportDate: string;
  userProfile: UserProfile | undefined;
  budgetCategories: BudgetCategory[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  ippAccount: IPPAccount | undefined;
  assets: Asset[];
  monthlySnapshots: MonthlySnapshot[];
}

// Export all data to JSON
export async function exportToJSON(): Promise<string> {
  try {
    const [
      userProfile,
      budgetCategories,
      transactions,
      savingsGoals,
      ippAccount,
      assets,
      monthlySnapshots,
    ] = await Promise.all([
      db.getUserProfile(),
      db.getBudgetCategories(),
      db.getAllTransactions(),
      db.getAllSavingsGoals(),
      db.getIPPAccount(),
      db.getAllAssets(),
      db.getAllMonthlySnapshots(),
    ]);

    const backupData: BackupData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      userProfile,
      budgetCategories,
      transactions,
      savingsGoals,
      ippAccount,
      assets,
      monthlySnapshots,
    };

    return JSON.stringify(backupData, null, 2);
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error('Failed to create backup');
  }
}

// Import data from JSON
export async function importFromJSON(jsonString: string): Promise<void> {
  try {
    const backupData: BackupData = JSON.parse(jsonString);

    // Validate backup data
    if (!backupData.version || !backupData.exportDate) {
      throw new Error('Invalid backup file format');
    }

    // Clear existing data
    await db.clearAllData();

    // Import user profile
    if (backupData.userProfile) {
      await db.saveUserProfile({
        ...backupData.userProfile,
        createdAt: new Date(backupData.userProfile.createdAt),
        updatedAt: new Date(backupData.userProfile.updatedAt),
      });
    }

    // Import budget categories
    for (const category of backupData.budgetCategories) {
      await db.saveBudgetCategory(category);
    }

    // Import transactions
    for (const transaction of backupData.transactions) {
      await db.saveTransaction({
        ...transaction,
        date: new Date(transaction.date),
      });
    }

    // Import savings goals
    for (const goal of backupData.savingsGoals) {
      await db.saveSavingsGoal({
        ...goal,
        createdAt: new Date(goal.createdAt),
      });
    }

    // Import IPP account
    if (backupData.ippAccount) {
      await db.saveIPPAccount({
        ...backupData.ippAccount,
        lastUpdated: new Date(backupData.ippAccount.lastUpdated),
      });
    }

    // Import assets
    for (const asset of backupData.assets) {
      await db.saveAsset({
        ...asset,
        lastUpdated: new Date(asset.lastUpdated),
      });
    }

    // Import monthly snapshots
    for (const snapshot of backupData.monthlySnapshots) {
      await db.saveMonthlySnapshot({
        ...snapshot,
        createdAt: new Date(snapshot.createdAt),
      });
    }

    console.log('✅ Data imported successfully');
  } catch (error) {
    console.error('Error importing backup:', error);
    throw new Error('Failed to import backup');
  }
}

// Download backup as file
export function downloadBackup(jsonString: string, filename?: string): void {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `family-finance-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Get backup file size (human readable)
export function getBackupSize(jsonString: string): string {
  const bytes = new Blob([jsonString]).size;
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}