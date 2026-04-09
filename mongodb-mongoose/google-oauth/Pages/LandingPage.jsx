import React from 'react';

export function LandingPage() {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="flex-1 flex flex-col justify-center items-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8">Welcome to GitYourWorkDone</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">Sign in to manage your assignments</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Sign in with Google
        </button>
      </div>
    </div>
  );
}