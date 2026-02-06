'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message || 'Failed to send reset email');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="w-full max-w-md text-center">
          <div className="card">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Check Your Email</h2>
            <p className="mb-6 text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <Link href="/login" className="btn-primary">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>

        <div className="card">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="mb-6 text-sm text-gray-600">
            Enter your email and we'll send you a reset link
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="your.email@example.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}