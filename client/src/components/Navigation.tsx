import { useState } from 'react';
import { BookOpen, Video, LayoutDashboard, Settings } from 'lucide-react';
import { useWallet } from './WalletProvider';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { address, isConnected } = useWallet();
  
  // Mock user object for now
  const user = {
    id: address,
    isAdmin: address ? address.toLowerCase().endsWith('000') : false, // Simple admin check
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'live', label: 'Live Sessions', icon: Video },
    ...(user?.isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : []),
  ];

  if (!isConnected) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-slate-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center space-x-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === item.id
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}