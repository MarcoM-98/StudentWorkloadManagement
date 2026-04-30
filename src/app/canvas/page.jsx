"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CanvasPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchAssignments() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/canvas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      console.log("Canvas API response:", data);

      if (!res.ok || data.error) {
        setError(data.error || "Failed to fetch assignments.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("assignmentsData", JSON.stringify(data));
      router.push("/assignments");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while fetching assignments.");
      setLoading(false);
    }
  }

  return (
    <main className="p-6 bg-black text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4">
        Canvas Assignment Import
      </h1>

      <p className="mb-4 text-gray-400">
        Paste your Canvas API token below.
      </p>

      <input
        type="password"
        placeholder="Paste Canvas access token here"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="w-full max-w-xl p-3 mb-4 rounded bg-gray-900 border border-gray-700"
      />

      <button
        onClick={fetchAssignments}
        disabled={loading || !token.trim()}
        className="w-full max-w-xl p-3 bg-blue-600 rounded disabled:bg-gray-600"
      >
        {loading ? "Loading..." : "Fetch Canvas Assignments"}
      </button>

      {error && <p className="mt-4 text-red-500">{error}</p>}
    </main>
  );
}