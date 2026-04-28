"use client";

import { useState, useEffect } from "react";
import { generateResources } from "@/lib/resourceGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { withFirebaseUserHeaders } from "@/lib/apiHeaders";

type AssignmentProps = {
  id: string;
  title: string;
  dueDate: string;
  duration: number;
  priorityPercentage: number;
  priorityWord: string;
  customPercentage?: number | null;
  onUpdate?: () => void;
  suggestedDate?: string;
  onAcceptSuggestion?: (id: string, newDate: string) => void;
  isDelayed?: boolean;
  isCritical?: boolean;
  courseCode?: string;
  keywords?: string[];
  isActionable?: boolean;
  userMajor?: string;
  userUniversity?: string;
  onComplete?: () => void;
  plannedDate?: string;
  dailyMinutesUsed?: number;
  maxDailyMinutes?: number;
};

export default function AssignmentCard({
  id,
  title,
  dueDate,
  duration,
  priorityPercentage,
  priorityWord,
  customPercentage,
  onUpdate,
  suggestedDate,
  onAcceptSuggestion,
  isDelayed,
  isCritical,
  courseCode = "",
  keywords = [],
  isActionable = true,
  userMajor = "Undeclared",
  userUniversity = "Texas State University",
  plannedDate,
  dailyMinutesUsed = 0,
  maxDailyMinutes = 0,
  onComplete
}: AssignmentProps) {

  const { currentUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [dismissedLateWarning, setDismissedLateWarning] = useState(false);

  const resources = generateResources(
    userUniversity,
    userMajor,
    courseCode,
    title,
    keywords
  );

  const safeFormatDate = (dateString?: string) => {
    if (!dateString) return "No date";
    const [year, month, day] = dateString.split("T")[0].split("-");
    return `${Number(month)}/${Number(day)}/${year}`;
  };

  const formatForInput = (dateString?: string) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  const [editData, setEditData] = useState({
    title: title || "",
    dueDate: formatForInput(dueDate),
    duration: duration ?? 60,
    priority: priorityWord || "low",
    customPercentage: customPercentage ?? null,
    plannedDate: formatForInput(plannedDate),
  });

  // ✅ FIX: keep plannedDate in sync with props
  useEffect(() => {
    setEditData((prev) => ({
      ...prev,
      plannedDate: formatForInput(plannedDate),
    }));
  }, [plannedDate]);

  useEffect(() => {
    setDismissedLateWarning(false);
  }, [plannedDate, dueDate]);

  // ✅ Autosave
  useEffect(() => {
    if (!isEditing) return;

    const delayDebounceFn = setTimeout(async () => {
      setIsSaving(true);

      try {
        if (!currentUser?.uid) return;

        await fetch(`/api/assignments/${id}`, {
          method: "PATCH",
          headers: withFirebaseUserHeaders(currentUser.uid, {
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            title: editData.title,
            dueDate: editData.dueDate,
            duration: Number(editData.duration),
            priority: editData.priority,
            customPercentage: editData.customPercentage,
            plannedDate: editData.plannedDate || null,
          }),
        });
      } catch (error) {
        console.error("Auto-save failed:", error);
      } finally {
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [editData, isEditing, currentUser?.uid, id]);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    onUpdate?.();
  };

  // ---------------- EDIT MODE ----------------
  if (isEditing) {
    return (
      <>
        {isSaving && (
          <p className="text-[10px] text-blue-500 font-bold animate-pulse mb-1 ml-1">
            Autosaving...
          </p>
        )}

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border-2 border-blue-500 mb-4 shadow-md">

          <input
            className="w-full p-2 rounded border"
            value={editData.title}
            onChange={(e) =>
              setEditData({ ...editData, title: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-3 mt-3">

            {/* Due Date */}
            <input
              type="date"
              value={editData.dueDate}
              onChange={(e) =>
                setEditData({ ...editData, dueDate: e.target.value })
              }
            />

            {/* Planned Date */}
            <input
              type="date"
              value={editData.plannedDate}
              onChange={(e) =>
                setEditData({ ...editData, plannedDate: e.target.value })
              }
            />

          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setIsEditing(false)}
              className="text-zinc-500"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-1 rounded"
            >
              Save
            </button>
          </div>
        </div>
      </>
    );
  }

  // ---------------- DISPLAY MODE ----------------

  const minutesRemaining = maxDailyMinutes - dailyMinutesUsed;

  return (
    <div
      className="p-4 border rounded-lg cursor-pointer"
      onClick={() => setIsEditing(true)}
    >
      <h3 className="font-bold">{title}</h3>

      {plannedDate ? (
        <p className="text-blue-600">
          Planned: {safeFormatDate(plannedDate)}
        </p>
      ) : (
        <p>Due: {safeFormatDate(dueDate)}</p>
      )}

      <p className="text-xs text-zinc-500">
        {minutesRemaining} mins left today
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete?.();
        }}
        className="mt-2 text-green-600"
      >
        ✓ Done
      </button>
    </div>
  );
}