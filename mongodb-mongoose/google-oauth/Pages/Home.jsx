import React from 'react';

export function Home() {
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

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6">
                    <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Overview</h1>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-50 dark:bg-zinc-900 p-6">
                    <h2 className="text-2xl font-bold mb-4">Your Assignments</h2>
                    <p>Welcome to your dashboard. Here you can manage your assignments.</p>
                </main>
            </div>
        </div>
    );
}