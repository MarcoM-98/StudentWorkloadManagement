"use client";
import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AssignmentCard from "@/components/AssignmentCard";
import OverloadBanner from "@/components/OverloadBanner";
import ScheduleGrid from "@/components/ScheduleGrid";
import WorkloadSummary from "@/components/WorkloadSummary";
import { suggestNewSchedule } from "@/lib/rescheduler";
import DailyQuote from "@/components/DailyQuote";
import WeeklyStats from "@/components/WeeklyStats";

// We define the shape of the data thats going to show
type Task = {
  _id: string;
  title: string;
  dueDate: string;
  priority: string;
  customPercentage?: number | null; // ? optional it may exist or not, also user may override the percentage to a custom one
  id:number;
  duration:number;
  courseCode?: string; 
  keywords?: string[]; 
  isActionable?: boolean;
  completed?: boolean;
};

export default function Home() {
  // 1. The "Memory" (State)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleSuggestions, setScheduleSuggestions] = useState<any[]>([]);
  const [userSettings, setUserSettings] = useState({ university: "Texas State University", major: "Undeclared" });
  const [isSaving, setIsSaving] = useState(false);

  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const isOverloaded = false;

  // 2. This logic will simulate a database fetch
  // asynchronous function to handle the internet traffic since react does not let you use the useEffect as a asyn function
  // so we just create it inside instead.
  async function fetchAssignments() {
    try {
      //  tries to connect to the server to try and get the assignments
      const response = await fetch("/api/assignments");

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
// fetches the user saved majro (the mock file that was created in /api/settings )
    async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setUserSettings(data);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }

  // Handle dropdown selection
  async function handleProfileUpdate(newMajor: string) {
    setIsSaving(true);
    setUserSettings({ ...userSettings, major: newMajor });
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ major: newMajor })
      });
    } catch (e) { 
      console.error(e); 
    }
    setIsSaving(false);
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/assignments/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }), 
      });

      if (response.ok) {
        await fetchAssignments(); // Re-fetch to update the UI instantly
      }
    } catch (error) {
      console.error("Failed to mark task as completed:", error);
    }
  };

    const calculatePriority = (priorityWord: string, customNumber?: number | null) => {
    if (customNumber !== null && customNumber !== undefined) { // If the user typed a custom override, always use it
        return customNumber; 
    } 
    // if notusing custom then keep using this if they have those words set
    if (priorityWord === "IMMEDIATE") return 100;
    if (priorityWord === "medium") return 50;
    if (priorityWord === "low") return 20;
    return 0; // fallback just in case
  };

  const handleOptimizeSchedule = () => {
    const results = suggestNewSchedule(tasks, 300); // Run the math/reschedule engine set to 300 minutes just like on OverloadBanner
    setScheduleSuggestions(results); // save the results to the state
    console.log("Optimization calculated successfully!");
  };

  const handleAcceptSuggestion = async (taskId: string, newDate: string) => {
    try {
      const response = await fetch(`/api/assignments/${taskId}`, {
        //send a PATCH request to API route/mongodb because we want to suggest a new date
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: newDate }), // We overwrite the old date with the suggestion
      });
      if (response.ok) {
        await fetchAssignments(); // Refresh the list so the UI shows the updated official date

        setScheduleSuggestions((prev) => prev.filter((s) => s._id !== taskId)); // Clear the suggestion for this specific task since it's now the "official" date/ new date
        console.log("Database updated successfully");
      }
    } catch (error) {
      console.error("Failed to accept suggestion:", error);
    }
  };

  useEffect(() => {
  if (tasks.length > 0 && scheduleSuggestions.length === 0) { // If we have tasks but haven't calculated suggestions yet
    console.log("Automatically running rescheduler logic...");
    handleOptimizeSchedule(); // This triggers the math locally for now again, till uploadform is finally connected to mongodb
  }
}, [tasks, scheduleSuggestions]);
    // run the function we just created
   useEffect(() => { fetchAssignments();
   fetchSettings();
  }, []);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by Priority
    if (filterPriority !== "all") {
      result = result.filter(task => task.priority === filterPriority);
    }

    // Sort Logic
    result.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === "priority") {
        // High (100) > Medium (50) > Low (20)
        return calculatePriority(b.priority, b.customPercentage) - calculatePriority(a.priority, a.customPercentage);
      }
      return 0;
    });

    return result;
  }, [tasks, filterPriority, sortBy]);



  return (
    // This wraps the page in the Sidebar and Header created in SCRUM-54
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <OverloadBanner /> {/* overload banner warning*/}
        
        <DailyQuote />
        <WeeklyStats completedTasks={5} /> 


        <div className="mt-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              Schedule View
            </h2>
            <ScheduleGrid tasks={tasks} />
          </div>


        {/* choosing the major from the dropdown menu */}
        <div className={`mt-6 p-4 rounded-xl border transition-all ${userSettings.major === "Undeclared" ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" : "bg-white border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 flex flex-col md:flex-row justify-between items-center"}`}>
          <div className="mb-2 md:mb-0">
            <h2 className={`font-bold ${userSettings.major === "Undeclared" ? "text-blue-800 dark:text-blue-300 text-lg mb-2" : "text-zinc-700 dark:text-zinc-300"}`}>
              {userSettings.major === "Undeclared" ? "Personalize Your Academic Search!" : "Academic Profile"}
            </h2>
            {userSettings.major === "Undeclared" && (
              <p className="text-sm text-blue-600 dark:text-blue-400">Select your major to get personalized study links.</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={userSettings.major} 
              onChange={(e) => handleProfileUpdate(e.target.value)}
              disabled={isSaving}
              className="p-2 border rounded-lg bg-white dark:bg-zinc-900 dark:border-zinc-600 dark:text-white text-sm cursor-pointer shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Undeclared">Select Major...</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Nursing">Nursing</option>
              <option value="Business">Business</option>
              <option value="Psychology">Psychology</option>
              <option value="Biology">Biology</option>
              <option value="Engineering">Engineering</option>
              <option value="English">English</option>
              <option value="Criminal Justice">Criminal Justice</option>
              <option value="Mass Communication">Mass Communication</option>
              <option value="Kinesiology">Kinesiology</option>
              <option value="Political Science">Political Science</option>
              <option value="History">History</option>
            </select>
            {isSaving && <span className="text-xs text-zinc-500 dark:text-zinc-400 animate-pulse font-medium">Saving...</span>}
          </div>
        </div>
        
        <div className="mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Current Tasks
            </h2>
            <div className="flex flex-wrap items-center gap-3">
                <select 
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="p-2 text-sm rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="IMMEDIATE">Immediate</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="p-2 text-sm rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Sort by Due Date</option>
                  <option value="priority">Sort by Priority</option>
                </select>

            {/* overloaded badge! */}
            <div
              className={`px-4 py-1 text-sm rounded-full border font-semibold ${
                // tailwind classes to switch between
                // red if true and green if false, below
                isOverloaded
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              {isOverloaded ? "Overloaded" : "On Track"}
            </div>
          </div>
        </div>

          {/* The Loading State & Task Loop */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <p className="text-zinc-500 animate-pulse text-lg">
                  Loading your schedule please wait...
                </p>
              </div>
            ) : filteredTasks.length > 0 ? (

              filteredTasks.map((task) => {
                  const taskId = task._id?.toString() || task._id;

                  const suggestion = scheduleSuggestions.find(
                    (s) => s._id === taskId
                  );

                  return (
                    <AssignmentCard
                      key={taskId}
                      id={taskId}
                      title={task.title}
                      dueDate={task.dueDate}
                      duration={task.duration || 0}
                      priorityPercentage={calculatePriority(
                        task.priority,
                        task.customPercentage
                      )}
                      priorityWord={task.priority}
                      customPercentage={task.customPercentage}
                      onUpdate={fetchAssignments}
                      suggestedDate={suggestion?.suggestedDate}
                      onAcceptSuggestion={handleAcceptSuggestion}
                      isDelayed={suggestion?.isDelayed}
                      isCritical={suggestion?.isCritical}
                      courseCode={task.courseCode || ""}
                      keywords={task.keywords || []}
                      isActionable={task.isActionable !== false}
                      userMajor={userSettings.major}
                      userUniversity={userSettings.university}
                    />
                  );
                })
            ) : (
              <div className="text-center py-20 bg-white dark:bg-zinc-800 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
                <p className="text-zinc-500">
                {tasks.length === 0
                  ? "You are all caught up! Enjoy your day."
                  : "No tasks match your current filters."}
                </p>{" "}
                {/* show caught up message if no work left*/}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}