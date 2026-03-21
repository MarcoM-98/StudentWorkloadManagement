import React from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
     {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 hidden md:block">
        <div className="p-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">GitYourWorkDone</h2>
        </div>
        <nav className="px-4 mt-6">
          <a href="#" className="block py-2 px-4 rounded bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white font-medium">Dashboard</a>
        </nav>
      </aside>

         
  );
}