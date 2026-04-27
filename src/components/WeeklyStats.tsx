"use client";
import { useEffect, useState } from "react";

export default function WeeklyStats({ completedTasks = 0 }) {
  const [pulse, setPulse] = useState(false);

  // Trigger the animation whenever the number of finished assignments goes up
  useEffect(() => {
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 300);
    return () => clearTimeout(timer);
  }, [completedTasks]);

  return (
    <div className={`mb-8 transition-transform duration-300 ${pulse ? 'scale-[1.02]' : 'scale-100'}`}>
      
      {/* The Stat Card */}
      <div className="bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-8 flex flex-col items-center justify-center shadow-sm">
        <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400 mb-2">
          {completedTasks}
        </span>
        <span className="text-sm uppercase tracking-wider text-zinc-500 font-semibold">
          Tasks Completed This Week
        </span>
      </div>

    </div>
  );
}