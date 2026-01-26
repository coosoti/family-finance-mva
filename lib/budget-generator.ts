import { BudgetCategory, UserProfile } from './types';
import { 
  BUDGET_ALLOCATION, 
  DEFAULT_CATEGORIES, 
  INCOME_BRACKETS,
  CATEGORY_ALLOCATION_SUGGESTIONS 
} from './constants';
import { generateId } from './db';

type IncomeBracket = 'low' | 'middle' | 'upper' | 'high';

function getIncomeBracket(income: number): IncomeBracket {
  if (income <= 50000) return 'low';
  if (income <= 100000) return 'middle';
  if (income <= 200000) return 'upper';
  return 'high';
}

export function generateBudgetCategories(profile: UserProfile): BudgetCategory[] {
  const { monthlyIncome, dependents } = profile;
  const categories: BudgetCategory[] = [];
  const bracket = getIncomeBracket(monthlyIncome);

  // Calculate total budget per type
  const needsBudget = monthlyIncome * BUDGET_ALLOCATION.needs;
  const wantsBudget = monthlyIncome * BUDGET_ALLOCATION.wants;
  const savingsBudget = monthlyIncome * BUDGET_ALLOCATION.savings;
  const growthBudget = monthlyIncome * BUDGET_ALLOCATION.growth;

  // Generate NEEDS categories
  const needsCategories: Array<{ readonly name: string; readonly priority: number }> = [...DEFAULT_CATEGORIES.needs];
  if (dependents > 0) {
    needsCategories.push(...DEFAULT_CATEGORIES.needsWithDependents);
  }

  let needsTotal = 0;
  needsCategories.forEach((cat) => {
    const allocation = CATEGORY_ALLOCATION_SUGGESTIONS.needs[cat.name as keyof typeof CATEGORY_ALLOCATION_SUGGESTIONS.needs];
    const amount = allocation ? Math.round(needsBudget * allocation[bracket]) : 0;
    needsTotal += amount;
    
    categories.push({
      id: generateId(),
      name: cat.name,
      budgetedAmount: amount,
      type: 'needs',
      isDefault: true,
    });
  });

  // Adjust if total doesn't match (rounding errors)
  if (needsTotal !== needsBudget && categories.length > 0) {
    categories[0].budgetedAmount += (needsBudget - needsTotal);
  }

  // Generate WANTS categories
  let wantsTotal = 0;
  DEFAULT_CATEGORIES.wants.forEach((cat) => {
    const allocation = CATEGORY_ALLOCATION_SUGGESTIONS.wants[cat.name as keyof typeof CATEGORY_ALLOCATION_SUGGESTIONS.wants];
    const amount = allocation ? Math.round(wantsBudget * allocation[bracket]) : 0;
    wantsTotal += amount;
    
    categories.push({
      id: generateId(),
      name: cat.name,
      budgetedAmount: amount,
      type: 'wants',
      isDefault: true,
    });
  });

  if (wantsTotal !== wantsBudget && categories.length > 0) {
    const wantsIndex = categories.findIndex(c => c.type === 'wants');
    if (wantsIndex !== -1) {
      categories[wantsIndex].budgetedAmount += (wantsBudget - wantsTotal);
    }
  }

  // Generate SAVINGS categories
  const savingsCategories: Array<{ readonly name: string; readonly priority: number }> = [...DEFAULT_CATEGORIES.savings];
  if (dependents > 0) {
    savingsCategories.push(...DEFAULT_CATEGORIES.savingsWithDependents);
  }

  let savingsTotal = 0;
  savingsCategories.forEach((cat) => {
    const allocation = CATEGORY_ALLOCATION_SUGGESTIONS.savings[cat.name as keyof typeof CATEGORY_ALLOCATION_SUGGESTIONS.savings];
    const amount = allocation ? Math.round(savingsBudget * allocation[bracket]) : 0;
    savingsTotal += amount;
    
    categories.push({
      id: generateId(),
      name: cat.name,
      budgetedAmount: amount,
      type: 'savings',
      isDefault: true,
    });
  });

  if (savingsTotal !== savingsBudget && categories.length > 0) {
    const savingsIndex = categories.findIndex(c => c.type === 'savings');
    if (savingsIndex !== -1) {
      categories[savingsIndex].budgetedAmount += (savingsBudget - savingsTotal);
    }
  }

  // Generate GROWTH categories
  DEFAULT_CATEGORIES.growth.forEach((cat) => {
    categories.push({
      id: generateId(),
      name: cat.name,
      budgetedAmount: Math.round(growthBudget),
      type: 'growth',
      isDefault: true,
    });
  });

  return categories;
}

export function getBudgetSummary(categories: BudgetCategory[]) {
  return {
    needs: categories.filter(c => c.type === 'needs').reduce((sum, c) => sum + c.budgetedAmount, 0),
    wants: categories.filter(c => c.type === 'wants').reduce((sum, c) => sum + c.budgetedAmount, 0),
    savings: categories.filter(c => c.type === 'savings').reduce((sum, c) => sum + c.budgetedAmount, 0),
    growth: categories.filter(c => c.type === 'growth').reduce((sum, c) => sum + c.budgetedAmount, 0),
  };
}