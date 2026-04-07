export default function AssignmentReviewForm({
  assignmentTitle,
  setAssignmentTitle,
  minutes,
  setMinutes,
  dueDate,
  setDueDate,
  editingId,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-xl border border-zinc-700 bg-zinc-950 p-6 shadow-lg"
    >
      <h2 className="text-2xl font-bold text-white">
        {editingId !== null
          ? "Edit Saved Assignment"
          : "Review Extracted Assignment Details"}
      </h2>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-200">
          Assignment Title
        </label>
        <input
          type="text"
          value={assignmentTitle}
          onChange={(e) => setAssignmentTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-400 outline-none focus:border-blue-400"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-200">
          Estimated Minutes
        </label>
        <input
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-400 outline-none focus:border-blue-400"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-200">
          Due Date
        </label>
        <input
          type="text"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-400 outline-none focus:border-blue-400"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-green-600 px-5 py-3 text-white font-medium hover:bg-green-500"
        >
          {editingId !== null ? "Save Changes" : "Confirm Details"}
        </button>

        {editingId !== null && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-zinc-700 px-5 py-3 text-white font-medium hover:bg-zinc-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}