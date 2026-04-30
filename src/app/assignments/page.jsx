"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import SavedAssignmentsList from "@/components/SavedAssignmentsList";

export default function AssignmentsPage() {
  const [savedAssignments, setSavedAssignments] = useState([]);
  const [message, setMessage] = useState("Loading assignments...");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("assignmentsData");

      if (!stored) {
        setMessage("No assignments found. Go sync Canvas first.");
        return;
      }

      const data = JSON.parse(stored);

      if (data.error) {
        setMessage(data.error);
        return;
      }

      const grouped = data.assignmentsByDay || {};

      const canvasAssignments = Object.entries(grouped).flatMap(
        ([date, assignments]) =>
          assignments.map((assignment, index) => ({
            id: assignment.assignmentId || `${date}-${index}-${assignment.title}`,
            title: assignment.title || "Untitled Assignment",
            minutes: 60,
            dueDate: date,
            courseName: assignment.courseName || "Unknown Course",
            descriptionText: assignment.descriptionText || "No description",
          }))
      );

      if (canvasAssignments.length === 0) {
        setMessage("No assignments found.");
        return;
      }

      setSavedAssignments(canvasAssignments);
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage("Could not load assignments data.");
    }
  }, []);

  function handleSaveEdit(id, updatedAssignment) {
    setSavedAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === id
          ? { ...assignment, ...updatedAssignment }
          : assignment
      )
    );
  }

  function handleDelete(id) {
    setSavedAssignments((prev) =>
      prev.filter((assignment) => assignment.id !== id)
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Assignments
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Your Canvas assignments will appear below.
            </p>
          </div>

          <Link
            href="/canvas"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Sync Canvas Again
          </Link>
        </div>

        {message && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-500 dark:text-red-300">
            {message}
          </div>
        )}

        <SavedAssignmentsList
          savedAssignments={savedAssignments}
          onSaveEdit={handleSaveEdit}
          onDelete={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}