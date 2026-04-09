"use client";

import { useState } from "react";

function formatDisplayDate(dateString) {
  if (!dateString) return "No date";

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "No date";

  return date.toLocaleDateString();
}

function normalizeDateForInput(dateString) {
  if (!dateString) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().split("T")[0];
}

export default function SavedAssignmentsList({
  savedAssignments,
  onSaveEdit,
  onDelete,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    minutes: 60,
    dueDate: "",
  });

  if (savedAssignments.length === 0) {
    return null;
  }

  function startEditing(assignment) {
    setEditingId(assignment.id);
    setEditData({
      title: assignment.title || "",
      minutes: assignment.minutes ?? 60,
      dueDate: normalizeDateForInput(assignment.dueDate),
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setEditData({
      title: "",
      minutes: 60,
      dueDate: "",
    });
  }

  function handleSave(id) {
    onSaveEdit(id, {
      title: editData.title,
      minutes: Number(editData.minutes) || 0,
      dueDate: editData.dueDate,
    });

    cancelEditing();
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-950 p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-white">Saved Local Assignments</h2>

      <div className="space-y-4">
        {savedAssignments.map((assignment) => {
          const isEditing = editingId === assignment.id;

          if (isEditing) {
            return (
              <div
                key={assignment.id}
                className="rounded-xl border border-zinc-700 bg-zinc-900 p-8 shadow-md"
              >
                <div className="space-y-5">
                  <h3 className="text-4xl font-bold text-white">
                    Edit Saved Assignment
                  </h3>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-300">
                      Assignment Title
                    </label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) =>
                        setEditData({ ...editData, title: e.target.value })
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-white outline-none focus:border-blue-500"
                      placeholder="Assignment Title"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm uppercase text-zinc-400">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={editData.dueDate}
                        onChange={(e) =>
                          setEditData({ ...editData, dueDate: e.target.value })
                        }
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm uppercase text-zinc-400">
                        Duration (Min)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editData.minutes}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            minutes: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="rounded-lg border border-zinc-600 bg-zinc-800 px-5 py-3 text-white transition hover:border-zinc-500 hover:bg-zinc-700"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSave(assignment.id)}
                      className="rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-500"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={assignment.id}
              className="rounded-lg border border-zinc-700 bg-zinc-900 p-4"
            >
              <p className="text-white font-semibold">{assignment.title}</p>
              <p className="text-zinc-300">
                Estimated Minutes: {assignment.minutes}
              </p>
              <p className="mb-4 text-zinc-300">
                Due Date: {formatDisplayDate(assignment.dueDate)}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => startEditing(assignment)}
                  className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:border-blue-500 hover:bg-zinc-700 hover:text-blue-300"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(assignment.id)}
                  className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:border-red-500 hover:bg-zinc-700 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}