import { db, generateId } from './db';
import { MonthlySnapshot } from './types';
import { getCurrentMonth, calculateNetWorth } from './calculations';

/**
 * Ensure a monthly snapshot exists for the given month
 * If it doesn't exist, create one
 */
export async function ensureMonthlySnapshot(month: string): Promise<MonthlySnapshot> {
  // Check if snapshot already exists
  let snapshot = await db.getMonthlySnapshot(month);
  
  if (snapshot) {
    return snapshot;
  }

  // Create new snapshot
  const profile = await db.getUserProfile();
  if (!profile) {
    throw new Error('No user profile found');
  }

  const [transactions, additionalIncome] = await Promise.all([
    db.getTransactionsByMonth(month),
    db.getAdditionalIncomeByMonth(month),
  ]);

  // Calculate totals
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsContributions = transactions
    .filter((t) => t.type === 'saving')
    .reduce((sum, t) => sum + t.amount, 0);

  const ippContributions = transactions
    .filter((t) => t.type === 'ipp')
    .reduce((sum, t) => sum + t.amount, 0);

  const additionalTotal = additionalIncome.reduce((sum, inc) => sum + inc.amount, 0);
  const totalIncome = profile.monthlyIncome + additionalTotal;

  const netWorth = await calculateNetWorth();

  snapshot = {
    id: generateId(),
    month,
    income: totalIncome,
    totalExpenses: expenses,
    totalSavings: savingsContributions,
    ippContributions,
    netWorth,
    createdAt: new Date(),
  };

  await db.saveMonthlySnapshot(snapshot);
  return snapshot;
}

/**
 * Update snapshot for current month with latest data
 */
export async function updateCurrentMonthSnapshot(): Promise<MonthlySnapshot> {
  const currentMonth = getCurrentMonth();
  
  // Delete existing snapshot if it exists
  const existing = await db.getMonthlySnapshot(currentMonth);
  if (existing) {
    // We'll just overwrite it by creating a new one with the same month
  }
  
  return await ensureMonthlySnapshot(currentMonth);
}

/**
 * Get or create snapshots for the last N months
 */
export async function getRecentSnapshots(months: number = 6): Promise<MonthlySnapshot[]> {
  const now = new Date();
  const snapshots: MonthlySnapshot[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const snapshot = await ensureMonthlySnapshot(month);
    snapshots.push(snapshot);
  }

  return snapshots;
}

/**
 * Calculate month-over-month changes
 */
export function calculateMonthlyChanges(snapshots: MonthlySnapshot[]) {
  if (snapshots.length < 2) {
    return null;
  }

  const current = snapshots[snapshots.length - 1];
  const previous = snapshots[snapshots.length - 2];

  return {
    netWorthChange: current.netWorth - previous.netWorth,
    netWorthChangePercent: previous.netWorth !== 0 
      ? ((current.netWorth - previous.netWorth) / previous.netWorth) * 100 
      : 0,
    expenseChange: current.totalExpenses - previous.totalExpenses,
    expenseChangePercent: previous.totalExpenses !== 0
      ? ((current.totalExpenses - previous.totalExpenses) / previous.totalExpenses) * 100
      : 0,
    savingsChange: current.totalSavings - previous.totalSavings,
    savingsChangePercent: previous.totalSavings !== 0
      ? ((current.totalSavings - previous.totalSavings) / previous.totalSavings) * 100
      : 0,
  };
}