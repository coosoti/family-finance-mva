'use client';

import { useRouter, usePathname } from 'next/navigation';
import { DollarSign, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import type React from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: (pathname: string | null) => boolean;
}

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const items: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <DollarSign size={20} />,
      isActive: (path) => path === '/' || path === '/dashboard',
    },
    {
      href: '/budget',
      label: 'Budget',
      icon: <PiggyBank size={20} />,
      isActive: (path) => !!path && path.startsWith('/budget'),
    },
    {
      href: '/savings',
      label: 'Savings',
      icon: <TrendingUp size={20} />,
      isActive: (path) => !!path && path.startsWith('/savings'),
    },
    {
      href: '/networth',
      label: 'Net Worth',
      icon: <Wallet size={20} />,
      isActive: (path) => !!path && path.startsWith('/networth'),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-gray-200 bg-white p-2">
      <div className="flex justify-around">
        {items.map((item) => {
          const active = item.isActive(pathname);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center px-4 py-2 ${
                active ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {item.icon}
              <span className="mt-1 text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

