"use client";
import React from "react";

type Task = {
    duration?: number | string;
    dueDate?: string;
    plannedDate?: string;
};

export default function OverloadBanner({ tasks }: { tasks: Task[] }) {
    if (!tasks || tasks.length === 0) return null;

    const maxDailyMinutes = 360; // 6 hours per day limit

    //  Group all tasks into specific Daily Buckets
    const dailyBuckets: Record<string, number> = {};

    tasks.forEach(task => {
        // Find what day this is scheduled for
        const dateStr = (task.plannedDate || task.dueDate || "").split('T')[0];
        
        if (dateStr) {
            const duration = Number(task.duration) || 60; // Default to 60 mins if missing
            
            // If the bucket doesn't exist yet, create it
            if (!dailyBuckets[dateStr]) {
                dailyBuckets[dateStr] = 0;
            }
            // Add the task's time to that specific day
            dailyBuckets[dateStr] += duration;
        }
    });

    // Check each day to see if it overflows the 6-hour limit
    let totalOverloadMinutes = 0;
    let overloadedDaysCount = 0;

    Object.entries(dailyBuckets).forEach(([date, minutes]) => {
        if (minutes > maxDailyMinutes) {
            totalOverloadMinutes += (minutes - maxDailyMinutes);
            overloadedDaysCount += 1;
        }
    });

    const isOverloaded = totalOverloadMinutes > 0;

    // If no individual day is over 6 hours, hide the banner
    if (!isOverloaded) return null;

    const overloadedHours = (totalOverloadMinutes / 60).toFixed(1);

    return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-red-800 dark:text-red-300">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚠️</span>
                <h3 className="font-bold text-lg">Daily Overload Detected</h3>
            </div>
            <p className="font-semibold mb-1">
                You have {overloadedDaysCount} day{overloadedDaysCount > 1 ? 's' : ''} pushed past your 6-hour limit.
            </p>
            <div className="text-sm opacity-90">
                <p>
                    You have <span className="font-bold">{overloadedHours} excess hours</span> that need to be rescheduled.
                </p>
                <p className="mt-2 text-xs italic opacity-75">
                    Tip: Look for the red "Late Warning" or "Optimization Suggestion" boxes on your assignment cards below to shift tasks to lighter days!
                </p>
            </div>
        </div>
    );
}

