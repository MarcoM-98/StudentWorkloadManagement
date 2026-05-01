"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/AuthForm";
import DashboardLayout from "@/components/DashboardLayout";
import AssignmentCard from "@/components/AssignmentCard";
import OverloadBanner from "@/components/OverloadBanner";
import ScheduleGrid from "@/components/ScheduleGrid";
import { suggestNewSchedule } from "@/lib/rescheduler";
import WorkloadSummary from "@/components/WorkloadSummary";

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
  descriptionText?: string;
  canvasUrl?: string;
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
        descriptionText: assignment.descriptionText || "No description",
        canvasUrl: assignment.htmlUrl || assignment.url || "",
      }))
  );
}

export default function Page() {
  const { userLoggedIn } = useAuth();

  if (!userLoggedIn) {
    return <AuthForm />;
  }

  return <Home />;
}

/* ================= DASHBOARD ================= */

function Home() {
  const [viewMode, setViewMode] = useState("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleSuggestions, setScheduleSuggestions] = useState<any[]>([]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedTasks = [...tasks].sort((a, b) => {
    const classA = a.courseCode || "No Class";
    const classB = b.courseCode || "No Class";

    if (viewMode === "class") {
      const classCompare = classA.localeCompare(classB);
      if (classCompare !== 0) return classCompare;
    }
    const workloadBlocks = tasks.map((task) => ({
  id: task._id,
  title: task.title,
  blockDate: task.dueDate,
  durationMinutes: task.duration || 60,
  priority: task.priority,
  customPercentage: task.customPercentage,
}));

    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const filteredTasks =
    viewMode === "past"
      ? sortedTasks.filter((task) => new Date(task.dueDate) < today)
      : sortedTasks;

  function groupTasks(tasksToGroup: Task[]) {
    if (viewMode === "class") {
      return tasksToGroup.reduce((acc, task) => {
        const key = task.courseCode || "No Class";
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {} as Record<string, Task[]>);
    }

    if (viewMode === "date") {
      return tasksToGroup.reduce((acc, task) => {
        const key = task.dueDate;
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {} as Record<string, Task[]>);
    }

    return { All: tasksToGroup };
  }

  const groupedTasks = groupTasks(filteredTasks);

  async function fetchAssignments() {
    const res = await fetch("/api/assignments");
    const dbTasks = await res.json();

    const normalized = dbTasks.map((task: any) => ({
      ...task,
      priorityPercentage:
        task.priorityPercentage ??
        calculatePriority(task.priority, task.customPercentage),
    }));

    const stored = sessionStorage.getItem("assignmentsData");
    let canvasTasks: Task[] = [];

    if (stored) {
      const data = JSON.parse(stored);
      if (!data.error) {
        canvasTasks = canvasAssignmentsToTasks(data.assignmentsByDay);
      }
    }

    setTasks([...normalized, ...canvasTasks]);
    setLoading(false);
  }

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (tasks.length > 0 && scheduleSuggestions.length === 0) {
      setScheduleSuggestions(suggestNewSchedule(tasks, 300));
    }
  }, [tasks]);

  return (
    <DashboardLayout>
     <OverloadBanner tasks={tasks} /> 

      <ScheduleGrid tasks={tasks} />

      {/* FILTER */}
      <div className="mb-4">
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          className="rounded border p-2"
        >
          <option value="all">All</option>
          <option value="class">By Class</option>
          <option value="date">By Date</option>
          <option value="past">Past Due</option>
        </select>
      </div>

      {/* TASKS */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        Object.entries(groupedTasks).map(([group, groupTasks]) => (
          <div key={group}>
            <h3 className="font-bold">{group}</h3>

            {groupTasks.map((task) => (
              <AssignmentCard
                key={task._id}
                id={task._id}
                title={task.title}
                dueDate={task.dueDate}
                duration={task.duration}
                priorityPercentage={task.priorityPercentage}
                priorityWord={task.priority}
                onUpdate={fetchAssignments}
              />
            ))}
          </div>
        ))
      )}
    </DashboardLayout>
  );
}