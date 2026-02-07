import { supabase } from './client';
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
  DividendPayment,
} from '../types';
import type { Database } from './database.types';

// Type helpers
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type BudgetCategoryRow = Database['public']['Tables']['budget_categories']['Row'];
type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type SavingsGoalRow = Database['public']['Tables']['savings_goals']['Row'];
type IPPAccountRow = Database['public']['Tables']['ipp_accounts']['Row'];
type AssetRow = Database['public']['Tables']['assets']['Row'];
type MonthlySnapshotRow = Database['public']['Tables']['monthly_snapshots']['Row'];
type AdditionalIncomeRow = Database['public']['Tables']['additional_income']['Row'];
type InvestmentRow = Database['public']['Tables']['investments']['Row'];

export const dbService = {
  // =============================================
  // USER PROFILE
  // =============================================
  
  async getUserProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    if (!data) return null;

    // Cast to UserProfileRow for proper typing
    const profileData = data as UserProfileRow;

    return {
      id: profileData.id,
      name: profileData.name,
      monthlyIncome: Number(profileData.monthly_income),
      dependents: profileData.dependents,
      createdAt: new Date(profileData.created_at),
      updatedAt: new Date(profileData.updated_at),
    };
  },

  async saveUserProfile(profile: Partial<UserProfile>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        name: profile.name!,
        monthly_income: profile.monthlyIncome!,
        dependents: profile.dependents!,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'id' });

    if (error) throw error;
  },

  // =============================================
  // BUDGET CATEGORIES
  // =============================================

  async getBudgetCategories(): Promise<BudgetCategory[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching budget categories:', error);
      return [];
    }

    if (!data) return [];

    return data.map((cat: BudgetCategoryRow) => ({
      id: cat.id,
      name: cat.name,
      budgetedAmount: Number(cat.budgeted_amount),
      type: cat.type as 'needs' | 'wants' | 'savings' | 'growth',
      isDefault: cat.is_default,
    }));
  },

  async saveBudgetCategory(category: BudgetCategory): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('budget_categories')
      .upsert({
        id: category.id,
        user_id: user.id,
        name: category.name,
        budgeted_amount: category.budgetedAmount,
        type: category.type,
        is_default: category.isDefault,
      } as any, { onConflict: 'id' });

    if (error) throw error;
  },

  async deleteBudgetCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('budget_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // =============================================
  // TRANSACTIONS
  // =============================================

  async getTransactionsByMonth(month: string): Promise<Transaction[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    if (!data) return [];

    return data.map((tx: TransactionRow) => ({
      id: tx.id,
      date: new Date(tx.date),
      categoryId: tx.category_id || '',
      amount: Number(tx.amount),
      type: tx.type as 'expense' | 'saving' | 'ipp' | 'asset' | 'liability',
      notes: tx.notes || undefined,
      month: tx.month,
    }));
  },

  async getAllTransactions(): Promise<Transaction[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching all transactions:', error);
      return [];
    }

    if (!data) return [];

    return data.map((tx: TransactionRow) => ({
      id: tx.id,
      date: new Date(tx.date),
      categoryId: tx.category_id || '',
      amount: Number(tx.amount),
      type: tx.type as 'expense' | 'saving' | 'ipp' | 'asset' | 'liability',
      notes: tx.notes || undefined,
      month: tx.month,
    }));
  },

  async saveTransaction(transaction: Transaction): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('transactions')
      .upsert({
        id: transaction.id,
        user_id: user.id,
        category_id: transaction.categoryId || null,
        date: transaction.date.toISOString(),
        amount: transaction.amount,
        type: transaction.type,
        notes: transaction.notes || null,
        month: transaction.month,
      } as any, { onConflict: 'id' });

    if (error) throw error;
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // =============================================
  // SAVINGS GOALS
  // =============================================

  async getAllSavingsGoals(): Promise<SavingsGoal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching savings goals:', error);
      return [];
    }

    if (!data) return [];

    return data.map((goal: SavingsGoalRow) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: Number(goal.target_amount),
      currentAmount: Number(goal.current_amount),
      monthlyContribution: Number(goal.monthly_contribution),
      createdAt: new Date(goal.created_at),
    }));
  },

  async saveSavingsGoal(goal: SavingsGoal): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('savings_goals')
      .upsert({
        id: goal.id,
        user_id: user.id,
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        monthly_contribution: goal.monthlyContribution,
      } as any, { onConflict: 'id' });

    if (error) throw error;
  },

  async deleteSavingsGoal(id: string): Promise<void> {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // =============================================
  // IPP ACCOUNT
  // =============================================

  async getIPPAccount(): Promise<IPPAccount | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('ipp_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      console.error('Error fetching IPP account:', error);
      return null;
    }

    if (!data) return null;

    const ippData = data as IPPAccountRow;

    return {
      id: ippData.id,
      currentBalance: Number(ippData.current_balance),
      monthlyContribution: Number(ippData.monthly_contribution),
      totalContributions: Number(ippData.total_contributions),
      taxReliefRate: Number(ippData.tax_relief_rate),
      realizedValue: Number(ippData.realized_value),
      lastUpdated: new Date(ippData.last_updated),
    };
  },

  async saveIPPAccount(account: IPPAccount): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('ipp_accounts')
      .upsert({
        id: account.id,
        user_id: user.id,
        current_balance: account.currentBalance,
        monthly_contribution: account.monthlyContribution,
        total_contributions: account.totalContributions,
        tax_relief_rate: account.taxReliefRate,
        realized_value: account.realizedValue,
        last_updated: new Date().toISOString(),
      } as any, { onConflict: 'id' });

    if (error) throw error;
  },

  // =============================================
  // ASSETS
  // =============================================

  async getAllAssets(): Promise<Asset[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching assets:', error);
      return [];
    }

    if (!data) return [];

    return data.map((asset: AssetRow) => ({
      id: asset.id,
      name: asset.name,
      amount: Number(asset.amount),
      type: asset.type as 'asset' | 'liability',
      category: asset.category,
      lastUpdated: new Date(asset.last_updated),
    }));
  },

  async saveAsset(asset: Asset): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('assets')
      .upsert({
        id: asset.id,
        user_id: user.id,
        name: asset.name,
        amount: asset.amount,
        type: asset.type,
        category: asset.category,
        last_updated: new Date().toISOString(),
      } as any, { onConflict: 'id' });

    if (error) throw error;
  },

  async deleteAsset(id: string): Promise<void> {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // =============================================
  // MONTHLY SNAPSHOTS
  // =============================================

  async getMonthlySnapshot(month: string): Promise<MonthlySnapshot | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('monthly_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching monthly snapshot:', error);
      return null;
    }

    if (!data) return null;

    const snapData = data as MonthlySnapshotRow;

    return {
      id: snapData.id,
      month: snapData.month,
      income: Number(snapData.income),
      totalExpenses: Number(snapData.total_expenses),
      totalSavings: Number(snapData.total_savings),
      ippContributions: Number(snapData.ipp_contributions),
      netWorth: Number(snapData.net_worth),
      createdAt: new Date(snapData.created_at),
    };
  },

  async getAllMonthlySnapshots(): Promise<MonthlySnapshot[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('monthly_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('month', { ascending: true });

    if (error) {
      console.error('Error fetching monthly snapshots:', error);
      return [];
    }

    if (!data) return [];

    return data.map((snap: MonthlySnapshotRow) => ({
      id: snap.id,
      month: snap.month,
      income: Number(snap.income),
      totalExpenses: Number(snap.total_expenses),
      totalSavings: Number(snap.total_savings),
      ippContributions: Number(snap.ipp_contributions),
      netWorth: Number(snap.net_worth),
      createdAt: new Date(snap.created_at),
    }));
  },

  async saveMonthlySnapshot(snapshot: MonthlySnapshot): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('monthly_snapshots')
      .upsert({
        id: snapshot.id,
        user_id: user.id,
        month: snapshot.month,
        income: snapshot.income,
        total_expenses: snapshot.totalExpenses,
        total_savings: snapshot.totalSavings,
        ipp_contributions: snapshot.ippContributions,
        net_worth: snapshot.netWorth,
      } as any, { onConflict: 'id' });

    if (error) throw error;
  },

  // =============================================
  // ADDITIONAL INCOME
  // =============================================

  async getAdditionalIncomeByMonth(month: string): Promise<AdditionalIncome[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('additional_income')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('deleted', false)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching additional income:', error);
      return [];
    }

    if (!data) return [];

    return data.map((inc: AdditionalIncomeRow) => ({
      id: inc.id,
      date: new Date(inc.date),
      amount: Number(inc.amount),
      source: inc.source,
      description: inc.description || undefined,
      month: inc.month,
      deleted: inc.deleted,
    }));
  },

  async getAllAdditionalIncome(): Promise<AdditionalIncome[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('additional_income')
      .select('*')
      .eq('user_id', user.id)
      .eq('deleted', false)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching all additional income:', error);
      return [];
    }

    if (!data) return [];

    return data.map((inc: AdditionalIncomeRow) => ({
      id: inc.id,
      date: new Date(inc.date),
      amount: Number(inc.amount),
      source: inc.source,
      description: inc.description || undefined,
      month: inc.month,
      deleted: inc.deleted,
    }));
  },

  async saveAdditionalIncome(income: AdditionalIncome): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('additional_income')
      .upsert({
        id: income.id,
        user_id: user.id,
        date: income.date.toISOString(),
        amount: income.amount,
        source: income.source,
        description: income.description || null,
        month: income.month,
        deleted: income.deleted || false,
      } as any, { onConflict: 'id' });

    if (error) throw error;
  },

  async deleteAdditionalIncome(id: string): Promise<void> {
    const { error } = await supabase
      .from('additional_income')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // =============================================
  // INVESTMENTS
  // =============================================

  async getAllInvestments(): Promise<Investment[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching investments:', error);
      return [];
    }

    if (!data) return [];

    return data.map((inv: InvestmentRow) => ({
      id: inv.id,
      name: inv.name,
      type: inv.type as Investment['type'],
      units: Number(inv.units),
      purchasePrice: Number(inv.purchase_price),
      currentPrice: Number(inv.current_price),
      purchaseDate: new Date(inv.purchase_date),
      lastUpdated: new Date(inv.last_updated),
      notes: inv.notes || undefined,
    }));
  },

  async saveInvestment(investment: Investment): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('investments')
      .upsert({
        id: investment.id,
        user_id: user.id,
        name: investment.name,
        type: investment.type,
        units: investment.units,
        purchase_price: investment.purchasePrice,
        current_price: investment.currentPrice,
        purchase_date: investment.purchaseDate.toISOString(),
        last_updated: new Date().toISOString(),
        notes: investment.notes || null,
      } as any, { onConflict: 'id' });

    if (error) throw error;
  },

  async deleteInvestment(id: string): Promise<void> {
    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // =============================================
  // CLEAR ALL DATA (for migration/testing)
  // =============================================

  async clearAllData(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Delete in correct order due to foreign keys
    const tables = [
      'dividend_payments',
      'investments',
      'additional_income',
      'monthly_snapshots',
      'assets',
      'ipp_accounts',
      'savings_goals',
      'transactions',
      'budget_categories',
    ];

    for (const table of tables) {
      await supabase.from(table).delete().eq('user_id', user.id);
    }
  },
};

// Helper to generate UUID (client-side)
export function generateId(): string {
  return crypto.randomUUID();
}