import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  UserProfile,
  BudgetCategory,
  Transaction,
  SavingsGoal,
  IPPAccount,
  Asset,
  MonthlySnapshot,
  BudgetSummary,
  AdditionalIncome,
  Investment,
  DividendPayment,
} from './types';

// Database schema definition
interface FamilyFinanceDB extends DBSchema {
  userProfile: {
    key: string;
    value: UserProfile;
  };
  budgetCategories: {
    key: string;
    value: BudgetCategory;
    indexes: { 'by-type': string };
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-month': string; 'by-category': string };
  };
  savingsGoals: {
    key: string;
    value: SavingsGoal;
  };
  ippAccount: {
    key: string;
    value: IPPAccount;
  };
  assets: {
    key: string;
    value: Asset;
    indexes: { 'by-type': string };
  };
  monthlySnapshots: {
    key: string;
    value: MonthlySnapshot;
    indexes: { 'by-month': string };
  };
  additionalIncome: {
    key: string;
    value: AdditionalIncome;
    indexes: { 'by-month': string };
  };
  investments: {
    key: string;
    value: Investment;
    indexes: { 'by-type': string };
  };
  
  dividendPayments: {
    key: string;
    value: DividendPayment;
    indexes: { 'by-investment': string };
  };
}

const DB_NAME = 'family-finance-db';
// Bump DB version when adding new object stores so the `upgrade` callback
// runs for existing user databases and creates any missing stores.
const DB_VERSION = 3;

let dbInstance: IDBPDatabase<FamilyFinanceDB> | null = null;

// Initialize database
export async function initDB(): Promise<IDBPDatabase<FamilyFinanceDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<FamilyFinanceDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // User Profile store
      if (!db.objectStoreNames.contains('userProfile')) {
        db.createObjectStore('userProfile', { keyPath: 'id' });
      }

      // Budget Categories store
      if (!db.objectStoreNames.contains('budgetCategories')) {
        const categoryStore = db.createObjectStore('budgetCategories', {
          keyPath: 'id',
        });
        categoryStore.createIndex('by-type', 'type');
      }

      // Transactions store
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', {
          keyPath: 'id',
        });
        txStore.createIndex('by-month', 'month');
        txStore.createIndex('by-category', 'categoryId');
      }

      // Savings Goals store
      if (!db.objectStoreNames.contains('savingsGoals')) {
        db.createObjectStore('savingsGoals', { keyPath: 'id' });
      }

      // IPP Account store
      if (!db.objectStoreNames.contains('ippAccount')) {
        db.createObjectStore('ippAccount', { keyPath: 'id' });
      }

      // Assets store
      if (!db.objectStoreNames.contains('assets')) {
        const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
        assetStore.createIndex('by-type', 'type');
      }

      // Monthly Snapshots store
      if (!db.objectStoreNames.contains('monthlySnapshots')) {
        const snapshotStore = db.createObjectStore('monthlySnapshots', {
          keyPath: 'id',
        });
        snapshotStore.createIndex('by-month', 'month');
      }

      // Additional Income store
      if (!db.objectStoreNames.contains('additionalIncome')) {
        const incomeStore = db.createObjectStore('additionalIncome', {
          keyPath: 'id',
        });
        incomeStore.createIndex('by-month', 'month');
      }
      // Investments store
      if (!db.objectStoreNames.contains('investments')) {
        const investmentStore = db.createObjectStore('investments', {
          keyPath: 'id',
        });
        investmentStore.createIndex('by-type', 'type');
      }

      // Dividend Payments store
      if (!db.objectStoreNames.contains('dividendPayments')) {
        const dividendStore = db.createObjectStore('dividendPayments', {
          keyPath: 'id',
        });
        dividendStore.createIndex('by-investment', 'investmentId');
      }
    },
  });

  return dbInstance;
}

// Generic CRUD operations
export const db = {
  // Get database instance
  async getDB() {
    return await initDB();
  },

  // User Profile
  async getUserProfile(): Promise<UserProfile | undefined> {
    const db = await initDB();
    const profiles = await db.getAll('userProfile');
    return profiles[0]; // Single user for MVP
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    const db = await initDB();
    await db.put('userProfile', profile);
  },

  // Budget Categories
  async getBudgetCategories(): Promise<BudgetCategory[]> {
    const db = await initDB();
    return await db.getAll('budgetCategories');
  },

  async saveBudgetCategory(category: BudgetCategory): Promise<void> {
    const db = await initDB();
    await db.put('budgetCategories', category);
  },

  // Transactions
  async getTransactionsByMonth(month: string): Promise<Transaction[]> {
    const db = await initDB();
    return await db.getAllFromIndex('transactions', 'by-month', month);
  },

  async saveTransaction(transaction: Transaction): Promise<void> {
    const db = await initDB();
    await db.put('transactions', transaction);
  },

  // Add more CRUD methods as needed for other stores
  // Delete budget category
  async deleteBudgetCategory(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('budgetCategories', id);
  },

  // Get categories by type
  async getCategoriesByType(type: 'needs' | 'wants' | 'savings' | 'growth'): Promise<BudgetCategory[]> {
    const db = await initDB();
    return await db.getAllFromIndex('budgetCategories', 'by-type', type);
  },

  // Savings Goals
  async getAllSavingsGoals(): Promise<SavingsGoal[]> {
    const db = await initDB();
    return await db.getAll('savingsGoals');
  },

  async saveSavingsGoal(goal: SavingsGoal): Promise<void> {
    const db = await initDB();
    await db.put('savingsGoals', goal);
  },

  async deleteSavingsGoal(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('savingsGoals', id);
  },

  // IPP Account
  async getIPPAccount(): Promise<IPPAccount | undefined> {
    const db = await initDB();
    const accounts = await db.getAll('ippAccount');
    return accounts[0]; // Single IPP account for MVP
  },

  async saveIPPAccount(account: IPPAccount): Promise<void> {
    const db = await initDB();
    await db.put('ippAccount', account);
  },

  // Assets
  async getAllAssets(): Promise<Asset[]> {
    const db = await initDB();
    return await db.getAll('assets');
  },

  async getAssetsByType(type: 'asset' | 'liability'): Promise<Asset[]> {
    const db = await initDB();
    return await db.getAllFromIndex('assets', 'by-type', type);
  },

  async saveAsset(asset: Asset): Promise<void> {
    const db = await initDB();
    await db.put('assets', asset);
  },

  async deleteAsset(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('assets', id);
  },

  // Monthly Snapshots
  async getMonthlySnapshot(month: string): Promise<MonthlySnapshot | undefined> {
    const db = await initDB();
    const snapshots = await db.getAllFromIndex('monthlySnapshots', 'by-month', month);
    return snapshots[0];
  },

  async saveMonthlySnapshot(snapshot: MonthlySnapshot): Promise<void> {
    const db = await initDB();
    await db.put('monthlySnapshots', snapshot);
  },

  async getAllMonthlySnapshots(): Promise<MonthlySnapshot[]> {
    const db = await initDB();
    return await db.getAll('monthlySnapshots');
  },

  // Delete transaction
  async deleteTransaction(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('transactions', id);
  },

  // Get all transactions
  async getAllTransactions(): Promise<Transaction[]> {
    const db = await initDB();
    return await db.getAll('transactions');
  },

  // Clear all data (for testing/reset)
  async clearAllData(): Promise<void> {
    const db = await initDB();
    const stores = ['userProfile', 'budgetCategories', 'transactions', 'savingsGoals', 'ippAccount', 'assets', 'monthlySnapshots', 'investments', 'dividendPayments'];
    
    for (const store of stores) {
      const allKeys = await db.getAllKeys(store as any);
      for (const key of allKeys) {
        await db.delete(store as any, key);
      }
    }
  },

  // Additional Income
  async getAdditionalIncomeByMonth(month: string): Promise<AdditionalIncome[]> {
    const db = await initDB();
    return await db.getAllFromIndex('additionalIncome', 'by-month', month);
  },

  async saveAdditionalIncome(income: AdditionalIncome): Promise<void> {
    const db = await initDB();
    await db.put('additionalIncome', income);
  },

  async deleteAdditionalIncome(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('additionalIncome', id);
  },

  async getAllAdditionalIncome(includeDeleted: boolean = false): Promise<AdditionalIncome[]> {
    const db = await initDB();
    const all = await db.getAll('additionalIncome');
    // Exclude soft-deleted entries by default unless requested
    if (includeDeleted) return all;
    return all.filter((i) => !(i as any).deleted);
  },

  // Investments
  async getAllInvestments(): Promise<Investment[]> {
    const db = await initDB();
    return await db.getAll('investments');
  },

  async getInvestmentsByType(type: string): Promise<Investment[]> {
    const db = await initDB();
    return await db.getAllFromIndex('investments', 'by-type', type);
  },

  async saveInvestment(investment: Investment): Promise<void> {
    const db = await initDB();
    await db.put('investments', investment);
  },

  async deleteInvestment(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('investments', id);
  },

  // Dividend Payments
  async getDividendsByInvestment(investmentId: string): Promise<DividendPayment[]> {
    const db = await initDB();
    return await db.getAllFromIndex('dividendPayments', 'by-investment', investmentId);
  },

  async saveDividendPayment(payment: DividendPayment): Promise<void> {
    const db = await initDB();
    await db.put('dividendPayments', payment);
  },

  async deleteDividendPayment(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('dividendPayments', id);
  },
};

// Utility to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}