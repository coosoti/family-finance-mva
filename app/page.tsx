'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { seedDemoData, resetAllData } from '@/lib/seed-data';
import { db } from '@/lib/db';

export default function Home() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
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
    
    // Check if demo data exists
    checkForData();
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const checkForData = async () => {
    const profile = await db.getUserProfile();
    setHasData(!!profile);
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

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      await checkForData();
    } catch (error) {
      console.error('Error seeding data:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Are you sure? This will delete all data.')) return;
    setIsSeeding(true);
    try {
      await resetAllData();
      await checkForData();
    } catch (error) {
      console.error('Error resetting data:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="space-y-6 text-center">
        {/* Logo */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-600">
          <span className="text-4xl font-bold text-white">FF</span>
        </div>

        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Family Finance
          </h1>
          <p className="text-gray-600">
            Budget, Save, and Grow Your Wealth
          </p>
        </div>

        {/* Installation Status */}
        <div className="space-y-4">
          {isInstalled ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="font-medium">App Installed!</span>
            </div>
          ) : deferredPrompt ? (
            <button onClick={handleInstall} className="btn-primary">
              Install App
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              Visit on mobile to install
            </p>
          )}
        </div>

        {/* Feature Checklist */}
        <div className="card mt-8 space-y-3 text-left">
          <h2 className="mb-4 font-semibold text-gray-900">
            ✅ Features Complete
          </h2>
          
          <FeatureItem text="Next.js 16 with App Router" complete />
          <FeatureItem text="Tailwind CSS v4" complete />
          <FeatureItem text="PWA manifest configured" complete />
          <FeatureItem text="IndexedDB data layer" complete />
          <FeatureItem text="Budget generation logic" complete />
          <FeatureItem text="Family-aware defaults" complete />
          
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">
              <strong>Progress:</strong> 2/8 Features Complete
            </p>
          </div>
        </div>

        {/* Data Controls */}
        <div className="card space-y-3 text-left">
          <h3 className="font-semibold text-gray-900">Data Controls</h3>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Demo data:</span>
            <span className={`text-sm font-medium ${hasData ? 'text-green-600' : 'text-gray-400'}`}>
              {hasData ? 'Loaded' : 'Not loaded'}
            </span>
          </div>

          <div className="space-y-2">
            {!hasData && (
              <button
                onClick={handleSeedData}
                disabled={isSeeding}
                className="btn-primary"
              >
                {isSeeding ? 'Loading...' : 'Load Demo Data'}
              </button>
            )}
            
            {hasData && (
              <button
                onClick={handleResetData}
                disabled={isSeeding}
                className="w-full rounded-lg border-2 border-red-600 bg-white p-3 font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw size={16} />
                  {isSeeding ? 'Resetting...' : 'Reset All Data'}
                </div>
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Load demo data to test features. Open DevTools → Application → IndexedDB to inspect.
          </p>
        </div>

        {/* Development Info */}
        <div className="space-y-1 text-xs text-gray-500">
          <p>Build: Static Export</p>
          <p>Storage: IndexedDB</p>
          <p>Deploy: Vercel</p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text, complete = true }: { text: string; complete?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${complete ? 'bg-green-500' : 'bg-gray-300'}`} />
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  );
}