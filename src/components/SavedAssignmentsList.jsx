export default function SavedAssignmentsList({
  savedAssignments,
  onEdit,
  onDelete,
}) {
  if (savedAssignments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-950 p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-white">Saved Local Assignments</h2>

      <div className="space-y-3">
        {savedAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="rounded-lg border border-zinc-700 bg-zinc-900 p-4"
          >
            <p className="text-white font-semibold">{assignment.title}</p>
            <p className="text-zinc-300">
              Estimated Minutes: {assignment.minutes}
            </p>
            <p className="text-zinc-300 mb-4">Due Date: {assignment.dueDate}</p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onEdit(assignment)}
                className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-500"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => onDelete(assignment.id)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}