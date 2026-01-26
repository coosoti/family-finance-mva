// Budget allocation percentages (50/30/20 rule adapted)
export const BUDGET_ALLOCATION = {
    needs: 0.50,    // 50% - Essential expenses
    wants: 0.30,    // 30% - Lifestyle & discretionary
    savings: 0.15,  // 15% - Emergency fund, education
    growth: 0.05,   // 5% - Pension (IPP), investments
  } as const;
  
  // IPP (Individual Pension Plan) settings
  export const IPP_SETTINGS = {
    taxReliefRate: 0.30, // 30% tax relief in Kenya
    defaultContributionRate: 0.05, // 5% of income
  } as const;
  
  // Default budget categories based on family structure
  export const DEFAULT_CATEGORIES = {
    needs: [
      { name: 'Rent/Mortgage', priority: 1 },
      { name: 'Food & Groceries', priority: 2 },
      { name: 'Transport', priority: 3 },
      { name: 'Utilities (Water, Electricity)', priority: 4 },
      { name: 'Insurance', priority: 5 },
    ],
    needsWithDependents: [
      { name: 'School Fees', priority: 6 },
      { name: 'Medical & Healthcare', priority: 7 },
    ],
    wants: [
      { name: 'Entertainment', priority: 1 },
      { name: 'Dining Out', priority: 2 },
      { name: 'Personal Care', priority: 3 },
      { name: 'Hobbies & Recreation', priority: 4 },
    ],
    savings: [
      { name: 'Emergency Fund', priority: 1 },
    ],
    savingsWithDependents: [
      { name: "Children's Education Fund", priority: 2 },
    ],
    growth: [
      { name: 'Pension (IPP)', priority: 1 },
    ],
  } as const;
  
  // Suggested budget amounts based on income brackets (KES)
  export const INCOME_BRACKETS = [
    { min: 0, max: 50000, label: 'Low Income' },
    { min: 50001, max: 100000, label: 'Middle Income' },
    { min: 100001, max: 200000, label: 'Upper Middle Income' },
    { min: 200001, max: Infinity, label: 'High Income' },
  ] as const;
  
  // Category allocation suggestions by income level
  export const CATEGORY_ALLOCATION_SUGGESTIONS = {
    needs: {
      'Rent/Mortgage': { low: 0.35, middle: 0.30, upper: 0.25, high: 0.20 },
      'Food & Groceries': { low: 0.25, middle: 0.20, upper: 0.15, high: 0.12 },
      'Transport': { low: 0.15, middle: 0.15, upper: 0.12, high: 0.10 },
      'Utilities (Water, Electricity)': { low: 0.10, middle: 0.10, upper: 0.08, high: 0.06 },
      'Insurance': { low: 0.05, middle: 0.08, upper: 0.10, high: 0.12 },
      'School Fees': { low: 0.10, middle: 0.15, upper: 0.20, high: 0.25 },
      'Medical & Healthcare': { low: 0.05, middle: 0.07, upper: 0.10, high: 0.15 },
    },
    wants: {
      'Entertainment': { low: 0.30, middle: 0.30, upper: 0.25, high: 0.25 },
      'Dining Out': { low: 0.30, middle: 0.35, upper: 0.35, high: 0.35 },
      'Personal Care': { low: 0.20, middle: 0.20, upper: 0.20, high: 0.20 },
      'Hobbies & Recreation': { low: 0.20, middle: 0.15, upper: 0.20, high: 0.20 },
    },
    savings: {
      'Emergency Fund': { low: 0.60, middle: 0.55, upper: 0.50, high: 0.50 },
      "Children's Education Fund": { low: 0.40, middle: 0.45, upper: 0.50, high: 0.50 },
    },
  } as const;