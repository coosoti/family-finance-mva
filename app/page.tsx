'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { seedDemoData } from '@/lib/seed-data';
import { db } from '@/lib/db';
import { useAuth } from '@/lib/auth/AuthContext';
import { getMigrationInstance } from '@/lib/migration/migrate-to-supabase';
import MigrationModal from '@/components/migration/MigrationModal';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        checkMigrationNeeded();
      } else {
        setIsCheckingProfile(false);
      }
    }

    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [user, authLoading]);

  const checkMigrationNeeded = async () => {
    setIsCheckingProfile(true);
    try {
      // Check if user is logged in but has no cloud data
      // and has local IndexedDB data
      const migration = getMigrationInstance();
      const hasLocal = await migration.hasLocalData();
      setHasLocalData(hasLocal);

      // For now, just check if they're logged in
      setHasProfile(!!user);
      
      if (user && hasLocal) {
        // Show migration prompt
        setShowMigrationModal(true);
      } else if (user && !hasLocal) {
        // User is logged in with no local data, go to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking migration:', error);
    } finally {
      setIsCheckingProfile(false);
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleGetStarted = () => {
    if (user) {
      router.push('/setup');
    } else {
      router.push('/signup');
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Failed to load demo data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleMigrationComplete = () => {
    setShowMigrationModal(false);
    router.push('/dashboard');
  };

  if (isCheckingProfile || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Logo */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-600">
          <span className="text-4xl font-bold text-white">FF</span>
        </div>

        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Family Finance</h1>
          <p className="text-gray-600">Budget, Save, and Grow Your Wealth</p>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-3">
          {user ? (
            // User is logged in
            <>
              <button onClick={handleGoToDashboard} className="btn-primary">
                Go to Dashboard
              </button>
              <p className="text-sm text-gray-600">
                Welcome back, {user.email}!
              </p>
            </>
          ) : (
            // User is not logged in
            <>
              <button onClick={handleGetStarted} className="btn-primary">
                Get Started
              </button>
              <p className="text-sm text-gray-600">
                Create your account and start tracking finances
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full rounded-lg border-2 border-blue-600 bg-white p-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50"
              >
                Sign In
              </button>
            </>
          )}
        </div>

        {/* Installation Status */}
        {!isInstalled && deferredPrompt && (
          <div className="space-y-4">
            <button
              onClick={handleInstall}
              className="w-full rounded-lg border-2 border-blue-600 bg-white p-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              Install App
            </button>
          </div>
        )}

        {isInstalled && (
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle size={20} />
            <span className="font-medium">App Installed!</span>
          </div>
        )}

        {/* Feature Checklist */}
        <div className="card mt-8 space-y-3 text-left">
          <h2 className="mb-4 font-semibold text-gray-900">✅ Features Complete</h2>

          <FeatureItem text="Multi-user authentication" />
          <FeatureItem text="Cloud database (Supabase)" />
          <FeatureItem text="Real-time sync" />
          <FeatureItem text="Charts & Analytics" />
          <FeatureItem text="Budget tracking" />
          <FeatureItem text="Data migration tools" />

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">
              <strong>Progress:</strong> 11/12 Features Complete
            </p>
          </div>
        </div>

        {/* Developer Tools */}
        {!user && (
          <div className="card space-y-3 text-left">
            <h3 className="font-semibold text-gray-900">Developer Tools</h3>
            <button 
              onClick={handleSeedData} 
              disabled={isSeeding} 
              className="w-full rounded-lg border-2 border-gray-300 bg-white p-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSeeding ? 'Loading...' : 'Quick Start: Load Demo Data'}
            </button>
            <p className="text-xs text-gray-500">
              Skip setup and instantly see the app with demo data
            </p>
          </div>
        )}

        {/* Development Info */}
        <div className="space-y-1 text-xs text-gray-500">
          <p>Build: Static Export + Supabase</p>
          <p>Storage: PostgreSQL (Cloud)</p>
          <p>Auth: Supabase Auth</p>
        </div>
      </div>

      {/* Migration Modal */}
      <MigrationModal
        isOpen={showMigrationModal}
        onClose={() => setShowMigrationModal(false)}
        onComplete={handleMigrationComplete}
      />
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 rounded-full bg-green-500" />
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  );
}