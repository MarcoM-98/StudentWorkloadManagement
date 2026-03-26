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
export default function Home() {
  return (
    // This wraps the page in the Sidebar and Header created in SCRUM-54
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-black p-8 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
            Welcome to GitYourWorkDone
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            The dashboard skeleton is successfully up and running! 
            <br /><br />
            (SCRUM-53 components and SCRUM-56 logic will be merged into this space later when i get time).
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}