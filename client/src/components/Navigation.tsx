import { useState } from 'react';
import { BookOpen, Video, LayoutDashboard, Settings, Users, TestTube, FolderOpen, Plus } from 'lucide-react';
import { useWallet } from './WalletProvider';
import { useQuery } from "@tanstack/react-query";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { address, isConnected } = useWallet();
  
  // Get user data with permissions from database
  const { data: userData } = useQuery({
    queryKey: ['/api/users', address],
    enabled: !!address && isConnected,
  });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'live', label: 'Live Sessions', icon: Video },
    ...(userData?.isInstructor ? [{ id: 'mycourses', label: 'My Courses', icon: FolderOpen }] : []),
    ...(userData?.isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : []),
    ...(userData?.isInstructor ? [{ id: 'instructor', label: 'Instructor', icon: Users }] : []),
    { id: 'test', label: 'New Course', icon: Plus },
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
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm nav-tab animate-nav-tab ${
                activeTab === item.id ? 'active' : ''
              } ${
                activeTab === item.id
                  ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
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