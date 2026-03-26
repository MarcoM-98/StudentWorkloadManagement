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
    // asynchronous function to handle the internet traffic since react does not let you use the useEffect as a asyn function
    // so we just create it inside instead.
    async function fetchAssignments() {
      try {
        //  tries to connect to the server to try and get the assignments
        const response = await fetch('/api/assignments'); 
        
        //  Check if the server answered correctly, we can change the error message to something else
        if (!response.ok) {
          throw new Error("Failed to fetch data from the server");
        }
        // converts the server's answer into data that React can read
        const data = await response.json();
        
        // Save that real data into our dashboard's memory
        setTasks(data);

   } catch (error) {
        // If anything goes wrong, log it so we can debug in future sprint
        console.error("Error loading tasks:", error);
      } finally {
        //  success or fail , turn off the loading text, we can try to change this later as well.
        setLoading(false);
      }
    }

    // run the function we just created
    fetchAssignments();
  }, []);
  return (
    // This wraps the page in the Sidebar and Header created in SCRUM-54
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <OverloadBanner /> // overload banner warning
        
        <div className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Current Tasks</h2>
            
            {/* overloaded badge! */}
            <div className={`px-4 py-1 text-sm rounded-full border font-semibold ${ // tailwind classes to switch between
                                                                                // red if true and green if false, below
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
                <AssignmentCard // if it finds work/assignments get their info
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