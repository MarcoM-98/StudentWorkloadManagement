"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AssignmentCard from "@/components/AssignmentCard";
import OverloadBanner from "@/components/OverloadBanner";

// We define the shape of the data thats going to show
type Task = {
  _id: string;
  title: string;
  dueDate: string;
  priorityPercentage: number;
};
export default function Home() {
  // 1. The "Memory" (State)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Hardcoding to see if it works , we'll fetch it from the DB later ( on my next scrum )
  const isOverloaded = false; 

  // 2. This logic will simulate a database fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setTasks([
        { _id: "1", title: "Complete Phase 1 Scanner", dueDate: "2026-03-22", priorityPercentage: 85 },
        { _id: "2", title: "Study for CS Exam", dueDate: "2026-03-25", priorityPercentage: 60 },
        { _id: "3", title: "Read Chapter 4", dueDate: "2026-03-26", priorityPercentage: 30 }
      ]);
      setLoading(false); 
    }, 1500); // 1.5 second loading delay to make sure it fetches the files

    return () => clearTimeout(timer);
  }, []);
  return (
    // This wraps the page in the Sidebar and Header created in SCRUM-54
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <OverloadBanner />
        
        <div className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Current Tasks</h2>
            
            {/* overloaded badge! */}
            <div className={`px-4 py-1 text-sm rounded-full border font-semibold ${
              isOverloaded 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              {isOverloaded ? 'Overloaded' : 'On Track'}
            </div>
          </div>
          
          {/* The Loading State & Task Loop */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <p className="text-zinc-500 animate-pulse text-lg">Loading your schedule please wait...</p>
              </div>
            ) : tasks.length > 0 ? (
              tasks.map((task) => (
                <AssignmentCard 
                  key={task._id}
                  title={task.title} 
                  dueDate={task.dueDate} 
                  priorityPercentage={task.priorityPercentage} 
                />
              ))
            ) : (
              <div className="text-center py-20 bg-white dark:bg-zinc-800 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
                <p className="text-zinc-500">You are all caught up! Enjoy your day.</p> // show caught up message if no work left
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}