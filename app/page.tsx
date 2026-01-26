'use client';

import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function Home() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
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
            ✅ Feature 1: Setup Complete
          </h2>
          
          <FeatureItem text="Next.js 16 with App Router" />
          <FeatureItem text="Tailwind CSS v4" />
          <FeatureItem text="PWA manifest configured" />
          <FeatureItem text="Offline-first architecture" />
          <FeatureItem text="Installable on phone & desktop" />
          
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">
              <strong>Next:</strong> Feature 2 - Data Layer
            </p>
          </div>
        </div>

        {/* Development Info */}
        <div className="space-y-1 text-xs text-gray-500">
          <p>Build: Static Export</p>
          <p>Storage: IndexedDB (Coming in Feature 2)</p>
          <p>Deploy: Vercel</p>
        </div>
      </div>
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