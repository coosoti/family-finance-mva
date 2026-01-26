import { db, generateId } from './db';
import { generateBudgetCategories } from './budget-generator';
import { UserProfile, SavingsGoal, IPPAccount } from './types';
import { IPP_SETTINGS } from './constants';

export async function seedDemoData() {
  // Check if data already exists
  const existingProfile = await db.getUserProfile();
  if (existingProfile) {
    console.log('Demo data already exists. Skipping seed.');
    return;
  }

  // Create demo user profile
  const demoProfile: UserProfile = {
    id: generateId(),
    name: 'John Mwangi',
    monthlyIncome: 85000,
    dependents: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.saveUserProfile(demoProfile);
  console.log('✅ User profile created');

  // Generate budget categories
  const categories = generateBudgetCategories(demoProfile);
  for (const category of categories) {
    await db.saveBudgetCategory(category);
  }
  console.log(`✅ ${categories.length} budget categories created`);

  // Create savings goals
  const emergencyFund: SavingsGoal = {
    id: generateId(),
    name: 'Emergency Fund',
    targetAmount: 150000,
    currentAmount: 45000,
    monthlyContribution: 7000,
    createdAt: new Date(),
  };

  const educationFund: SavingsGoal = {
    id: generateId(),
    name: "Children's Education",
    targetAmount: 500000,
    currentAmount: 68000,
    monthlyContribution: 5750,
    createdAt: new Date(),
  };

  await db.saveSavingsGoal(emergencyFund);
  await db.saveSavingsGoal(educationFund);
  console.log('✅ Savings goals created');

  // Create IPP account
  const ippContribution = Math.round(demoProfile.monthlyIncome * IPP_SETTINGS.defaultContributionRate);
  const ippAccount: IPPAccount = {
    id: generateId(),
    currentBalance: 132000,
    monthlyContribution: ippContribution,
    totalContributions: 132000,
    taxReliefRate: IPP_SETTINGS.taxReliefRate,
    realizedValue: 0,
    lastUpdated: new Date(),
  };

  await db.saveIPPAccount(ippAccount);
  console.log('✅ IPP account created');

  console.log('🎉 Demo data seeding complete!');
}

export async function resetAllData() {
  await db.clearAllData();
  console.log('🗑️ All data cleared');
}