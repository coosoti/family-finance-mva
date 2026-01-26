'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { db, generateId } from '@/lib/db';
import { generateBudgetCategories, getBudgetSummary } from '@/lib/budget-generator';
import { UserProfile, SavingsGoal, IPPAccount } from '@/lib/types';
import { IPP_SETTINGS } from '@/lib/constants';

type SetupStep = 1 | 2;

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    income: '',
    dependents: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    income: '',
    dependents: '',
  });

  const validateStep1 = (): boolean => {
    const newErrors = {
      name: '',
      income: '',
      dependents: '',
    };

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const income = parseFloat(formData.income);
    if (!formData.income || isNaN(income) || income <= 0) {
      newErrors.income = 'Valid income is required';
    } else if (income < 10000) {
      newErrors.income = 'Income must be at least KES 10,000';
    }

    if (formData.dependents === '') {
      newErrors.dependents = 'Please select number of dependents';
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.income && !newErrors.dependents;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // Create user profile
      const profile: UserProfile = {
        id: generateId(),
        name: formData.name.trim(),
        monthlyIncome: parseFloat(formData.income),
        dependents: parseInt(formData.dependents),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.saveUserProfile(profile);

      // Generate and save budget categories
      const categories = generateBudgetCategories(profile);
      for (const category of categories) {
        await db.saveBudgetCategory(category);
      }

      // Create default savings goals
      const emergencyFund: SavingsGoal = {
        id: generateId(),
        name: 'Emergency Fund',
        targetAmount: profile.monthlyIncome * 6, // 6 months of expenses
        currentAmount: 0,
        monthlyContribution: Math.round(profile.monthlyIncome * 0.10), // 10% of savings budget
        createdAt: new Date(),
      };

      await db.saveSavingsGoal(emergencyFund);

      // Create education fund if has dependents
      if (profile.dependents > 0) {
        const educationFund: SavingsGoal = {
          id: generateId(),
          name: "Children's Education",
          targetAmount: 500000,
          currentAmount: 0,
          monthlyContribution: Math.round(profile.monthlyIncome * 0.05),
          createdAt: new Date(),
        };

        await db.saveSavingsGoal(educationFund);
      }

      // Create IPP account
      const ippContribution = Math.round(profile.monthlyIncome * IPP_SETTINGS.defaultContributionRate);
      const ippAccount: IPPAccount = {
        id: generateId(),
        currentBalance: 0,
        monthlyContribution: ippContribution,
        totalContributions: 0,
        taxReliefRate: IPP_SETTINGS.taxReliefRate,
        realizedValue: 0,
        lastUpdated: new Date(),
      };

      await db.saveIPPAccount(ippAccount);

      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving setup data:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-md">
        {step === 1 ? (
          <Step1
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            onNext={handleNext}
          />
        ) : (
          <Step2
            formData={formData}
            onBack={() => setStep(1)}
            onComplete={handleComplete}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

// Step 1: User Information
function Step1({
  formData,
  setFormData,
  errors,
  onNext,
}: {
  formData: any;
  setFormData: any;
  errors: any;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
          <span className="text-3xl font-bold text-blue-600">FF</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Welcome!</h1>
        <p className="text-gray-600">Let's set up your family budget in under 5 minutes</p>
      </div>

      {/* Form */}
      <div className="card space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Your Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`input ${errors.name ? 'border-red-500' : ''}`}
            placeholder="e.g. John Mwangi"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Monthly Net Income (KES)
          </label>
          <input
            type="number"
            value={formData.income}
            onChange={(e) => setFormData({ ...formData, income: e.target.value })}
            className={`input ${errors.income ? 'border-red-500' : ''}`}
            placeholder="e.g. 85000"
            min="0"
            step="1000"
          />
          <p className="mt-1 text-xs text-gray-500">After tax, take-home pay</p>
          {errors.income && <p className="mt-1 text-xs text-red-600">{errors.income}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Number of Dependents
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setFormData({ ...formData, dependents: num.toString() })}
                className={`rounded-lg border-2 p-3 font-semibold transition-all ${
                  formData.dependents === num.toString()
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">Children and other dependents</p>
          {errors.dependents && <p className="mt-1 text-xs text-red-600">{errors.dependents}</p>}
        </div>
      </div>

      {/* Continue Button */}
      <button onClick={onNext} className="btn-primary flex items-center justify-center gap-2">
        Continue
        <ChevronRight size={20} />
      </button>

      {/* Progress */}
      <div className="flex justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
        <div className="h-2 w-2 rounded-full bg-gray-300"></div>
      </div>
    </div>
  );
}

// Step 2: Budget Preview
function Step2({
  formData,
  onBack,
  onComplete,
  isLoading,
}: {
  formData: any;
  onBack: () => void;
  onComplete: () => void;
  isLoading: boolean;
}) {
  const income = parseFloat(formData.income) || 0;
  const dependents = parseInt(formData.dependents) || 0;

  // Create temporary profile for preview
  const tempProfile: UserProfile = {
    id: 'temp',
    name: formData.name,
    monthlyIncome: income,
    dependents,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const categories = generateBudgetCategories(tempProfile);
  const summary = getBudgetSummary(categories);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600">
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      {/* Header */}
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Your Budget Preview</h1>
        <p className="text-gray-600">
          We've created a balanced budget based on your income. You can adjust this anytime.
        </p>
      </div>

      {/* Income Summary */}
      <div className="card">
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-600">Monthly Income</p>
          <p className="text-3xl font-bold text-gray-900">KES {income.toLocaleString()}</p>
        </div>

        <div className="space-y-3">
          <BudgetBar
            label="Needs (50%)"
            amount={summary.needs}
            color="bg-red-500"
            description="Rent, food, utilities, transport"
          />
          <BudgetBar
            label="Wants (30%)"
            amount={summary.wants}
            color="bg-yellow-500"
            description="Entertainment, dining out, hobbies"
          />
          <BudgetBar
            label="Savings (15%)"
            amount={summary.savings}
            color="bg-green-500"
            description="Emergency fund, education"
          />
          <BudgetBar
            label="Growth (5%)"
            amount={summary.growth}
            color="bg-blue-500"
            description="Pension (IPP), investments"
          />
        </div>
      </div>

      {/* Family Tip */}
      {dependents > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Family tip:</strong> With {dependents} dependent{dependents > 1 ? 's' : ''}, 
            we've included school fees and medical in your Needs, plus a Children's Education Fund 
            in your Savings.
          </p>
        </div>
      )}

      {/* Complete Button */}
      <button
        onClick={onComplete}
        disabled={isLoading}
        className="btn-primary flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            Setting up...
          </>
        ) : (
          <>
            <ChevronRight size={20} />
            Start Tracking
          </>
        )}
      </button>

      {/* Progress */}
      <div className="flex justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
      </div>
    </div>
  );
}

function BudgetBar({
  label,
  amount,
  color,
  description,
}: {
  label: string;
  amount: number;
  color: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-12 w-3 rounded ${color}`}></div>
      <div className="flex-1">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-medium text-gray-800">{label}</span>
          <span className="font-semibold text-gray-900">KES {amount.toLocaleString()}</span>
        </div>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}