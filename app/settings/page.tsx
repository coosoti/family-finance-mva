'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, DollarSign, Users, Save } from 'lucide-react';
import { db } from '@/lib/db';
import { UserProfile } from '@/lib/types';
import { generateBudgetCategories } from '@/lib/budget-generator';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [dependents, setDependents] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userProfile = await db.getUserProfile();
      if (!userProfile) {
        router.push('/setup');
        return;
      }

      setProfile(userProfile);
      setName(userProfile.name);
      setMonthlyIncome(userProfile.monthlyIncome.toString());
      setDependents(userProfile.dependents.toString());
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const income = parseFloat(monthlyIncome);
    if (!income || income <= 0) {
      setError('Valid income is required');
      return;
    }

    const deps = parseInt(dependents);
    if (isNaN(deps) || deps < 0) {
      setError('Valid number of dependents is required');
      return;
    }

    if (!profile) return;

    setIsSaving(true);

    try {
      const updatedProfile: UserProfile = {
        ...profile,
        name: name.trim(),
        monthlyIncome: income,
        dependents: deps,
        updatedAt: new Date(),
      };

      await db.saveUserProfile(updatedProfile);

      // Check if major changes occurred
      const incomeChanged = Math.abs(income - profile.monthlyIncome) > profile.monthlyIncome * 0.1;
      const dependentsChanged = deps !== profile.dependents;

      if (incomeChanged || dependentsChanged) {
        const shouldRegenerate = confirm(
          'Your income or dependents changed significantly. Would you like to regenerate your budget categories to match the new amounts?\n\nNote: This will update budget allocations but keep your existing spending history.'
        );

        if (shouldRegenerate) {
          const newCategories = generateBudgetCategories(updatedProfile);
          const existingCategories = await db.getBudgetCategories();
          
          for (const cat of existingCategories) {
            await db.deleteBudgetCategory(cat.id);
          }

          for (const cat of newCategories) {
            await db.saveBudgetCategory(cat);
          }
        }
      }

      setSuccessMessage('✅ Profile updated successfully!');
      setProfile(updatedProfile);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-blue-600 p-6 text-white">
        <button onClick={() => router.push('/dashboard')} className="mb-4 flex items-center gap-2">
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <h1 className="mb-1 text-2xl font-bold">Profile Settings</h1>
        <p className="text-blue-100">Update your personal information</p>
      </div>

      {/* Content */}
      <div className="p-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Name */}
          <div className="card">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Your Name</h3>
                <p className="text-sm text-gray-600">How you want to be addressed</p>
              </div>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g. John Mwangi"
            />
          </div>

          {/* Monthly Income */}
          <div className="card">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <DollarSign size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Monthly Salary</h3>
                <p className="text-sm text-gray-600">Your regular income after tax</p>
              </div>
              {profile && parseFloat(monthlyIncome) !== profile.monthlyIncome && (
                <span className="text-xs font-medium text-orange-600">Changed</span>
              )}
            </div>

            <input
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              className="input"
              placeholder="e.g. 85000"
              min="10000"
              step="1000"
            />

            <div className="mt-3 rounded-lg bg-blue-50 p-3">
              <p className="text-xs text-blue-800">
                <strong>💡 Current:</strong> KES {profile?.monthlyIncome.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-blue-700">
                This is your base salary only. Track side income separately in the Budget screen.
              </p>
            </div>
          </div>

          {/* Dependents */}
          <div className="card">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Users size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Dependents</h3>
                <p className="text-sm text-gray-600">Children and other dependents</p>
              </div>
              {profile && parseInt(dependents) !== profile.dependents && (
                <span className="text-xs font-medium text-orange-600">Changed</span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDependents(num.toString())}
                  className={`rounded-lg border-2 p-3 font-semibold transition-all ${
                    dependents === num.toString()
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="mt-3 rounded-lg bg-purple-50 p-3">
              <p className="text-xs text-purple-800">
                <strong>Current:</strong> {profile?.dependents} {profile?.dependents === 1 ? 'dependent' : 'dependents'}
              </p>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg bg-green-50 border-2 border-green-200 p-4 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 rounded-lg border-2 border-gray-300 bg-white p-4 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex flex-1 items-center justify-center gap-2"
            >
              <Save size={20} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Account Info */}
        {profile && (
          <div className="card mt-6">
            <h3 className="mb-3 font-semibold text-gray-900">Account Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Created:</strong>{' '}
                {new Date(profile.createdAt).toLocaleDateString('en-KE', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p>
                <strong>Last Updated:</strong>{' '}
                {new Date(profile.updatedAt).toLocaleDateString('en-KE', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}