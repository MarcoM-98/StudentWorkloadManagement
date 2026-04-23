"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doSignOut } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    await doSignOut();
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
     {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 hidden md:block">
        <div className="p-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">GitYourWorkDone</h2>
        </div>
        <nav className="px-4 mt-6 space-y-2">
          <Link
            href="/"
            className={`sidebar-btn ${pathname === '/' ? 'sidebar-btn-active' : 'sidebar-btn-inactive'}`}
          >
            <span>Dashboard</span>
          </Link>

          <Link
            href="/assignments"
            className={`sidebar-btn ${pathname === '/assignments' ? 'sidebar-btn-active' : 'sidebar-btn-inactive'}`}
          >
            <span>Assignments</span>
          </Link>

          <Link
            href="/canvas"
            className={`sidebar-btn ${pathname === '/canvas' ? 'sidebar-btn-active' : 'sidebar-btn-inactive'}`}
          >
            <span>Canvas Login</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left sidebar-btn sidebar-btn-inactive"
          >
            <span>Logout</span>
          </button>
        </nav>
      </aside>

         {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Overview</h1>
        </header>

        {/* Page Content goes inside this main tag such as the assignments list */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-50 dark:bg-zinc-900 p-6">
          {children} 
        </main>

      </div>
    </div>
  );
}