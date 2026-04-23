"use client";

type ScheduleGridHeaderProps = {
  startLabel: string;
  endLabel: string;
  dailyCapacityHours: number;
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
};

export default function ScheduleGridHeader({
  startLabel,
  endLabel,
  dailyCapacityHours,
  onPrevious,
  onToday,
  onNext,
}: ScheduleGridHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-400">Showing</p>
        <p className="text-base font-semibold text-white">
          {startLabel} - {endLabel}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Daily capacity: {dailyCapacityHours.toFixed(0)}h
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
        >
          ←
        </button>

        <button
          type="button"
          onClick={onToday}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
        >
          Today
        </button>

        <button
          type="button"
          onClick={onNext}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
        >
          →
        </button>
      </div>
    </div>
  );
}