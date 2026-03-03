"use client";

import { useEffect, useState } from "react";

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
    async function fetchOverload() {
      try {
        const res = await fetch("/api/overload");
        if (!res.ok) throw new Error("Failed to fetch overload data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError("Could not load workload status");
      } finally {
        setLoading(false);
      }
    }

    fetchOverload();
  }, []);

  if (loading) return null;
  if (error) return null;
  if (!data || !data.isOverloaded) return null;

  return (
    <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4">
      <strong className="font-semibold">Workload Overload Detected</strong>
      <p className="text-sm mt-1">
        You are overloaded by <b>{data.overloadHours} hours</b>
      </p>
      <p className="text-xs mt-1">
        Required: {data.requiredHours}h · Available: {data.availableHours}h
      </p>
      <p className="text-xs text-gray-600">
        Window: {data.windowStart} → {data.windowEnd}
      </p>
    </div>
  );
}
