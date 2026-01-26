import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  UserProfile,
  BudgetCategory,
  Transaction,
  SavingsGoal,
  IPPAccount,
  Asset,
  MonthlySnapshot,
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
}

const DB_NAME = 'family-finance-db';
const DB_VERSION = 1;

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
};

// Utility to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}