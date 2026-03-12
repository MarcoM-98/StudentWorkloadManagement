import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  isOverloaded: boolean;
  totalTime: number;
}

export default function DashboardLayout({ children, isOverloaded, totalTime }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation / Stats Bar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">GitYourWorkDone</h1>
        
        <div className="flex gap-6 items-center">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Workload</p>
            <p className="text-lg font-mono text-blue-600">{totalTime} mins</p>
          </div>

          {/* Overload Indicator - Changes color based on logic */}
          <div className={`px-4 py-2 rounded-full border ${
            isOverloaded 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
          // insert rest of code to show main dashboard , list, etc
  );
}