"use client";

import { useEffect, useState } from "react";

type SavedAssignment = {
  id: number;
  title: string;
  minutes: number;
  dueDate: string;
};

type OverloadResult = {
  requiredHours: number;
  availableHours: number;
  overloadHours: number;
  isOverloaded: boolean;
  windowStart: string;
  windowEnd: string;
};

export default function OverloadBanner() {
  const [data, setData] = useState<OverloadResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("savedAssignments");
      const parsed: SavedAssignment[] = stored ? JSON.parse(stored) : [];

      const requiredMinutes = parsed.reduce(
        (total, assignment) => total + Number(assignment.minutes || 0),
        0
      );

     
      const availableHours = 5;
      const requiredHours = requiredMinutes / 60;
      const overloadHours = Math.max(0, requiredHours - availableHours);

      const dueDates = parsed
        .map((assignment) => assignment.dueDate)
        .filter(Boolean);

      const windowStart = dueDates.length > 0 ? dueDates[0] : "unknown";
      const windowEnd =
        dueDates.length > 0 ? dueDates[dueDates.length - 1] : "unknown";

      setData({
        requiredHours,
        availableHours,
        overloadHours,
        isOverloaded: requiredHours > availableHours,
        windowStart,
        windowEnd,
      });
    } catch (err) {
      setError("Could not load workload status");
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return null;
  if (error) return null;
  if (!data || !data.isOverloaded) return null;

  return (
    <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4">
      <strong className="font-semibold">Workload Overload Detected</strong>
      <p className="text-sm mt-1">
        You are overloaded by <b>{data.overloadHours.toFixed(1)} hours</b>
      </p>
      <p className="text-xs mt-1">
        Required: {data.requiredHours.toFixed(1)}h · Available: {data.availableHours}h
      </p>
      <p className="text-xs text-gray-600">
        Window: {data.windowStart} → {data.windowEnd}
      </p>
    </div>
  );
}