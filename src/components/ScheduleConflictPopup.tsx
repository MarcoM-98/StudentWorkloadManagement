"use client";

import type { PendingConflict } from "@/lib/scheduleCollision";

type ScheduleConflictPopupProps = {
  pendingConflict: PendingConflict;
  onCancel: () => void;
  onForcePlace: () => void;
  onFitAtEnd: () => void;
};

export default function ScheduleConflictPopup({
  pendingConflict,
  onCancel,
  onForcePlace,
  onFitAtEnd,
}: ScheduleConflictPopupProps) {
  return (
    <div
      className="pointer-events-auto absolute z-50 w-56 rounded-lg border border-amber-500/40 bg-zinc-950 p-3 shadow-xl"
      style={{
        left: `${pendingConflict.popupPosition.x}px`,
        top: `${pendingConflict.popupPosition.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 text-sm font-semibold text-amber-300">
        Warning: placement will push back {pendingConflict.conflictBlockIds.length}{" "}
        task{pendingConflict.conflictBlockIds.length === 1 ? "" : "s"}
      </div>

      <div className="mb-3 text-xs text-zinc-400">
        Choose how to resolve this placement.
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="mb-2 w-full rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={onForcePlace}
        className="mb-2 w-full rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500"
      >
        Force Place
      </button>

      <button
        type="button"
        onClick={onFitAtEnd}
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
      >
        Fit at End
      </button>
    </div>
  );
}