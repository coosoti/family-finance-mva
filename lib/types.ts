// Core data types for the application

export interface UserProfile {
    id: string;
    name: string;
    monthlyIncome: number;
    dependents: number;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface BudgetCategory {
    id: string;
    name: string;
    budgetedAmount: number;
    type: 'needs' | 'wants' | 'savings' | 'growth';
    isDefault: boolean;
  }
  
  export interface Transaction {
    id: string;
    date: Date;
    categoryId: string;
    amount: number;
    type: 'expense' | 'saving' | 'ipp' | 'asset' | 'liability';
    notes?: string;
    month: string; // YYYY-MM format
  }
  
  export interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution: number;
    createdAt: Date;
  }
  
  export interface IPPAccount {
    id: string;
    currentBalance: number;
    monthlyContribution: number;
    totalContributions: number;
    taxReliefRate: number; // 0.30 for 30%
    realizedValue: number; // Actual growth added manually
    lastUpdated: Date;
  }
  
  export interface Asset {
    id: string;
    name: string;
    amount: number;
    type: 'asset' | 'liability';
    category: string; // 'cash' | 'pension' | 'savings' | 'loan' | 'credit'
    lastUpdated: Date;
  }
  
  export interface MonthlySnapshot {
    id: string;
    month: string; // YYYY-MM format
    income: number;
    totalExpenses: number;
    totalSavings: number;
    ippContributions: number;
    netWorth: number;
    createdAt: Date;
  }
  
  export interface BudgetSummary {
    month: string;
    needs: { budgeted: number; spent: number };
    wants: { budgeted: number; spent: number };
    savings: { budgeted: number; spent: number };
    growth: { budgeted: number; spent: number };
  }
  export interface AdditionalIncome {
    id: string;
    date: Date;
    amount: number;
    source: string; // e.g., "Freelance", "Side Hustle", "Bonus"
    description?: string;
    month: string; // YYYY-MM format
    deleted?: boolean;
  }

  export interface Investment {
  id: string;
  name: string; // e.g., "Sanlam Money Market Fund"
  type: 'money-market' | 'unit-trust' | 'government-bond' | 'stock' | 'sacco' | 'reit' | 'other';
  units: number; // Number of units/shares
  purchasePrice: number; // Price per unit when bought
  currentPrice: number; // Current price per unit
  purchaseDate: Date;
  lastUpdated: Date;
  notes?: string;
}

export interface DividendPayment {
  id: string;
  investmentId: string;
  amount: number;
  date: Date;
  type: 'dividend' | 'interest';
  notes?: string;
}