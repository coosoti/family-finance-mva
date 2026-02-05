'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, name);
      
      if (error) {
        setError(error.message || 'Failed to create account');
      } else {
        setSuccess(true);
        // Redirect to setup after successful signup
        setTimeout(() => {
          router.push('/setup');
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        <div className="w-full max-w-md text-center">
          <div className="card">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Account Created!</h2>
            <p className="mb-4 text-gray-600">
              Welcome to Family Finance. Let's set up your budget.
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-full animate-pulse bg-green-600"></div>
            </div>
            <p className="mt-4 text-sm text-gray-500">Redirecting to setup...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-100 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-600 shadow-lg">
            <span className="text-3xl font-bold text-white">FF</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600">Start your financial journey today</p>
        </div>

        {/* Sign Up Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  placeholder="John Mwangi"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-12 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          level <= passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-gray-200'
                        }`}
                      ></div>
                    ))}
                  </div>
                  <p className={`mt-1 text-xs ${passwordStrength.textColor}`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-12 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 p-4 font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-purple-600 hover:text-purple-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}

function getPasswordStrength(password: string) {
  if (!password) {
    return { score: 0, label: '', color: 'bg-gray-200', textColor: 'text-gray-500' };
  }

  let score = 0;
  
  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Complexity
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  const normalized = Math.min(score, 4);

  const levels = [
    { label: 'Too weak', color: 'bg-red-500', textColor: 'text-red-600' },
    { label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-600' },
    { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { label: 'Good', color: 'bg-green-500', textColor: 'text-green-600' },
    { label: 'Strong', color: 'bg-green-600', textColor: 'text-green-700' },
  ];

  return { score: normalized, ...levels[normalized] };
}