import { db as indexedDB } from '../db';
import { dbService, generateId } from '../supabase/db-service';
import type {
  UserProfile,
  BudgetCategory,
  Transaction,
  SavingsGoal,
  IPPAccount,
  Asset,
  MonthlySnapshot,
  AdditionalIncome,
  Investment,
} from '../types';

interface MigrationProgress {
  step: string;
  current: number;
  total: number;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  error?: string;
}

export class DataMigration {
  private progressCallback?: (progress: MigrationProgress) => void;

  constructor(progressCallback?: (progress: MigrationProgress) => void) {
    this.progressCallback = progressCallback;
  }

  private updateProgress(progress: MigrationProgress) {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  async migrateAllData(): Promise<{ success: boolean; error?: string }> {
    try {
      // Step 1: Migrate User Profile
      this.updateProgress({
        step: 'User Profile',
        current: 0,
        total: 10,
        status: 'in-progress',
      });
      await this.migrateUserProfile();

      // Step 2: Migrate Budget Categories
      this.updateProgress({
        step: 'Budget Categories',
        current: 1,
        total: 10,
        status: 'in-progress',
      });
      await this.migrateBudgetCategories();

      // Step 3: Migrate Transactions
      this.updateProgress({
        step: 'Transactions',
        current: 2,
        total: 10,
        status: 'in-progress',
      });
      await this.migrateTransactions();

      // Step 4: Migrate Savings Goals
      this.updateProgress({
        step: 'Savings Goals',
        current: 3,
        total: 10,
        status: 'in-progress',
      });
      await this.migrateSavingsGoals();

      // Step 5: Migrate IPP Account
      this.updateProgress({
        step: 'IPP Account',
        current: 4,
        total: 10,
        status: 'in-progress',
      });
      await this.migrateIPPAccount();

      // Step 6: Migrate Assets
      this.updateProgress({
        step: 'Assets & Liabilities',
        current: 5,
        total: 10,
        status: 'in-progress',
      });
      await this.migrateAssets();

      // Step 7: Migrate Monthly Snapshots
      this.updateProgress({
        step: 'Monthly Snapshots',
        current: 6,
        total: 10,
        status: 'in-progress',
      });
      await this.migrateMonthlySnapshots();

      // Step 8: Migrate Additional Income
      this.updateProgress({
        step: 'Additional Income',
        current: 7,
        total: 10,
        status: 'in-progress',
      });
      await this.migrateAdditionalIncome();

      // Step 9: Migrate Investments
      this.updateProgress({
        step: 'Investments',
        current: 8,
        total: 10,
        status: 'in-progress',
      });
      await this.migrateInvestments();

      // Step 10: Complete
      this.updateProgress({
        step: 'Migration Complete',
        current: 10,
        total: 10,
        status: 'completed',
      });

      return { success: true };
    } catch (error: any) {
      this.updateProgress({
        step: 'Migration Failed',
        current: 0,
        total: 10,
        status: 'error',
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  }

  private async migrateUserProfile() {
    const profile = await indexedDB.getUserProfile();
    if (profile) {
      await dbService.saveUserProfile({
        name: profile.name,
        monthlyIncome: profile.monthlyIncome,
        dependents: profile.dependents,
      });
    }
  }

  private async migrateBudgetCategories() {
    const categories = await indexedDB.getBudgetCategories();
    for (const category of categories) {
      // Generate new UUID for Supabase
      const newCategory: BudgetCategory = {
        ...category,
        id: generateId(),
      };
      await dbService.saveBudgetCategory(newCategory);
    }
  }

  private async migrateTransactions() {
    const transactions = await indexedDB.getAllTransactions();
    
    // Get category mapping (old ID to new ID)
    const oldCategories = await indexedDB.getBudgetCategories();
    const newCategories = await dbService.getBudgetCategories();
    
    const categoryMap = new Map<string, string>();
    oldCategories.forEach((oldCat, index) => {
      if (newCategories[index]) {
        categoryMap.set(oldCat.id, newCategories[index].id);
      }
    });

    for (const transaction of transactions) {
      const newTransaction: Transaction = {
        ...transaction,
        id: generateId(),
        categoryId: categoryMap.get(transaction.categoryId) || transaction.categoryId,
      };
      await dbService.saveTransaction(newTransaction);
    }
  }

  private async migrateSavingsGoals() {
    const goals = await indexedDB.getAllSavingsGoals();
    for (const goal of goals) {
      const newGoal: SavingsGoal = {
        ...goal,
        id: generateId(),
      };
      await dbService.saveSavingsGoal(newGoal);
    }
  }

  private async migrateIPPAccount() {
    const ippAccount = await indexedDB.getIPPAccount();
    if (ippAccount) {
      const newIPP: IPPAccount = {
        ...ippAccount,
        id: generateId(),
      };
      await dbService.saveIPPAccount(newIPP);
    }
  }

  private async migrateAssets() {
    const assets = await indexedDB.getAllAssets();
    for (const asset of assets) {
      const newAsset: Asset = {
        ...asset,
        id: generateId(),
      };
      await dbService.saveAsset(newAsset);
    }
  }

  private async migrateMonthlySnapshots() {
    const snapshots = await indexedDB.getAllMonthlySnapshots();
    for (const snapshot of snapshots) {
      const newSnapshot: MonthlySnapshot = {
        ...snapshot,
        id: generateId(),
      };
      await dbService.saveMonthlySnapshot(newSnapshot);
    }
  }

  private async migrateAdditionalIncome() {
    const incomes = await indexedDB.getAllAdditionalIncome();
    for (const income of incomes) {
      const newIncome: AdditionalIncome = {
        ...income,
        id: generateId(),
      };
      await dbService.saveAdditionalIncome(newIncome);
    }
  }

  private async migrateInvestments() {
    const investments = await indexedDB.getAllInvestments();
    for (const investment of investments) {
      const newInvestment: Investment = {
        ...investment,
        id: generateId(),
      };
      await dbService.saveInvestment(newInvestment);
    }
  }

  async hasLocalData(): Promise<boolean> {
    try {
      const profile = await indexedDB.getUserProfile();
      return !!profile;
    } catch {
      return false;
    }
  }

  async clearLocalData() {
    await indexedDB.clearAllData();
  }
}

// Singleton instance
let migrationInstance: DataMigration | null = null;

export function getMigrationInstance(
  progressCallback?: (progress: MigrationProgress) => void
): DataMigration {
  if (!migrationInstance) {
    migrationInstance = new DataMigration(progressCallback);
  }
  return migrationInstance;
}