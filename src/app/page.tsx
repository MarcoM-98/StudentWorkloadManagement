"use client";
<<<<<<< HEAD
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import HomePage from '@/components/HomePage';

export default function Page() {
  const { userLoggedIn } = useAuth();

  if (userLoggedIn) {
    return <HomePage />;
  }

  return <AuthForm />;
=======

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AssignmentCard from "@/components/AssignmentCard";
import OverloadBanner from "@/components/OverloadBanner";
import ScheduleGrid from "@/components/ScheduleGrid";
import { suggestNewSchedule } from "@/lib/rescheduler";

type Task = {
  _id: string;
  title: string;
  dueDate: string;
  priority: string;
  priorityPercentage: number;
  customPercentage?: number | null;
  id: number;
  duration: number;
  courseCode?: string;
  keywords?: string[];
  isActionable?: boolean;
  source?: "local" | "canvas";
};

function calculatePriority(priorityWord: string, customNumber?: number | null) {
  if (customNumber !== null && customNumber !== undefined) {
    return customNumber;
  }

  if (priorityWord === "IMMEDIATE") return 100;
  if (priorityWord === "medium") return 50;
  if (priorityWord === "low") return 20;

  return 0;
}

function canvasAssignmentsToTasks(assignmentsByDay: any): Task[] {
  return Object.entries(assignmentsByDay || {}).flatMap(
    ([date, assignments]: [string, any]) =>
      assignments.map((assignment: any, index: number) => ({
        _id: `canvas-${assignment.assignmentId || `${date}-${index}`}`,
        id: Number(assignment.assignmentId) || Date.now() + index,
        title: assignment.title || "Untitled Assignment",
        dueDate: date,
        priority: "medium",
        priorityPercentage: 50,
        customPercentage: null,
        duration: assignment.minutes || 60,
        courseCode: assignment.courseName || "Canvas",
        keywords: ["canvas"],
        isActionable: true,
        source: "canvas",
      }))
  );
}

export default function Home() {
  const [viewMode, setViewMode] = useState("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleSuggestions, setScheduleSuggestions] = useState<any[]>([]);
  const [userSettings, setUserSettings] = useState({
    university: "Texas State University",
    major: "Undeclared",
  });
  const [isSaving, setIsSaving] = useState(false);

  const isOverloaded = false;

  const today = new Date();
today.setHours(0, 0, 0, 0);

const sortedTasks = [...tasks].sort((a, b) => {
  const classA = a.courseCode || "No Class";
  const classB = b.courseCode || "No Class";

  if (viewMode === "class") {
    const classCompare = classA.localeCompare(classB);
    if (classCompare !== 0) return classCompare;
  }

  const dateA = new Date(a.dueDate).getTime();
  const dateB = new Date(b.dueDate).getTime();

  return dateA - dateB;
});

const filteredTasks =
  viewMode === "past"
    ? sortedTasks.filter((task) => {
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
      })
    : sortedTasks;

function groupTasks(tasksToGroup: Task[]) {
  if (viewMode === "class") {
    return tasksToGroup.reduce((acc, task) => {
      const key = task.courseCode || "No Class";

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }

  if (viewMode === "date") {
    return tasksToGroup.reduce((acc, task) => {
      const key = task.dueDate || "No Date";

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }

  return {
    "All Assignments": tasksToGroup,
  };
}

const groupedTasks = groupTasks(filteredTasks);

  async function fetchAssignments() {
    try {
      const response = await fetch("/api/assignments");

      if (!response.ok) {
        throw new Error("Failed to fetch data from the server");
      }

      const dbTasks = await response.json();

      const normalizedDbTasks: Task[] = dbTasks.map((task: any) => ({
        ...task,
        source: "local",
        priorityPercentage:
          task.priorityPercentage ??
          calculatePriority(task.priority, task.customPercentage),
      }));

      let canvasTasks: Task[] = [];

      const storedCanvas = sessionStorage.getItem("assignmentsData");

      if (storedCanvas) {
        const canvasData = JSON.parse(storedCanvas);

        if (!canvasData.error) {
          canvasTasks = canvasAssignmentsToTasks(canvasData.assignmentsByDay);
        }
      }

      setTasks([...normalizedDbTasks, ...canvasTasks]);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  }

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

  async function handleProfileUpdate(newMajor: string) {
    setIsSaving(true);
    setUserSettings({ ...userSettings, major: newMajor });

    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ major: newMajor }),
      });
    } catch (e) {
      console.error(e);
    }

    setIsSaving(false);
  }

  function handleOptimizeSchedule() {
    const results = suggestNewSchedule(tasks, 300);
    setScheduleSuggestions(results);
    console.log("Optimization calculated successfully!");
  }

  async function handleAcceptSuggestion(taskId: string, newDate: string) {
    if (taskId.startsWith("canvas-")) {
      alert("Canvas assignments cannot be updated in MongoDB.");
      return;
    }

    try {
      const response = await fetch(`/api/assignments/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: newDate }),
      });

      if (response.ok) {
        await fetchAssignments();

        setScheduleSuggestions((prev) =>
          prev.filter((s) => s._id !== taskId)
        );

        console.log("Database updated successfully");
      }
    } catch (error) {
      console.error("Failed to accept suggestion:", error);
    }
  }

  useEffect(() => {
    fetchAssignments();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (tasks.length > 0 && scheduleSuggestions.length === 0) {
      console.log("Automatically running rescheduler logic...");
      handleOptimizeSchedule();
    }
  }, [tasks, scheduleSuggestions]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <OverloadBanner />

        <div className="mt-6">
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-white">
              Schedule View
            </h2>

            <ScheduleGrid tasks={tasks} />
          </div>

          <div
            className={`mt-6 rounded-xl border p-4 transition-all ${
              userSettings.major === "Undeclared"
                ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                : "flex flex-col items-center justify-between border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 md:flex-row"
            }`}
          >
            <div className="mb-2 md:mb-0">
              <h2
                className={`font-bold ${
                  userSettings.major === "Undeclared"
                    ? "mb-2 text-lg text-blue-800 dark:text-blue-300"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {userSettings.major === "Undeclared"
                  ? "Personalize Your Academic Search!"
                  : "Academic Profile"}
              </h2>

              {userSettings.major === "Undeclared" && (
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Select your major to get personalized study links.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <select
                value={userSettings.major}
                onChange={(e) => handleProfileUpdate(e.target.value)}
                disabled={isSaving}
                className="cursor-pointer rounded-lg border bg-white p-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
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

              {isSaving && (
                <span className="animate-pulse text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Saving...
                </span>
              )}
            </div>
          </div>

          <div className="mt-8">
             <div className="mb-4 flex items-center gap-3">
    <label className="text-sm text-zinc-600 dark:text-zinc-400">
      View:
    </label>

    <select
      value={viewMode}
      onChange={(e) => setViewMode(e.target.value)}
      className="rounded-lg border bg-white px-3 py-2 text-sm dark:bg-zinc-900 dark:border-zinc-600 dark:text-white"
    >
      <option value="all">All Assignments</option>
      <option value="class">Group by Class</option>
      <option value="date">Group by Due Date</option>
      <option value="past">Past Due</option>
    </select>
  </div>

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Current Tasks
              </h2>

              <div
                className={`rounded-full border px-4 py-1 text-sm font-semibold ${
                  isOverloaded
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700"
                }`}
              >
                {isOverloaded ? "Overloaded" : "On Track"}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <p className="animate-pulse text-lg text-zinc-500">
                    Loading your schedule please wait...
                  </p>
                </div>
             ) : filteredTasks.length > 0 ? (
  Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
    <div key={groupName} className="flex flex-col gap-4">
      {viewMode !== "all" && (
        <h3 className="mt-4 rounded-lg bg-zinc-100 px-4 py-2 text-lg font-bold text-zinc-800 dark:bg-zinc-800 dark:text-white">
          {groupName}
        </h3>
      )}

      {groupTasks.map((task) => {
                  const suggestion = scheduleSuggestions.find(
                    (s) => s._id === (task._id?.toString() || task._id)
                  );

                  return (
                    <div key={task._id} className="relative">
                      {task.source === "canvas" && (
                        <div className="mb-2 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                          Canvas Assignment
                        </div>
                      )}

                      <AssignmentCard
                        id={task._id?.toString() || task._id}
                        title={task.title}
                        dueDate={task.dueDate}
                        duration={task.duration || 0}
                        priorityPercentage={task.priorityPercentage}
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
                   </div>
                  );
                })}
      </div>
    ))
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-300 bg-white py-20 text-center dark:border-zinc-700 dark:bg-zinc-800">
                  <p className="text-zinc-500">
                    You are all caught up! Enjoy your day.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
>>>>>>> 0eff674 (SCRUM-102)
}