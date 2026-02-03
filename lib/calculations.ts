import { db } from './db';
import { Asset, Transaction, BudgetCategory } from './types';

// Calculate total net worth
export async function calculateNetWorth(): Promise<number> {
  const assets = await db.getAllAssets();
  
  const totalAssets = assets
    .filter(a => a.type === 'asset')
    .reduce((sum, a) => sum + a.amount, 0);
  
  const totalLiabilities = assets
    .filter(a => a.type === 'liability')
    .reduce((sum, a) => sum + a.amount, 0);
  
  // Include any recorded additional income as part of cash assets
  const additionalIncome = await db.getAllAdditionalIncome();
  const additionalTotal = additionalIncome.reduce((sum, ai) => sum + ai.amount, 0);

  return totalAssets + additionalTotal - totalLiabilities;
}

// Get current month in YYYY-MM format
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Calculate budget vs actual for current month
export async function getBudgetVsActual() {
  const currentMonth = getCurrentMonth();
  const categories = await db.getBudgetCategories();
  const transactions = await db.getTransactionsByMonth(currentMonth);

  // Filter only expense transactions
  const expenses = transactions.filter(t => t.type === 'expense');

  // Calculate spent per category
  const categorySpending = new Map<string, number>();
  expenses.forEach(tx => {
    const current = categorySpending.get(tx.categoryId) || 0;
    categorySpending.set(tx.categoryId, current + tx.amount);
  });

  // Calculate totals by type
  const totals = {
    needs: { budgeted: 0, spent: 0 },
    wants: { budgeted: 0, spent: 0 },
    savings: { budgeted: 0, spent: 0 },
    growth: { budgeted: 0, spent: 0 },
  };

  categories.forEach(cat => {
    const spent = categorySpending.get(cat.id) || 0;
    totals[cat.type].budgeted += cat.budgetedAmount;
    totals[cat.type].spent += spent;
  });

  const totalBudgeted = Object.values(totals).reduce((sum, t) => sum + t.budgeted, 0);
  const totalSpent = Object.values(totals).reduce((sum, t) => sum + t.spent, 0);

  return {
    totals,
    totalBudgeted,
    totalSpent,
    remaining: totalBudgeted - totalSpent,
    percentageUsed: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
  };
}

// Get days left in current month
export function getDaysLeftInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

// Calculate savings progress
export async function getSavingsProgress() {
  const goals = await db.getAllSavingsGoals();
  
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalMonthly = goals.reduce((sum, g) => sum + g.monthlyContribution, 0);

  return {
    totalTarget,
    totalCurrent,
    totalMonthly,
    percentageComplete: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
    goals,
  };
}

// Get IPP summary
export async function getIPPSummary() {
  const ippAccount = await db.getIPPAccount();
  
  if (!ippAccount) {
    return null;
  }

  const taxRelief = ippAccount.monthlyContribution * ippAccount.taxReliefRate;
  
  return {
    ...ippAccount,
    taxRelief,
    effectiveCost: ippAccount.monthlyContribution - taxRelief,
  };
}

// Get recent transactions
export async function getRecentTransactions(limit: number = 5) {
  const allTransactions = await db.getAllTransactions();
  
  // Sort by date descending
  return allTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// Create monthly snapshot
export async function createMonthlySnapshot(month: string) {
  const profile = await db.getUserProfile();
  if (!profile) return;

  const budgetVsActual = await getBudgetVsActual();
  const netWorth = await calculateNetWorth();
  const transactions = await db.getTransactionsByMonth(month);

  // Include additional income in the snapshot income total
  const additionalThisMonth = await db.getAdditionalIncomeByMonth(month);
  const additionalTotal = additionalThisMonth.reduce((sum, a) => sum + a.amount, 0);

  const ippContributions = transactions
    .filter(t => t.type === 'ipp')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsContributions = transactions
    .filter(t => t.type === 'saving')
    .reduce((sum, t) => sum + t.amount, 0);

  const snapshot = {
    id: `snapshot-${month}`,
    month,
    income: profile.monthlyIncome + additionalTotal,
    totalExpenses: budgetVsActual.totalSpent,
    totalSavings: savingsContributions,
    ippContributions,
    netWorth,
    createdAt: new Date(),
  };

  await db.saveMonthlySnapshot(snapshot);
  return snapshot;
}

// Get growth from previous month
export async function getNetWorthGrowth() {
  const currentMonth = getCurrentMonth();
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  const currentSnapshot = await db.getMonthlySnapshot(currentMonth);
  const lastSnapshot = await db.getMonthlySnapshot(lastMonthStr);

  if (!currentSnapshot || !lastSnapshot) {
    return { growth: 0, percentage: 0 };
  }

  const growth = currentSnapshot.netWorth - lastSnapshot.netWorth;
  const percentage = lastSnapshot.netWorth > 0 
    ? (growth / lastSnapshot.netWorth) * 100 
    : 0;

  return { growth, percentage };
}