"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AssignmentCard from "@/components/AssignmentCard";
import OverloadBanner from "@/components/OverloadBanner";
import { suggestNewSchedule } from "@/lib/rescheduler";

// We define the shape of the data thats going to show
type Task = {
  _id: string;
  title: string;
  dueDate: string;
  priority: string;
  customPercentage?: number | null; // ? optional it may exist or not, also user may override the percentage to a custom one
  id:number;
  duration:number;
};
export default function Home() {
  // 1. The "Memory" (State)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  

  const isOverloaded = false; 

  // 2. This logic will simulate a database fetch
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
    const calculatePriority = (priorityWord: string, customNumber?: number | null) => {
    if (customNumber !== null && customNumber !== undefined) { // If the user typed a custom override, always use it
        return customNumber; 
    } 
    // if notusing custom then keep using this if they have those words set
      if (priorityWord === 'IMMEDIATE') return 100;
      if (priorityWord === 'medium') return 50;
      if (priorityWord === 'low') return 20;
      return 0; // fallback just in case
    };

   //  const handleAcceptSuggestion = async (taskId: string, newDate: string) => {
     // try {
       // const response = await fetch(`/api/assignments/${taskId}`, { //send a PATCH request to API route/mongodb because we want to suggest a new date
       //   method: 'PATCH',
       //   headers: { 'Content-Type': 'application/json' },
       //   body: JSON.stringify({ dueDate: newDate }), // We overwrite the old date with the suggestion
     //   });
     //   if (response.ok) {
      //    fetchAssignments(); // Refresh the list so the UI shows the updated official date
        
       //   setScheduleSuggestions(prev => prev.filter(s => s._id !== taskId));// Clear the suggestion for this specific task since it's now the "official" date/ new date
     //   }
    //  } catch (error) {
    //    console.error("Failed to accept suggestion:", error);
   //   }
  //  };

  const [scheduleSuggestions, setScheduleSuggestions] = useState<any[]>([]);//Logic to calculate and show suggestions locally while we wait for the uploadForm.jsx to connect to mongodb

  const handleOptimizeSchedule = () => {
    
    const results = suggestNewSchedule(tasks, 120);//  Run the math/reschedule engine
    
    // save the results to the state to show them on screen
    // We are NOT saving to the database yet till the uploadform file is fixed :(
    setScheduleSuggestions(results);
    
    console.log("Optimization calculated successfully!");
  };
    // run the function we just created
   useEffect(() => { fetchAssignments();
  }, []);
  return (
    // This wraps the page in the Sidebar and Header created in SCRUM-54
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <OverloadBanner /> {/* overload banner warning*/}
        
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

              {tasks.map((task) => { // chang ( to { with a return( because it needs to know which suggestion belonged to which task before rendering the card.
                const suggestion = scheduleSuggestions.find(s => s._id === (task._id?.toString() || task._id));
                return(
                <AssignmentCard // if it finds work/assignments get their info
                  key={task._id}
                  id={task._id?.toString()|| task._id} // pass the id
                  title={task.title} 
                  dueDate={task.dueDate} 
                  duration={task.duration || 0} // Pass the duration
                  priorityPercentage={calculatePriority(task.priority, task.customPercentage)} 
                  priorityWord={task.priority} 
                  customPercentage={task.customPercentage}
                  onUpdate={fetchAssignments} // Pass the refresh function
                  suggestedDate={suggestion?.suggestedDate}
                />
                );
              })}
            ) : (
              <div className="text-center py-20 bg-white dark:bg-zinc-800 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
                <p className="text-zinc-500">You are all caught up! Enjoy your day.</p> {/* show caught up message if no work left*/}
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}